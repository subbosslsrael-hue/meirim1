import React, { useState } from 'react'
import { Star } from 'lucide-react'
import Modal from '../shared/Modal'
import Field, { inputCls } from '../shared/Field'
import { PROJECTS } from '../../lib/constants'

// עריכת תחקור פעילות שכבר נשמר בארכיון — שם, פרויקט, תאריך, מקום,
// משתתפים, דירוג, וטקסטי התחקור. onSave מקבל את העדכונים ומחזיר Promise.
export default function EditDebriefModal({ archive, onClose, onSave }) {
  const [name, setName] = useState(archive.name || '')
  const [project, setProject] = useState(archive.project || '')
  const [activityDate, setActivityDate] = useState(archive.activity_date || '')
  const [activityTime, setActivityTime] = useState(archive.activity_time || '')
  const [location, setLocation] = useState(archive.location || '')
  const [participants, setParticipants] = useState(archive.participants ?? '')
  const [signedCount, setSignedCount] = useState(archive.signed_count ?? '')
  const [rating, setRating] = useState(archive.rating || 0)
  const [good, setGood] = useState(archive.what_was_good || '')
  const [improve, setImprove] = useState(archive.what_needs_improvement || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // רשימת פרויקטים לבחירה — כולל הערך הקיים גם אם אינו ברשימה הקבועה.
  const projectOptions =
    project && !PROJECTS.includes(project) ? [project, ...PROJECTS] : PROJECTS

  const toNum = (v) => (v === '' || v === null ? null : Number(v))

  const submit = async () => {
    if (!name.trim()) {
      setError('יש להזין שם פעילות')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSave({
        name: name.trim(),
        project: project || null,
        activity_date: activityDate || null,
        activity_time: activityTime || null,
        location: location.trim() || null,
        participants: toNum(participants),
        signed_count: toNum(signedCount),
        rating: rating || null,
        what_was_good: good.trim() || null,
        what_needs_improvement: improve.trim() || null,
      })
      onClose()
    } catch (e) {
      setError(e.message || 'שגיאה בשמירה')
      setBusy(false)
    }
  }

  return (
    <Modal title="עריכת תחקור פעילות" onClose={onClose}>
      <Field label="שם הפעילות">
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field label="פרויקט">
        <select
          className={inputCls}
          value={project}
          onChange={(e) => setProject(e.target.value)}
        >
          <option value="">— ללא פרויקט —</option>
          {projectOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="תאריך">
          <input
            type="date"
            className={inputCls}
            value={activityDate}
            onChange={(e) => setActivityDate(e.target.value)}
          />
        </Field>
        <Field label="שעה">
          <input
            type="time"
            className={inputCls}
            value={activityTime}
            onChange={(e) => setActivityTime(e.target.value)}
          />
        </Field>
      </div>

      <Field label="מקום">
        <input
          className={inputCls}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="מיקום הפעילות"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="משתתפים">
          <input
            type="number"
            min="0"
            className={inputCls}
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
          />
        </Field>
        <Field label="נרשמו">
          <input
            type="number"
            min="0"
            className={inputCls}
            value={signedCount}
            onChange={(e) => setSignedCount(e.target.value)}
          />
        </Field>
      </div>

      <Field label="דירוג שביעות רצון">
        <div className="flex gap-1 items-center">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)}>
              <Star
                size={26}
                className={
                  n <= rating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'
                }
              />
            </button>
          ))}
          {rating > 0 && (
            <button
              type="button"
              onClick={() => setRating(0)}
              className="text-xs text-stone-400 hover:text-rose-600 mr-2"
            >
              נקה
            </button>
          )}
        </div>
      </Field>

      <Field label="מה היה טוב?">
        <textarea
          className={inputCls}
          rows={3}
          value={good}
          onChange={(e) => setGood(e.target.value)}
        />
      </Field>

      <Field label="מה טעון שיפור לפעם הבאה?">
        <textarea
          className={inputCls}
          rows={3}
          value={improve}
          onChange={(e) => setImprove(e.target.value)}
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
        {busy ? 'שומר…' : 'שמירת שינויים'}
      </button>
    </Modal>
  )
}
