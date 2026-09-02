import React, { useState } from 'react'
import Modal from '../shared/Modal'
import Field, { inputCls } from '../shared/Field'
import SkillsPicker from '../activities/SkillsPicker'
import {
  normalizePhone,
  isValidIsraeliPhone,
  sanitizePhoneInput,
} from '../../lib/phone'

// עריכת פרטים אישיים של איש צוות (שם / טלפון / גיל / מיומנות / סניף).
// isSelf → כותרת "הפרטים שלי". canEditBranch → הצגת בחירת סניף (מנכ"ל בלבד).
// onSave מקבל את העדכונים ומחזיר Promise.
export default function EditProfileModal({
  person,
  isSelf,
  branches = [],
  canEditBranch = false,
  skillOptions = [],
  onClose,
  onSave,
}) {
  const [name, setName] = useState(person.name || '')
  const [phone, setPhone] = useState(person.phone || '')
  const [age, setAge] = useState(person.age ?? '')
  const [skills, setSkills] = useState(person.skills || '')
  const [branchId, setBranchId] = useState(person.branch_id || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    if (!name.trim()) {
      setError('יש להזין שם')
      return
    }
    if (phone && !isValidIsraeliPhone(phone)) {
      setError('מספר טלפון לא תקין')
      return
    }
    const ageNum = age === '' || age === null ? null : Number(age)
    if (ageNum !== null && (Number.isNaN(ageNum) || ageNum < 0 || ageNum > 120)) {
      setError('גיל לא תקין')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const updates = {
        name: name.trim(),
        phone: phone ? normalizePhone(phone) : null,
        age: ageNum,
        skills: skills.trim() || null,
      }
      // סניף נערך רק ע"י מי שמורשה (מנכ"ל) — אחרת לא נוגעים בשדה.
      if (canEditBranch) updates.branch_id = branchId || null
      await onSave(updates)
      onClose()
    } catch (e) {
      setError(e.message || 'שגיאה בשמירה')
      setBusy(false)
    }
  }

  return (
    <Modal
      title={isSelf ? 'עריכת הפרטים שלי' : `עריכת פרטים — ${person.name}`}
      onClose={onClose}
    >
      <Field label="שם מלא">
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="טלפון">
          <input
            className={inputCls}
            value={phone}
            onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
            placeholder="0501234567"
            inputMode="numeric"
            maxLength={10}
          />
        </Field>
        <Field label="גיל">
          <input
            type="number"
            min="0"
            max="120"
            className={inputCls}
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </Field>
      </div>

      {canEditBranch && (
        <Field label="סניף">
          <select
            className={inputCls}
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">— ללא סניף —</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.city ? ` · ${b.city}` : ''}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="מיומנויות / כישורים (בחירה מהרשימה או כתיבה חופשית ב״אחר״)">
        <SkillsPicker
          value={skills}
          onChange={setSkills}
          options={skillOptions}
          canManage={false}
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
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold"
      >
        {busy ? 'שומר…' : 'שמירה'}
      </button>
    </Modal>
  )
}
