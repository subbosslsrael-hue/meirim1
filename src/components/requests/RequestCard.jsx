import React, { useState } from 'react'
import { Check, X, Phone, MapPin } from 'lucide-react'
import { ROLES } from '../../lib/constants'

// כרטיס בקשת כניסה בודדת עם כפתורי אישור/דחייה. משמש גם בטאב וגם בחלון הקופץ.
export default function RequestCard({ person, onApprove, onReject }) {
  const [busy, setBusy] = useState(null) // 'approve' | 'reject' | null
  const [confirmReject, setConfirmReject] = useState(false)

  const run = async (kind, fn) => {
    setBusy(kind)
    try {
      await fn(person.id)
    } catch (e) {
      alert(e.message || 'שגיאה')
    } finally {
      setBusy(null)
      setConfirmReject(false)
    }
  }

  const roleLabel = ROLES[person.role]?.label || person.role
  const when = person.created_at
    ? new Date(person.created_at).toLocaleDateString('he-IL')
    : ''

  return (
    <div className="border border-amber-100 rounded-xl p-3.5 bg-amber-50/40">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold text-stone-800">{person.name}</div>
          <div className="text-xs text-stone-500 mt-0.5">
            {roleLabel}
            {when ? ` · נרשם/ה ${when}` : ''}
          </div>
        </div>
      </div>

      <div className="mt-2 space-y-1 text-sm text-stone-600">
        <div className="flex items-center gap-1.5">
          <Phone size={13} className="text-stone-400" />
          {person.phone ? (
            <a href={`tel:${person.phone}`} className="hover:underline">
              {person.phone}
            </a>
          ) : (
            '—'
          )}
        </div>
        {person.age ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-400">גיל:</span>
            {person.age}
          </div>
        ) : null}
        <div className="flex items-center gap-1.5">
          <MapPin size={13} className="text-stone-400" />
          {person.branch?.name || 'ללא סניף'}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => run('approve', onApprove)}
          disabled={!!busy}
          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2 rounded-lg font-semibold text-sm"
        >
          <Check size={15} /> {busy === 'approve' ? 'מאשר…' : 'אישור כניסה'}
        </button>
        {confirmReject ? (
          <>
            <button
              onClick={() => run('reject', onReject)}
              disabled={!!busy}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-semibold text-sm"
            >
              {busy === 'reject' ? '…' : 'כן, דחה'}
            </button>
            <button
              onClick={() => setConfirmReject(false)}
              disabled={!!busy}
              className="text-xs text-stone-500 hover:text-stone-700 px-1"
            >
              ביטול
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmReject(true)}
            disabled={!!busy}
            className="flex items-center justify-center gap-1 text-rose-600 hover:text-rose-700 border border-rose-200 px-3 py-2 rounded-lg font-semibold text-sm"
            title="דחיית הבקשה"
          >
            <X size={15} /> דחה
          </button>
        )}
      </div>
    </div>
  )
}
