import React, { useEffect, useMemo, useState } from 'react'
import {
  Users,
  Activity,
  HandHeart,
  Clock,
  TrendingUp,
  Truck,
  Briefcase,
  CalendarHeart,
  ClipboardList,
  MessageCircle,
  ChevronLeft,
  CheckCircle2,
  MapPin,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'
import Card from '../shared/Card'
import Stat from '../shared/Stat'
import { PROJECTS, PIE_COLORS } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'
import { useFamilies } from '../../hooks/useFamilies'
import { useActivities } from '../../hooks/useActivities'
import { useReports } from '../../hooks/useReports'
import { useDistributions } from '../../hooks/useDistributions'
import { useProfiles } from '../../hooks/useProfiles'
import { supabase } from '../../lib/supabase'

const localToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

const formatWhen = (dateStr, timeStr) => {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  if (isNaN(d)) return dateStr
  const day = d.toLocaleDateString('he-IL', { weekday: 'long' })
  const date = d.toLocaleDateString('he-IL')
  return `${day}, ${date}${timeStr ? ` · ${timeStr.slice(0, 5)}` : ''}`
}

export default function Dashboard({ onNavigate }) {
  const { profile } = useAuth()
  const role = profile?.role
  const myId = profile?.id
  const isAdmin = role === 'admin'
  const isService = role === 'service'
  const manager = isAdmin || isService

  const { data: families } = useFamilies({ enabled: manager })
  const { data: activities } = useActivities()
  const { data: reports } = useReports({ enabled: manager })
  const { data: distributions } = useDistributions()
  const { data: profiles } = useProfiles({ enabled: manager })

  const [unreadChats, setUnreadChats] = useState(0)
  useEffect(() => {
    supabase
      .rpc('activities_with_unread')
      .then(({ data }) => setUnreadChats((data || []).length))
  }, [])

  const today = localToday()

  const mine = useMemo(
    () => ({
      // פעילויות שאני קשור אליהן (יצרתי / מדריך / נרשמתי)
      isMine: (a) =>
        a.created_by === myId ||
        (a.instructors || []).some((r) => r.profile?.id === myId) ||
        (a.participants_list || []).some((p) => p.profile?.id === myId),
    }),
    [myId],
  )

  const pendingDebriefs = activities.filter(
    (a) => a.created_by === myId && a.activity_date && a.activity_date < today,
  ).length

  const myStops = distributions
    .flatMap((d) => d.stops || [])
    .filter((s) => s.claimed_by === myId && !s.delivered).length

  const mySignups = activities.filter((a) =>
    (a.participants_list || []).some((p) => p.profile?.id === myId),
  ).length

  const myUpcoming = useMemo(
    () =>
      activities
        .filter((a) => mine.isMine(a) && a.activity_date && a.activity_date >= today)
        .sort((a, b) => (a.activity_date < b.activity_date ? -1 : 1))
        .slice(0, 5),
    [activities, mine, today],
  )

  const dist = distributions[0]
  const delivered = dist?.stops?.filter((s) => s.delivered).length || 0
  const totalStops = dist?.stops?.length || 0

  // ── מה דורש ממני פעולה ──────────────────────────────────────────
  const actions = []
  if (pendingDebriefs)
    actions.push({
      label: `${pendingDebriefs} תחקורים ממתינים למילוי`,
      icon: ClipboardList,
      tab: 'activities',
      cls: 'bg-rose-100 text-rose-600',
    })
  if (unreadChats)
    actions.push({
      label: `${unreadChats} צ׳אטים עם הודעות חדשות`,
      icon: MessageCircle,
      tab: 'activities',
      cls: 'bg-sky-100 text-sky-600',
    })
  if (myStops)
    actions.push({
      label: `${myStops} יעדי חלוקה שלקחת וטרם נמסרו`,
      icon: Truck,
      tab: 'distribution',
      cls: 'bg-amber-100 text-amber-600',
    })
  if (manager && dist && totalStops - delivered > 0)
    actions.push({
      label: `${totalStops - delivered} יעדים בחלוקה הפעילה טרם נמסרו`,
      icon: Truck,
      tab: 'distribution',
      cls: 'bg-orange-100 text-orange-600',
    })

  // ── סטטיסטיקות לפי תפקיד ─────────────────────────────────────────
  const volunteerCount = profiles.filter((p) => p.role === 'volunteer').length
  const instructorCount = profiles.filter((p) => p.role === 'instructor').length
  const totalHours = reports.reduce((s, r) => s + Number(r.hours || 0), 0)

  const hoursByProject = useMemo(() => {
    const m = {}
    PROJECTS.forEach((p) => (m[p] = 0))
    reports.forEach(
      (r) => (m[r.project] = (m[r.project] || 0) + Number(r.hours || 0)),
    )
    return PROJECTS.map((p) => ({ name: p, שעות: m[p] }))
  }, [reports])

  const familiesByCat = useMemo(() => {
    const m = {}
    families.forEach((f) => (m[f.need_category] = (m[f.need_category] || 0) + 1))
    return Object.entries(m).map(([name, value]) => ({ name, value }))
  }, [families])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-stone-800">
          שלום{profile?.name ? `, ${profile.name}` : ''} 👋
        </h2>
        <p className="text-sm text-stone-500">
          {isAdmin
            ? 'מבט-על על כל הפעילות בעמותה.'
            : isService
              ? `סקירת הסניף שלך${profile?.branch?.name ? ` — ${profile.branch.name}` : ''}.`
              : role === 'instructor'
                ? 'הפעילויות והמשימות שלך.'
                : 'הפעילויות והחלוקות שלך.'}
        </p>
      </div>

      {/* מה דורש ממני פעולה */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <h3 className="font-bold text-stone-800 text-sm">
            מה דורש ממני פעולה
          </h3>
        </div>
        {actions.length === 0 ? (
          <p className="text-sm text-stone-400 py-2">
            אין משימות פתוחות כרגע — כל הכבוד! 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {actions.map((a, i) => {
              const Icon = a.icon
              return (
                <button
                  key={i}
                  onClick={() => onNavigate?.(a.tab)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-stone-100 bg-stone-50/60 text-right hover:bg-stone-100 transition"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.cls}`}
                  >
                    <Icon size={18} />
                  </div>
                  <span className="flex-1 font-semibold text-sm text-stone-700">
                    {a.label}
                  </span>
                  <ChevronLeft size={16} className="text-stone-400" />
                </button>
              )
            })}
          </div>
        )}
      </Card>

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isAdmin && (
          <>
            <Stat icon={Users} label="משפחות נתמכות" value={families.length} tone="amber" />
            <Stat icon={Activity} label="פעילויות פעילות" value={activities.length} tone="green" />
            <Stat icon={HandHeart} label="מתנדבים" value={volunteerCount} tone="rose" />
            <Stat icon={Briefcase} label="מדריכים" value={instructorCount} tone="blue" />
          </>
        )}
        {isService && (
          <>
            <Stat icon={Users} label="משפחות בסניף" value={families.length} tone="amber" />
            <Stat icon={Activity} label="פעילויות בסניף" value={activities.length} tone="green" />
            <Stat icon={HandHeart} label="מתנדבים בסניף" value={volunteerCount} tone="rose" />
            <Stat icon={Clock} label="שעות מדווחות" value={totalHours} tone="blue" />
          </>
        )}
        {role === 'instructor' && (
          <>
            <Stat
              icon={Activity}
              label="פעילויות פעילות"
              value={activities.length}
              tone="green"
            />
            <Stat
              icon={CalendarHeart}
              label="פעילויות קרובות שלי"
              value={myUpcoming.length}
              tone="amber"
            />
          </>
        )}
        {role === 'volunteer' && (
          <>
            <Stat
              icon={CalendarHeart}
              label="פעילויות שנרשמתי"
              value={mySignups}
              tone="green"
            />
            <Stat icon={Truck} label="יעדים שלקחתי" value={myStops} tone="amber" />
          </>
        )}
      </div>

      {/* תובנות לפי תפקיד */}
      {manager ? (
        <>
          <div className="grid lg:grid-cols-2 gap-5">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-amber-500" />
                <h3 className="font-bold text-stone-800">
                  שעות פעילות לפי פרויקט
                </h3>
              </div>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hoursByProject}
                    margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ece4" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
                    <Tooltip />
                    <Bar dataKey="שעות" radius={[6, 6, 0, 0]} fill="#E8920C" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-emerald-600" />
                <h3 className="font-bold text-stone-800">
                  פילוח משפחות לפי סוג צורך
                </h3>
              </div>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={familiesByCat}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(e) => e.value}
                    >
                      {familiesByCat.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {familiesByCat.map((c, i) => (
                  <span
                    key={i}
                    className="text-[11px] text-stone-500 flex items-center gap-1"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    {c.name}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={18} className="text-orange-500" />
              <h3 className="font-bold text-stone-800">
                התקדמות חלוקה פעילה{dist ? ` · ${dist.name}` : ''}
              </h3>
            </div>
            {dist ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-emerald-400 to-emerald-600 rounded-full transition-all"
                      style={{
                        width: `${totalStops ? (delivered / totalStops) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-stone-700">
                    {delivered}/{totalStops} נמסרו
                  </span>
                </div>
                <button
                  onClick={() => onNavigate?.('distribution')}
                  className="text-xs text-orange-600 font-semibold mt-2 hover:underline"
                >
                  למעבר לחלוקת מוצרים ←
                </button>
              </>
            ) : (
              <p className="text-sm text-stone-400">אין חלוקה פעילה.</p>
            )}
          </Card>
        </>
      ) : (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarHeart size={18} className="text-emerald-600" />
            <h3 className="font-bold text-stone-800 text-sm">
              הפעילויות הקרובות שלי
            </h3>
          </div>
          {myUpcoming.length === 0 ? (
            <p className="text-sm text-stone-400 py-2">
              אין פעילויות קרובות.{' '}
              <button
                onClick={() => onNavigate?.('activities')}
                className="text-emerald-700 font-semibold hover:underline"
              >
                עיין בפעילויות ←
              </button>
            </p>
          ) : (
            <div className="space-y-2">
              {myUpcoming.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onNavigate?.('activities')}
                  className="w-full text-right p-3 rounded-xl border border-stone-100 bg-stone-50/60 hover:bg-stone-100 transition"
                >
                  <div className="font-semibold text-stone-800 text-sm">
                    {a.name}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5 flex flex-wrap gap-x-3">
                    <span>{formatWhen(a.activity_date, a.activity_time)}</span>
                    {a.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {a.location}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
