import React, { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from '../shared/Modal'
import Field, { inputCls } from '../shared/Field'

export default function ChangeoverModal({
  onClose,
  onSwap,
  profiles,
  families,
}) {
  const services = profiles.filter((p) => p.role === 'service')
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const famCount = useMemo(
    () => (id) => families.filter((f) => f.responsible_profile_id === id).length,
    [families],
  )

  const submit = async () => {
    if (!fromId || !toId) {
      setError('יש לבחור בת שירות יוצאת ונכנסת')
      return
    }
    if (fromId === toId) {
      setError('בחירה זהה — לא ניתן להחליף לאותו פרופיל')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const moved = await onSwap({ fromId, toId })
      onClose({
        count: moved,
        fromName: services.find((s) => s.id === fromId)?.name,
        toName: services.find((s) => s.id === toId)?.name,
      })
    } catch (err) {
      setError(err.message || 'שגיאה בחילוף')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="חילוף בת שירות אחראית" onClose={() => onClose(null)}>
      <p className="text-xs text-stone-500 mb-3">
        בסיום תקופת השירות, בחר/י את האחראית היוצאת ואת מי שתיכנס במקומה. כל
        המשפחות המשויכות יעודכנו אוטומטית במסד הנתונים.
      </p>

      <Field label="בת שירות יוצאת">
        <select
          className={inputCls}
          value={fromId}
          onChange={(e) => setFromId(e.target.value)}
        >
          <option value="">— בחר/י —</option>
          {services.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.branch?.name || '—'} ({famCount(p.id)} משפחות)
            </option>
          ))}
        </select>
      </Field>

      <Field label="בת שירות נכנסת">
        <select
          className={inputCls}
          value={toId}
          onChange={(e) => setToId(e.target.value)}
        >
          <option value="">— בחר/י —</option>
          {services
            .filter((p) => p.id !== fromId)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.branch?.name || '—'}
              </option>
            ))}
        </select>
      </Field>

      {fromId && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
          <AlertTriangle size={15} /> {famCount(fromId)} משפחות ישויכו מחדש
          אוטומטית.
        </div>
      )}

      {error && (
        <div className="text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl text-sm mb-3">
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={busy}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold"
      >
        {busy ? 'מבצע חילוף…' : 'ביצוע חילוף ותיקוף'}
      </button>
    </Modal>
  )
}
