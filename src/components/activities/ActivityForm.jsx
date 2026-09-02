import React, { useMemo, useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import Modal from '../shared/Modal'
import Field, { inputCls } from '../shared/Field'
import SkillsPicker from './SkillsPicker'
import { PROJECTS } from '../../lib/constants'
import { todayKey } from '../../lib/week'

const skillTokens = (s) =>
  String(s || '')
    .split(/[,،]/)
    .map((t) => t.trim())
    .filter(Boolean)

// יום בשבוע בעברית מתוך תאריך (YYYY-MM-DD), ללא בעיות אזור-זמן.
const hebrewDay = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  return isNaN(d) ? '' : d.toLocaleDateString('he-IL', { weekday: 'long' })
}

const matchScore = (instructor, required) => {
  const req = skillTokens(required)
  if (!req.length) return 0
  const inst = skillTokens(instructor.skills)
  return req.filter((r) => inst.some((x) => x.includes(r) || r.includes(x))).length
}

export default function ActivityForm({
  onClose,
  onSave,
  branches,
  instructors,
  defaultBranchId,
  lockBranch = false,
  activity,
  onDelete,
  skillOptions = [],
  onAddSkillOption,
  onDeleteSkillOption,
  canManageSkills = false,
}) {
  const isEdit = !!activity
  const today = useMemo(() => todayKey(), [])
  const [form, setForm] = useState({
    name: activity?.name || '',
    project: activity?.project || PROJECTS[0],
    activity_date: activity?.activity_date || '',
    activity_time: (activity?.activity_time || '').slice(0, 5),
    location: activity?.location || '',
    branch_id: activity?.branch_id || defaultBranchId || branches[0]?.id || '',
    status: activity?.status || 'planning',
    required_skills: activity?.required_skills || '',
    participants: activity?.participants ?? 0,
    cost: activity?.cost ?? 0,
    instructorIds: (activity?.instructors || [])
      .map((r) => r.profile?.id)
      .filter(Boolean),
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [removing, setRemoving] = useState(false)

  const remove = async () => {
    setRemoving(true)
    setError(null)
    try {
      await onDelete()
      onClose()
    } catch (err) {
      setError(err.message || 'שגיאה במחיקה')
      setRemoving(false)
    }
  }

  const ranked = useMemo(
    () =>
      [...instructors]
        .map((i) => ({ ...i, score: matchScore(i, form.required_skills) }))
        .sort((a, b) => b.score - a.score),
    [instructors, form.required_skills],
  )

  const submit = async () => {
    if (!form.name.trim()) {
      setError('יש להזין תיאור פעילות')
      return
    }
    if (!form.activity_date) {
      setError('יש לבחור תאריך לפעילות')
      return
    }
    // אין לקבוע תאריך שעבר. חריג: עריכת פעילות קיימת שתאריכה כבר בעבר
    // ולא שונה — לא חוסמים כדי לאפשר עדכון פרטים היסטוריים.
    if (
      form.activity_date < today &&
      form.activity_date !== activity?.activity_date
    ) {
      setError('לא ניתן לקבוע פעילות לתאריך שעבר')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSave({
        ...form,
        participants: Number(form.participants) || 0,
        cost: Number(form.cost) || 0,
        activity_time: form.activity_time || null,
        location: form.location?.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'שגיאה בשמירה')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'עריכת פעילות' : 'הוספת פעילות חדשה'}
      onClose={onClose}
    >
      <Field label="תיאור הפעילות">
        <textarea
          className={inputCls}
          rows={3}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="מה הולך להיות בפעילות?"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="פרויקט (קטגוריה)">
          <select
            className={inputCls}
            value={form.project}
            onChange={(e) => setForm({ ...form, project: e.target.value })}
          >
            {PROJECTS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="תאריך">
          <input
            type="date"
            className={inputCls}
            value={form.activity_date}
            min={today}
            onChange={(e) => setForm({ ...form, activity_date: e.target.value })}
          />
          {hebrewDay(form.activity_date) && (
            <p className="text-[11px] text-emerald-700 mt-1">
              {hebrewDay(form.activity_date)}
            </p>
          )}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="שעה">
          <input
            type="time"
            className={inputCls}
            value={form.activity_time}
            onChange={(e) => setForm({ ...form, activity_time: e.target.value })}
          />
        </Field>
        <Field label="מקום הפעילות">
          <input
            className={inputCls}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="לדוגמה: מתנ״ס שכונה ג׳"
          />
        </Field>
      </div>
      <Field label="סניף">
        {lockBranch ? (
          <input
            className={inputCls}
            value={branches.find((b) => b.id === form.branch_id)?.name || ''}
            disabled
          />
        ) : (
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
        )}
      </Field>
      <Field label="מיומנויות נדרשות">
        <SkillsPicker
          value={form.required_skills}
          onChange={(v) => setForm((f) => ({ ...f, required_skills: v }))}
          options={skillOptions}
          onAddOption={onAddSkillOption}
          onDeleteOption={onDeleteSkillOption}
          canManage={canManageSkills}
        />
      </Field>
      <Field label="שיבוץ מדריכים — ממוינים לפי התאמת מיומנויות">
        <div className="space-y-1.5">
          {ranked.length === 0 && (
            <p className="text-xs text-stone-400 px-2 py-3">
              אין מדריכים רשומים. ניתן לרשום מדריכים בעת ההצטרפות למערכת.
            </p>
          )}
          {ranked.map((i) => {
            const on = form.instructorIds.includes(i.id)
            const rec = i.score > 0
            return (
              <button
                key={i.id}
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    instructorIds: on
                      ? f.instructorIds.filter((x) => x !== i.id)
                      : [...f.instructorIds, i.id],
                  }))
                }
                className={`w-full flex items-center justify-between text-right px-3 py-2 rounded-xl border ${
                  on ? 'bg-emerald-600 border-emerald-600' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <span>
                  <span
                    className={`font-semibold text-sm ${on ? 'text-white' : 'text-stone-700'}`}
                  >
                    {i.name}
                  </span>
                  <span
                    className={`block text-[11px] ${on ? 'text-emerald-100' : 'text-stone-400'}`}
                  >
                    {i.skills || '—'}
                  </span>
                </span>
                {rec && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      on ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <Star size={10} className="fill-current" />
                    מומלץ
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-stone-400 mt-1">
          ההמלצה מבוססת על התאמת מיומנויות המדריך לדרישות הפעילות.
        </p>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="מס׳ משתתפים">
          <input
            type="number"
            className={inputCls}
            value={form.participants}
            onChange={(e) => setForm({ ...form, participants: e.target.value })}
          />
        </Field>
        <Field label="עלות (₪)">
          <input
            type="number"
            className={inputCls}
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
          />
        </Field>
      </div>

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
        {busy ? 'שומר…' : 'שמירה'}
      </button>

      {isEdit && onDelete && (
        <div className="mt-4 pt-4 border-t border-stone-200">
          <p className="text-xs text-stone-400 mb-2">מחיקת הפעילות</p>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-rose-700 flex-1">
                למחוק את הפעילות לצמיתות?
              </span>
              <button
                onClick={remove}
                disabled={removing}
                className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-semibold text-sm"
              >
                {removing ? '…' : 'כן, מחק'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={removing}
                className="text-xs text-stone-500 hover:text-stone-700 px-2"
              >
                ביטול
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 px-3 py-2 rounded-lg font-semibold text-sm"
            >
              <Trash2 size={15} /> מחק פעילות
            </button>
          )}
        </div>
      )}
    </Modal>
  )
}
