import React, { useState, useEffect } from 'react'
import {
  Sun,
  ShieldCheck,
  UserCheck,
  HandHeart,
  Briefcase,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ROLE_ICONS = {
  admin: { Icon: ShieldCheck, short: 'מנכ״ל', color: 'emerald' },
  service: { Icon: UserCheck, short: 'בת שירות', color: 'amber' },
  volunteer: { Icon: HandHeart, short: 'מתנדב/ת', color: 'orange' },
  instructor: { Icon: Briefcase, short: 'מדריך/ה', color: 'sky' },
}

export default function Header({
  activeTabLabel,
  tabs,
  activeTab,
  onTab,
  badges = {},
}) {
  const { profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
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

  const pick = (id) => {
    onTab(id)
    setOpen(false)
  }

  // פתיחה/סגירה של התפריט בהחלקה (swipe) במובייל
  useEffect(() => {
    let startX = null
    let startY = null
    const onStart = (e) => {
      const t = e.touches[0]
      startX = t.clientX
      startY = t.clientY
    }
    const onEnd = (e) => {
      if (startX == null) return
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      if (Math.abs(dx) > Math.abs(dy)) {
        // החלקה שמאלה מהקצה הימני → פתיחה
        if (!open && startX > window.innerWidth - 40 && dx < -60) setOpen(true)
        // החלקה ימינה כשפתוח → סגירה
        else if (open && dx > 60) setOpen(false)
      }
      startX = null
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [open])

  return (
    <>
      <header className="bg-white border-b border-stone-200 px-5 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            className="md:hidden text-stone-600 hover:text-amber-600"
            title="תפריט"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 md:hidden">
            <Sun size={20} className="text-amber-500" />
            <span className="font-display font-black text-emerald-700">
              מאירים
            </span>
          </div>
          <h1 className="font-bold text-stone-800 hidden md:block">
            {activeTabLabel}
          </h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span
            className={`flex items-center gap-1.5 text-${roleConf.color}-700 font-semibold`}
          >
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

      {/* תפריט נשלף למובייל */}
      <div
        className={`md:hidden fixed inset-0 z-[2000] ${
          open ? '' : 'pointer-events-none'
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute top-0 right-0 h-full w-64 max-w-[80%] bg-white shadow-xl flex flex-col transition-transform ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun size={22} className="text-amber-500" />
              <span className="font-display text-lg font-black text-emerald-700">
                מאירים
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-stone-400 hover:text-stone-700"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="p-3 flex-1 overflow-y-auto">
            {tabs.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => pick(t.id)}
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
      </div>
    </>
  )
}
