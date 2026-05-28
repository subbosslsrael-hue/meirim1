import React, { useMemo } from 'react'
import {
  Users,
  Activity,
  HandHeart,
  Clock,
  TrendingUp,
  Truck,
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
import { useFamilies } from '../../hooks/useFamilies'
import { useActivities } from '../../hooks/useActivities'
import { useReports } from '../../hooks/useReports'
import { useDistributions } from '../../hooks/useDistributions'
import { useProfiles } from '../../hooks/useProfiles'

export default function Dashboard() {
  const { data: families } = useFamilies()
  const { data: activities } = useActivities()
  const { data: reports } = useReports()
  const { data: distributions } = useDistributions()
  const { data: profiles } = useProfiles()

  const hoursByProject = useMemo(() => {
    const m = {}
    PROJECTS.forEach((p) => (m[p] = 0))
    reports.forEach((r) => (m[r.project] = (m[r.project] || 0) + Number(r.hours || 0)))
    return PROJECTS.map((p) => ({ name: p, שעות: m[p] }))
  }, [reports])

  const familiesByCat = useMemo(() => {
    const m = {}
    families.forEach((f) => (m[f.need_category] = (m[f.need_category] || 0) + 1))
    return Object.entries(m).map(([name, value]) => ({ name, value }))
  }, [families])

  const totalHours = reports.reduce((s, r) => s + Number(r.hours || 0), 0)
  const serviceCount = profiles.filter((p) => p.role === 'service').length
  const dist = distributions[0]
  const delivered = dist?.stops?.filter((s) => s.delivered).length || 0
  const totalStops = dist?.stops?.length || 0

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Users} label="משפחות נתמכות" value={families.length} tone="amber" />
        <Stat icon={Activity} label="פעילויות במערכת" value={activities.length} tone="green" />
        <Stat icon={HandHeart} label="בנות שירות" value={serviceCount} tone="rose" />
        <Stat icon={Clock} label="סה״כ שעות מדווחות" value={totalHours} tone="blue" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-amber-500" />
            <h3 className="font-bold text-stone-800">שעות פעילות לפי פרויקט</h3>
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
            <h3 className="font-bold text-stone-800">פילוח משפחות לפי סוג צורך</h3>
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
              <span key={i} className="text-[11px] text-stone-500 flex items-center gap-1">
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
            <p className="text-xs text-stone-400 mt-2">
              עברו ל"חלוקת מוצרים" לתצוגת מפה וסימון מסירות.
            </p>
          </>
        ) : (
          <p className="text-sm text-stone-400">אין חלוקה פעילה.</p>
        )}
      </Card>
    </div>
  )
}
