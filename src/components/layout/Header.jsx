import React from 'react'
import { Sun, ShieldCheck, UserCheck, HandHeart, Briefcase, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ROLE_ICONS = {
  admin: { Icon: ShieldCheck, short: 'מנכ״ל', color: 'emerald' },
  service: { Icon: UserCheck, short: 'בת שירות', color: 'amber' },
  volunteer: { Icon: HandHeart, short: 'מתנדב/ת', color: 'orange' },
  instructor: { Icon: Briefcase, short: 'מדריך/ה', color: 'sky' },
}

export default function Header({ activeTabLabel, tabs, activeTab, onTab }) {
  const { profile, signOut } = useAuth()
  const roleConf = ROLE_ICONS[profile?.role] || ROLE_ICONS.volunteer
  const RoleIcon = roleConf.Icon
  const label = !profile
    ? ''
    : profile.role === 'admin'
      ? `${profile.name} · מנכ״ל`
      : profile.role === 'service'
        ? `${profile.name} · בת שירות${profile.branch ? ` · ${profile.branch.name}` : ''}`
        : profile.role === 'instructor'
          ? `${profile.name} · מדריך/ה`
          : `${profile.name} · מתנדב/ת`

  return (
    <>
      <header className="bg-white border-b border-stone-200 px-5 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2 md:hidden">
          <Sun size={20} className="text-amber-500" />
          <span className="font-display font-black text-emerald-700">מאירים</span>
        </div>
        <h1 className="font-bold text-stone-800 hidden md:block">{activeTabLabel}</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className={`flex items-center gap-1.5 text-${roleConf.color}-700 font-semibold`}>
            <RoleIcon size={16} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{roleConf.short}</span>
          </span>
          <button
            onClick={signOut}
            title="יציאה"
            className="text-stone-400 hover:text-rose-500"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <nav className="md:hidden flex overflow-x-auto gap-1 px-3 py-2 bg-white border-b border-stone-100">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-amber-500 text-white'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </nav>
    </>
  )
}
