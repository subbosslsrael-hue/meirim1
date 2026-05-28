import React from 'react'
import { Sun } from 'lucide-react'

export default function LoadingScreen({ message = 'טוען…' }) {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center bg-amber-50/40 text-stone-500 gap-3"
    >
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-emerald-500 flex items-center justify-center text-white shadow-lg animate-pulse">
        <Sun size={24} />
      </div>
      <span className="text-sm">{message}</span>
    </div>
  )
}
