import React, { useState } from 'react'
import { Star } from 'lucide-react'
import Modal from '../shared/Modal'
import Field, { inputCls } from '../shared/Field'

export default function DebriefModal({ activity, onClose, onSave }) {
  const [rating, setRating] = useState(activity.rating || 0)
  const [note, setNote] = useState(activity.debrief_note || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await onSave({ rating, debrief_note: note, status: 'done' })
      onClose()
    } catch (err) {
      setError(err.message || 'שגיאה בשמירה')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="תחקור פעילות" onClose={onClose}>
      <Field label="דירוג שביעות רצון משתתפים">
        <div className="flex gap-1">
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
        </div>
      </Field>
      <Field label="חוות דעת וסיכום תחקור">
        <textarea
          className={inputCls}
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="מה עבד, מה נדרש לשפר, הערות לפעם הבאה…"
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
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold mt-2"
      >
        {busy ? 'שומר…' : 'שמירת תחקור'}
      </button>
    </Modal>
  )
}
