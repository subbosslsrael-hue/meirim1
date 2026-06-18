import React, { useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  CalendarHeart,
  Truck,
  ClipboardList,
  BookOpen,
  Contact,
} from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginScreen from './components/auth/LoginScreen'
import RoleSelector from './components/auth/RoleSelector'
import LoadingScreen from './components/shared/LoadingScreen'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Dashboard from './components/dashboard/Dashboard'
import FamiliesPage from './components/families/FamiliesPage'
import ActivitiesPage from './components/activities/ActivitiesPage'
import DistributionPage from './components/distribution/DistributionPage'
import ReportsPage from './components/reports/ReportsPage'
import DocsPage from './components/docs/DocsPage'
import TeamPage from './components/team/TeamPage'
import PendingDebriefGate from './components/activities/PendingDebriefGate'

const ALL_TABS = [
  { id: 'dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
  { id: 'families', label: 'ניהול משפחות', icon: Users },
  { id: 'activities', label: 'פעילויות ומדריכים', icon: CalendarHeart },
  { id: 'distribution', label: 'חלוקת מוצרים', icon: Truck },
  { id: 'team', label: 'צוות', icon: Contact },
  { id: 'reports', label: 'דיווחים ומעקב', icon: ClipboardList },
  { id: 'docs', label: 'אפיון ותיעוד', icon: BookOpen },
]

const TABS_BY_ROLE = {
  admin: ALL_TABS.map((t) => t.id),
  service: ALL_TABS.map((t) => t.id),
  instructor: ['dashboard', 'activities', 'distribution', 'reports'],
  volunteer: ['dashboard', 'activities', 'distribution'],
}

// משתמש שטרם השלים בחירת תפקיד — phone עוד לא הוגדר ב-profile
// (כל RoleSelector מסיים בשמירת phone, ולכן זה הסימן הוודאי)
function needsRoleSetup(profile) {
  return !profile?.phone
}

function AppShell() {
  const [tab, setTab] = useState('dashboard')
  const { profile } = useAuth()

  const visibleTabs = useMemo(() => {
    const allowed = TABS_BY_ROLE[profile?.role] || []
    return ALL_TABS.filter((t) => allowed.includes(t.id))
  }, [profile?.role])

  useEffect(() => {
    if (!visibleTabs.find((t) => t.id === tab) && visibleTabs.length) {
      setTab(visibleTabs[0].id)
    }
  }, [visibleTabs, tab])

  const activeTabLabel =
    visibleTabs.find((t) => t.id === tab)?.label || 'מאירים'

  return (
    <div dir="rtl" className="min-h-screen flex bg-amber-50/40 text-right">
      <Sidebar tabs={visibleTabs} activeTab={tab} onTab={setTab} />
      <main className="flex-1 min-w-0">
        <Header
          activeTabLabel={activeTabLabel}
          tabs={visibleTabs}
          activeTab={tab}
          onTab={setTab}
        />
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'families' && <FamiliesPage />}
          {tab === 'activities' && <ActivitiesPage />}
          {tab === 'distribution' && <DistributionPage />}
          {tab === 'team' && <TeamPage />}
          {tab === 'reports' && <ReportsPage />}
          {tab === 'docs' && <DocsPage />}
        </div>
      </main>
      {['admin', 'service', 'instructor'].includes(profile?.role) && (
        <PendingDebriefGate />
      )}
    </div>
  )
}

function ProfileError() {
  const { signOut } = useAuth()
  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50"
    >
      <div className="bg-white rounded-2xl shadow-lg p-7 max-w-md text-center">
        <h2 className="text-lg font-black text-rose-700 mb-2">
          לא הצלחנו לטעון את הפרופיל
        </h2>
        <p className="text-sm text-stone-600 mb-4">
          ייתכן שה-trigger במסד הנתונים לא רץ או שיש בעיית הרשאות.
          פתח/י את ה-Console (F12) לפרטים, או נסה/י להתחבר מחדש.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold mr-2"
        >
          נסה שוב
        </button>
        <button
          onClick={signOut}
          className="py-2 px-4 rounded-xl border border-stone-200 text-stone-600 font-semibold"
        >
          התנתק/י
        </button>
      </div>
    </div>
  )
}

function Router() {
  const { loading, user, profile, profileLoading } = useAuth()

  if (loading) return <LoadingScreen message="טוען מערכת…" />
  if (!user) return <LoginScreen />
  if (profileLoading) return <LoadingScreen message="טוען פרופיל…" />
  if (!profile) return <ProfileError />
  if (needsRoleSetup(profile)) return <RoleSelector />
  return <AppShell />
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  )
}
