import React, { useMemo, useState } from 'react'
import { ClipboardList, CheckCircle2, AlertTriangle } from 'lucide-react'
import Card from '../shared/Card'

const ROLE_LABEL = {
  service: 'בת שירות',
  instructor: 'מדריך/ה',
  admin: 'מנכ״ל',
  volunteer: 'מתנדב/ת',
}

export default function ComplianceTracker({ reports, profiles }) {
  const allWeeks = useMemo(() => {
    const s = new Set(reports.map((r) => r.week))
    return [...s].sort().reverse()
  }, [reports])

  const [week, setWeek] = useState(allWeeks[0] || '')

  const people = useMemo(
    () =>
      profiles.filter((p) => p.role === 'service' || p.role === 'instructor'),
    [profiles],
  )

  const compliance = useMemo(() => {
    const reported = new Set(
      reports.filter((r) => r.week === week).map((r) => r.profile_id),
    )
    return people.map((p) => ({ ...p, done: reported.has(p.id) }))
  }, [reports, people, week])

  const doneCount = compliance.filter((p) => p.done).length

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} className="text-amber-500" />
          <h4 className="font-bold text-stone-800 text-sm">
            מעקב חובת דיווח שבועי
          </h4>
        </div>
        <select
          value={week}
          onChange={(e) => setWeek(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg border border-stone-200 bg-white outline-none"
        >
          {allWeeks.length === 0 && <option value="">— אין דיווחים —</option>}
          {allWeeks.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-3 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-emerald-400 to-emerald-600 rounded-full transition-all"
            style={{
              width: `${
                compliance.length ? (doneCount / compliance.length) * 100 : 0
              }%`,
            }}
          />
        </div>
        <span className="text-sm font-bold text-stone-700">
          {doneCount}/{compliance.length} דיווחו
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {compliance.map((p) => (
          <div
            key={p.id}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-sm ${
              p.done
                ? 'bg-emerald-50 border-emerald-100'
                : 'bg-rose-50 border-rose-100'
            }`}
          >
            <span className="min-w-0">
              <span className="font-semibold text-stone-700 block truncate">
                {p.name}
              </span>
              <span className="text-[10px] text-stone-400">
                {ROLE_LABEL[p.role] || p.role}
              </span>
            </span>
            {p.done ? (
              <span className="text-emerald-600 flex items-center gap-1 text-xs font-semibold shrink-0">
                <CheckCircle2 size={14} />
                דיווח
              </span>
            ) : (
              <span className="text-rose-600 flex items-center gap-1 text-xs font-semibold shrink-0">
                <AlertTriangle size={14} />
                חסר
              </span>
            )}
          </div>
        ))}
        {compliance.length === 0 && (
          <p className="col-span-full text-center text-xs text-stone-400 py-4">
            אין משתתפים עם חובת דיווח.
          </p>
        )}
      </div>
    </Card>
  )
}
