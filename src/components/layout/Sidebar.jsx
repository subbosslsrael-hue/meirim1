import React from 'react'
import { Sun } from 'lucide-react'

export default function Sidebar({ tabs, activeTab, onTab, badges = {} }) {
  return (
    <aside className="w-60 shrink-0 bg-white border-l border-stone-200 hidden md:flex flex-col">
      <div className="px-5 py-5 border-b border-stone-100 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-emerald-500 flex items-center justify-center text-white shadow">
          <Sun size={24} />
        </div>
        <div>
          <div className="font-display text-xl font-black text-emerald-700 leading-none">
            מאירים
          </div>
          <div className="text-[11px] text-amber-600 font-semibold">
            מערכת ניהול פעילות
          </div>
        </div>
      </div>
      <nav className="p-3 flex-1">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-semibold transition ${
                activeTab === t.id
                  ? 'bg-amber-500 text-white shadow'
                  : 'text-stone-600 hover:bg-amber-50'
              }`}
            >
              <Icon size={18} />
              {t.label}
              {badges[t.id] > 0 && (
                <span className="mr-auto min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {badges[t.id]}
                </span>
              )}
            </button>
          )
        })}
      </nav>
      <div className="p-4 text-[11px] text-stone-400 border-t border-stone-100">
        עמותת מאירים · ע״ר 580644342
        <br />
        מערכת ניהול · גרסה 1.0
        <br />
        נבנתה ע״י יעקב ישראל יורב
        <br />
        <a href="mailto:yorav1146@gmail.com" className="hover:text-amber-600">
          yorav1146@gmail.com
        </a>
      </div>
    </aside>
  )
}
