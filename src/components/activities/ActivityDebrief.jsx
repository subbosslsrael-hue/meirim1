import React, { useRef, useState } from 'react'
import { Star, ClipboardList, Paperclip, X, Loader2 } from 'lucide-react'
import Field, { inputCls } from '../shared/Field'
import { supabase } from '../../lib/supabase'
import {
  uploadActivityFile,
  removeActivityFile,
} from '../../lib/storage'

export default function ActivityDebrief({
  activity,
  blocking = false,
  onClose,
  onDone,
}) {
  const [rating, setRating] = useState(activity.rating || 0)
  const [good, setGood] = useState('')
  const [improve, setImprove] = useState('')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  const onFiles = async (e) => {
    const chosen = Array.from(e.target.files || [])
    if (!chosen.length) return
    setUploading(true)
    setError(null)
    try {
      for (const file of chosen) {
        const path = await uploadActivityFile({ activityId: activity.id, file })
        setFiles((prev) => [...prev, { path, name: file.name }])
      }
    } catch (err) {
      setError(err.message || 'שגיאה בהעלאת קובץ')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeFile = async (path) => {
    setFiles((prev) => prev.filter((f) => f.path !== path))
    removeActivityFile(path)
  }

  const submit = async () => {
    if (!good.trim()) {
      setError('יש למלא מה היה טוב')
      return
    }
    if (!improve.trim()) {
      setError('יש למלא מה טעון שיפור')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { error: err } = await supabase.rpc('archive_activity', {
        p_activity_id: activity.id,
        p_good: good.trim(),
        p_improve: improve.trim(),
        p_rating: rating || null,
        p_files: files,
      })
      if (err) throw err
      onDone?.()
      onClose?.()
    } catch (e) {
      setError(e.message || 'שגיאה בשמירת התחקור')
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
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList size={18} className="text-emerald-600" />
          <h2 className="font-black text-stone-800">תחקור פעילות</h2>
        </div>
        <p className="text-sm text-stone-500 mb-3">{activity.name}</p>

        {blocking && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            הפעילות התקיימה — יש למלא תחקור כדי להמשיך. הסיכום יישמר בדיווחים
            ולאחר מכן הפעילות תוסר מהרשימה.
          </div>
        )}

        <Field label="דירוג שביעות רצון (אופציונלי)">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)}>
                <Star
                  size={26}
                  className={
                    n <= rating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-stone-300'
                  }
                />
              </button>
            ))}
          </div>
        </Field>
        <Field label="מה היה טוב?">
          <textarea
            className={inputCls}
            rows={3}
            value={good}
            onChange={(e) => setGood(e.target.value)}
            placeholder="מה עבד טוב בפעילות…"
          />
        </Field>
        <Field label="מה טעון שיפור לפעם הבאה?">
          <textarea
            className={inputCls}
            rows={3}
            value={improve}
            onChange={(e) => setImprove(e.target.value)}
            placeholder="מה כדאי לשפר בפעם הבאה…"
          />
        </Field>

        <Field label="קבצים מצורפים (לשימוש בפעם הבאה)">
          <div className="space-y-1.5">
            {files.map((f) => (
              <div
                key={f.path}
                className="flex items-center gap-2 text-sm bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5"
              >
                <Paperclip size={14} className="text-stone-400 shrink-0" />
                <span className="flex-1 truncate text-stone-700">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(f.path)}
                  className="text-stone-400 hover:text-rose-600"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-stone-300 text-stone-500 text-sm hover:bg-stone-50 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> מעלה…
                </>
              ) : (
                <>
                  <Paperclip size={15} /> הוספת קובץ
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              onChange={onFiles}
              className="hidden"
            />
          </div>
        </Field>

        {error && (
          <div className="text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl text-sm mb-2">
            {error}
          </div>
        )}

        <div className="flex gap-2 mt-2">
          {!blocking && (
            <button
              onClick={onClose}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 font-semibold"
            >
              ביטול
            </button>
          )}
          <button
            onClick={submit}
            disabled={busy || uploading}
            className="flex-[2] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold"
          >
            {busy ? 'שומר…' : 'שמירת תחקור וסיום'}
          </button>
        </div>
      </div>
    </div>
  )
}
