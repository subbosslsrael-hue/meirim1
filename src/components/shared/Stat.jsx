import React from 'react'
import Card from './Card'

const TONES = {
  amber: 'from-amber-400 to-orange-500',
  green: 'from-emerald-400 to-teal-600',
  blue: 'from-sky-400 to-indigo-500',
  rose: 'from-rose-400 to-pink-500',
}

export default function Stat({ icon: Icon, label, value, tone = 'amber' }) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${TONES[tone]} flex items-center justify-center text-white shadow`}
      >
        <Icon size={22} />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-stone-800 leading-none">
          {value}
        </div>
        <div className="text-sm text-stone-500 mt-1">{label}</div>
      </div>
    </Card>
  )
}
