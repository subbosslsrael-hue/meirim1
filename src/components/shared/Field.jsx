import React from 'react'

export const inputCls =
  'w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-stone-800'

export default function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="text-sm font-medium text-stone-600 mb-1 block">
        {label}
      </span>
      {children}
    </label>
  )
}
