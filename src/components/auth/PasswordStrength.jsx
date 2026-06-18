import React from 'react'
import { Check, X } from 'lucide-react'
import { passwordChecks, passwordScore, PASSWORD_RULES } from '../../lib/password'

const LEVELS = [
  { label: '', cls: '' },
  { label: 'חלשה', cls: 'bg-rose-500 text-rose-600' },
  { label: 'בינונית', cls: 'bg-amber-500 text-amber-600' },
  { label: 'טובה', cls: 'bg-sky-500 text-sky-600' },
  { label: 'חזקה', cls: 'bg-emerald-500 text-emerald-600' },
]

export default function PasswordStrength({ password }) {
  if (!password) return null
  const checks = passwordChecks(password)
  const score = passwordScore(password)
  const level = LEVELS[score]

  return (
    <div className="mb-3 -mt-1">
      <div className="flex gap-1 mb-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= score ? level.cls.split(' ')[0] : 'bg-stone-200'
            }`}
          />
        ))}
      </div>
      {level.label && (
        <div className={`text-[11px] font-semibold mb-1 ${level.cls.split(' ')[1]}`}>
          חוזק הסיסמה: {level.label}
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {PASSWORD_RULES.map((r) => (
          <div
            key={r.key}
            className={`flex items-center gap-1 text-[11px] ${
              checks[r.key] ? 'text-emerald-600' : 'text-stone-400'
            }`}
          >
            {checks[r.key] ? <Check size={12} /> : <X size={12} />}
            {r.label}
          </div>
        ))}
      </div>
    </div>
  )
}
