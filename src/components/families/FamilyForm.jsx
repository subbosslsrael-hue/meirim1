import React, { useState, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from '../shared/Modal'
import Field, { inputCls } from '../shared/Field'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../lib/constants'
import AddressAutocomplete from './AddressAutocomplete'
import { searchAddresses, searchCities } from '../../lib/geocode'

// מפריד כתובת מלאה ל{רחוב, מספר בית} — המספר הוא מספר (אופציונלי עם אות) בסוף.
const splitAddress = (full) => {
  const s = (full || '').trim()
  const m = s.match(/^(.*?)[\s,]+(\d+[א-תA-Za-z]?)$/)
  return m ? { street: m[1].trim(), house: m[2] } : { street: s, house: '' }
}
import {
  normalizePhone,
  isValidIsraeliPhone,
  sanitizePhoneInput,
} from '../../lib/phone'

export default function FamilyForm({
  onClose,
  onSave,
  onDelete,
  branches,
  profiles,
  defaultBranchId,
  defaultResponsibleId,
  family,
  existingFamilies = [],
}) {
  const isEdit = !!family
  const initAddr = splitAddress(family?.address)
  const [form, setForm] = useState({
    name: family?.name || '',
    branch_id: family?.branch_id || defaultBranchId || branches[0]?.id || '',
    city: family?.city || '',
    address: initAddr.street, // שם הרחוב בלבד (בלי מספר בית)
    house: initAddr.house, // מספר בית, שדה נפרד
    phone: family?.phone || '',
    need_category: family?.need_category || CATEGORIES[0],
    responsible_profile_id:
      family?.responsible_profile_id || defaultResponsibleId || '',
    notes: family?.notes || '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // קואורדינטות שנבחרו מתוך ההשלמה האוטומטית (כתובת אמיתית מהמאגר).
  // בעריכה, אם הכתובת כבר קיימת ולא שונתה — נחשיב אותה כ"נבחרה".
  const [pickedCoords, setPickedCoords] = useState(
    isEdit && family?.lat != null && family?.lng != null
      ? { lat: family.lat, lng: family.lng }
      : null,
  )
  // סימון ויזואלי בלבד שהעיר נבחרה מהרשימה (לא נדרש — אפשר גם ברירת מחדל לפי סניף).
  const [cityPicked, setCityPicked] = useState(isEdit && !!family?.city)

  const serviceProfiles = profiles.filter(
    (p) => p.role === 'service' && p.branch_id === form.branch_id,
  )

  // חיפוש כתובת מוגבל לעיר שנבחרה/הוקלדה (אם יש); אחרת חיפוש חופשי.
  const branchCity = branches.find((b) => b.id === form.branch_id)?.city || ''
  const scopeCity = form.city || branchCity
  const addressFetcher = useCallback(
    (q, opts) => searchAddresses(q, { ...opts, city: scopeCity }),
    [scopeCity],
  )

  const submit = async () => {
    if (!form.name.trim()) {
      setError('יש להזין שם משפחה')
      return
    }
    // כתובת: חייבת להיבחר מתוך רשימת ההשלמה האוטומטית (כתובת אמיתית מהמאגר),
    // כך שתמיד יש לה קואורדינטות והיא מופיעה במפה.
    if (!form.address.trim()) {
      setError('יש להזין כתובת')
      return
    }
    if (!pickedCoords) {
      setError('יש לבחור כתובת מתוך רשימת ההשלמה (הקלד/י ובחר/י כתובת מהרשימה)')
      return
    }
    if (!String(form.house).trim()) {
      setError('יש להזין מספר בית')
      return
    }
    if (!form.phone.trim()) {
      setError('יש להזין מספר טלפון')
      return
    }
    if (!isValidIsraeliPhone(form.phone)) {
      setError('מספר הטלפון אינו תקין (לדוגמה: 050-1234567)')
      return
    }
    if (!form.responsible_profile_id) {
      setError('יש לבחור בת שירות אחראית')
      return
    }
    // מניעת כפילויות. חשוב: בת שירות רואה (דרך RLS) רק את סניפה, ולכן בדיקה
    // מקומית לא תתפוס כפילות מסניף אחר. הבדיקה נעשית בשרת דרך RPC ב-SECURITY
    // DEFINER שמחזירה true/false בלבד — מבלי לחשוף פרטי משפחות מסניפים אחרים.
    const norm = (s) => (s || '').trim().toLowerCase()
    const phoneKey = normalizePhone(form.phone)
    const branch = branches.find((b) => b.id === form.branch_id)
    const city = form.city || branch?.city || ''

    // fallback מקומי (סניף נוכחי בלבד) — עד שה-RPC יותקן ב-DB, או אם הקריאה נכשלה.
    // כפילות = אותו שם + אותו טלפון. לא משווים כתובת/עיר, כי שם משפחה נפוץ
    // באותה עיר (ואף אותה כתובת בבניין דירות) הוא לגיטימי ואסור לחסום אותו.
    const localDuplicate = () =>
      existingFamilies.some((f) => {
        if (isEdit && f.id === family.id) return false
        if (!phoneKey) return false
        return (
          norm(f.name) === norm(form.name) &&
          normalizePhone(f.phone) === phoneKey
        )
      })

    setBusy(true)
    setError(null)
    try {
      const { data: dupData, error: dupErr } = await supabase.rpc(
        'family_duplicate_exists',
        {
          p_name: form.name,
          p_city: city,
          p_address: form.address,
          p_phone: phoneKey,
          p_exclude: isEdit ? family.id : null,
        },
      )
      // אם ה-RPC עדיין לא קיים ב-DB — נופלים לבדיקה המקומית.
      const isDup = dupErr ? localDuplicate() : dupData === true
      if (isDup) {
        setError(
          'כבר קיימת משפחה עם אותו שם ומספר טלפון. לא ניתן לשמור כפילות.',
        )
        return
      }

      // הקואורדינטות מגיעות ישירות מהכתובת שנבחרה בהשלמה האוטומטית —
      // אין צורך בגאוקוד נוסף, והמיקום מובטח.
      const lat = pickedCoords.lat
      const lng = pickedCoords.lng
      // איחוד שם הרחוב + מספר הבית לכתובת מלאה (house הוא שדה-טופס בלבד,
      // לא עמודה בטבלה — לכן מוציאים אותו מה-payload).
      const { house, ...rest } = form
      const fullAddress = [form.address.trim(), String(house).trim()]
        .filter(Boolean)
        .join(' ')
      await onSave({
        ...rest,
        address: fullAddress,
        city,
        phone: normalizePhone(form.phone),
        lat,
        lng,
        responsible_profile_id: form.responsible_profile_id || null,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'שגיאה בשמירה')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      await onDelete(family.id)
      onClose()
    } catch (err) {
      setError(err.message || 'שגיאה במחיקה')
      setDeleting(false)
    }
  }

  return (
    <Modal title={isEdit ? 'עריכת משפחה' : 'הוספת משפחה נתמכת'} onClose={onClose}>
      <Field label="שם המשפחה">
        <input
          className={inputCls}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="סניף">
          <select
            className={inputCls}
            value={form.branch_id}
            onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="עיר">
          <AddressAutocomplete
            value={form.city}
            picked={cityPicked && !!form.city}
            minChars={2}
            fetcher={searchCities}
            onType={(v) => {
              setForm((f) => ({ ...f, city: v }))
              setCityPicked(false)
            }}
            onPick={(r) => {
              setForm((f) => ({ ...f, city: r.city || r.label }))
              setCityPicked(true)
            }}
            placeholder="בחר/י עיר מהרשימה (ברירת מחדל לפי הסניף)"
          />
        </Field>
      </div>
      <div className="grid grid-cols-[1fr_5rem] gap-3">
        <Field label="רחוב (בחירה מרשימת כתובות אמיתיות)">
          <AddressAutocomplete
            value={form.address}
            picked={!!pickedCoords}
            fetcher={addressFetcher}
            onType={(v) => {
              // הקלדה ידנית מבטלת בחירה קודמת — חובה לבחור שוב מהרשימה.
              setForm((f) => ({ ...f, address: v }))
              setPickedCoords(null)
            }}
            onPick={(r) => {
              // מפרידים מספר בית שהגיע בטעות עם שם הרחוב לשדה הנפרד.
              const picked = splitAddress(r.street || r.label)
              setForm((f) => ({
                ...f,
                address: picked.street,
                house: picked.house || f.house,
                city: r.city || f.city,
              }))
              setPickedCoords({ lat: r.lat, lng: r.lng })
              if (r.city) setCityPicked(true)
            }}
            placeholder={
              scopeCity
                ? `שם רחוב ב${scopeCity} — בחר/י מהרשימה`
                : 'הקלד/י עיר + רחוב, ובחר/י מהרשימה'
            }
          />
        </Field>
        <Field label="מס׳ בית">
          <input
            className={inputCls}
            inputMode="numeric"
            value={form.house}
            onChange={(e) => setForm({ ...form, house: e.target.value })}
            placeholder="24"
          />
        </Field>
      </div>
      <Field label="טלפון">
        <input
          className={inputCls}
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: sanitizePhoneInput(e.target.value) })
          }
          placeholder="0501234567"
        />
      </Field>
      <Field label="סוג הצורך">
        <select
          className={inputCls}
          value={form.need_category}
          onChange={(e) => setForm({ ...form, need_category: e.target.value })}
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="בת שירות אחראית">
        <select
          className={inputCls}
          value={form.responsible_profile_id}
          onChange={(e) =>
            setForm({ ...form, responsible_profile_id: e.target.value })
          }
        >
          <option value="">— בחר/י בת שירות —</option>
          {serviceProfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {serviceProfiles.length === 0 && (
          <p className="text-[11px] text-amber-700 mt-1">
            אין בנות שירות משויכות לסניף זה — יש להוסיף בת שירות לסניף כדי לשייך.
          </p>
        )}
      </Field>
      <Field label="הערות">
        <textarea
          className={inputCls}
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="מידע נוסף על המשפחה (אופציונלי)"
        />
      </Field>

      {error && (
        <div className="text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl text-sm mb-2">
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={busy || deleting}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold mt-2"
      >
        {busy ? 'שומר ומאתר קואורדינטות…' : 'שמירה'}
      </button>

      {isEdit && onDelete && (
        <div className="mt-4 pt-4 border-t border-stone-100">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={busy || deleting}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 py-2 rounded-xl font-semibold disabled:opacity-50"
            >
              <Trash2 size={15} /> הסרת המשפחה מהמאגר
            </button>
          ) : (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
              <p className="text-sm text-rose-800 font-semibold mb-1">
                למחוק את "{family.name}" לצמיתות?
              </p>
              <p className="text-xs text-rose-600 mb-3">
                הפעולה תסיר את המשפחה מהמאגר ומכל יעדי החלוקה שלה. לא ניתן לבטל.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white py-2 rounded-xl font-semibold text-sm"
                >
                  {deleting ? 'מוחק…' : 'כן, מחק/י'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="flex-1 bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 py-2 rounded-xl font-semibold text-sm"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
