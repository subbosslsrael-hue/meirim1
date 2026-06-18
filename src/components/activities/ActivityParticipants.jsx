import React, { useEffect, useState } from 'react'
import { Phone, Users } from 'lucide-react'
import Modal from '../shared/Modal'
import { supabase } from '../../lib/supabase'

export default function ActivityParticipants({ activity, onClose }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    supabase
      .rpc('activity_participants_details', { p_activity_id: activity.id })
      .then(({ data, error: err }) => {
        if (!active) return
        if (err) setError(err.message)
        else setList(data || [])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [activity.id])

  return (
    <Modal title={`נרשמים — ${activity.name}`} onClose={onClose}>
      {loading ? (
        <p className="text-stone-400 text-sm text-center py-4">טוען…</p>
      ) : error ? (
        <p className="text-rose-600 text-sm text-center py-4">{error}</p>
      ) : list.length === 0 ? (
        <p className="text-stone-400 text-sm text-center py-6 flex flex-col items-center gap-2">
          <Users size={24} className="text-stone-300" />
          אין נרשמים עדיין.
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-stone-100 bg-stone-50/60"
            >
              <div className="min-w-0">
                <div className="font-semibold text-stone-800 text-sm truncate">
                  {p.name}
                </div>
                <div className="text-xs text-stone-500">גיל: {p.age || '—'}</div>
              </div>
              {p.phone && (
                <a
                  href={`tel:${p.phone}`}
                  className="flex items-center gap-1 text-sm text-emerald-700 font-semibold shrink-0 hover:underline"
                >
                  <Phone size={14} /> {p.phone}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
