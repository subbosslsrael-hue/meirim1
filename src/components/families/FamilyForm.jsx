import React, { useState } from 'react'
import Modal from '../shared/Modal'
import Field, { inputCls } from '../shared/Field'
import { CATEGORIES } from '../../lib/constants'
import { geocodeAddress, fallbackForCity } from '../../lib/geocode'
import { normalizePhone, isValidIsraeliPhone } from '../../lib/phone'

export default function FamilyForm({
  onClose,
  onSave,
  branches,
  profiles,
  defaultBranchId,
  defaultResponsibleId,
  family,
}) {
  const isEdit = !!family
  const [form, setForm] = useState({
    name: family?.name || '',
    branch_id: family?.branch_id || defaultBranchId || branches[0]?.id || '',
    city: family?.city || '',
    address: family?.address || '',
    phone: family?.phone || '',
    need_category: family?.need_category || CATEGORIES[0],
    responsible_profile_id:
      family?.responsible_profile_id || defaultResponsibleId || '',
    notes: family?.notes || '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const serviceProfiles = profiles.filter(
    (p) => p.role === 'service' && p.branch_id === form.branch_id,
  )

  const submit = async () => {
    if (!form.name.trim()) {
      setError('יש להזין שם משפחה')
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
    setBusy(true)
    setError(null)
    try {
      const branch = branches.find((b) => b.id === form.branch_id)
      const city = form.city || branch?.city || ''
      // גאוקוד מחדש רק אם הכתובת/עיר השתנו (או במשפחה חדשה)
      let lat = family?.lat ?? null
      let lng = family?.lng ?? null
      const addressChanged =
        !isEdit || city !== family.city || form.address !== family.address
      if (addressChanged) {
        let coords = await geocodeAddress({ city, address: form.address })
        if (!coords) coords = fallbackForCity(city)
        lat = coords?.lat ?? null
        lng = coords?.lng ?? null
      }
      await onSave({
        ...form,
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
          <input
            className={inputCls}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="ברירת מחדל לפי הסניף"
          />
        </Field>
      </div>
      <Field label="כתובת">
        <input
          className={inputCls}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </Field>
      <Field label="טלפון">
        <input
          className={inputCls}
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="050-1234567"
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
          <option value="">— ללא שיוך —</option>
          {serviceProfiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
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
        disabled={busy}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold mt-2"
      >
        {busy ? 'שומר ומאתר קואורדינטות…' : 'שמירה'}
      </button>
    </Modal>
  )
}
