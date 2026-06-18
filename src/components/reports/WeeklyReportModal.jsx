import React, { useState } from 'react'
import { X, CalendarClock } from 'lucide-react'
import Field, { inputCls } from '../shared/Field'
import { supabase } from '../../lib/supabase'
import { currentReportWeek } from '../../lib/week'
import { PROJECTS } from '../../lib/constants'

// טופס דיווח שעות שבועי. blocking=true → חלון חוסם (בלי סגירה) לבת שירות.
export default function WeeklyReportModal({
  profile,
  activities = [],
  blocking = false,
  onClose,
  onSaved,
}) {
  const week = currentReportWeek()
  const [items, setItems] = useState([{ activity_id: '', hours: '' }])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const setItem = (idx, key, val) =>
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, [key]: val } : it)))
  const addItem = () => setItems((arr) => [...arr, { activity_id: '', hours: '' }])
  const removeItem = (idx) => setItems((arr) => arr.filter((_, i) => i !== idx))
  const total = items.reduce((s, it) => s + (Number(it.hours) || 0), 0)

  const insertRows = async (rows) => {
    const { error: err } = await supabase.from('activity_reports').insert(rows)
    if (err) throw err
    onSaved?.()
    onClose?.()
  }

  const submit = async () => {
    const valid = items.filter((it) => it.activity_id && Number(it.hours) > 0)
    if (!valid.length) {
      setError('יש לבחור לפחות פעילות אחת עם מספר שעות גדול מ-0')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await insertRows(
        valid.map((it) => {
          const act = activities.find((a) => a.id === it.activity_id)
          return {
            profile_id: profile.id,
            week,
            activity_id: it.activity_id,
            activity_name: act?.name || null,
            project: act?.project || PROJECTS[0],
            hours: Number(it.hours),
            note: note || null,
          }
        }),
      )
    } catch (e) {
      setError(e.message || 'שגיאה בשמירה')
      setBusy(false)
    }
  }

  const submitEmpty = async () => {
    setBusy(true)
    setError(null)
    try {
      await insertRows([
        {
          profile_id: profile.id,
          week,
          activity_id: null,
          activity_name: null,
          project: PROJECTS[0],
          hours: 0,
          note: note || 'אין פעילות לדווח השבוע',
        },
      ])
    } catch (e) {
      setError(e.message || 'שגיאה בשמירה')
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[3000] bg-black/60 flex items-center justify-center p-4"
      onClick={blocking ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <CalendarClock size={18} className="text-amber-500" />
            <h2 className="font-black text-stone-800">דיווח שעות שבועי</h2>
          </div>
          {!blocking && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <p className="text-xs text-stone-400 mb-3">שבוע {week}</p>

        {blocking && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            יש למלא את הדיווח השבועי כדי להמשיך. החלון ייסגר רק לאחר השמירה.
          </div>
        )}

        <div className="text-sm font-semibold text-stone-600 mb-1.5">
          שעות לפי פעילות
        </div>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <select
                className={`${inputCls} flex-1`}
                value={it.activity_id}
                onChange={(e) => setItem(idx, 'activity_id', e.target.value)}
              >
                <option value="">— בחר פעילות —</option>
                {activities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.5"
                className={`${inputCls} w-20`}
                value={it.hours}
                onChange={(e) => setItem(idx, 'hours', e.target.value)}
                placeholder="שעות"
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-stone-400 hover:text-rose-600 shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-2 text-sm text-emerald-700 font-semibold hover:underline"
        >
          + הוסף פעילות
        </button>

        <div className="mt-3 flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
          <span className="text-sm font-semibold text-stone-700">
            סה״כ שעות שבועיות
          </span>
          <span className="text-lg font-extrabold text-emerald-700">{total}</span>
        </div>

        <Field label="הערה (אופציונלי)">
          <textarea
            className={inputCls}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
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
          {busy ? 'שומר…' : 'שמירת דיווח'}
        </button>

        {blocking && (
          <button
            onClick={submitEmpty}
            disabled={busy}
            className="w-full mt-2 text-sm text-stone-500 hover:text-stone-700 disabled:opacity-50"
          >
            לא היו לי פעילויות לדווח השבוע
          </button>
        )}
      </div>
    </div>
  )
}
