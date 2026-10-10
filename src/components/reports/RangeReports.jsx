import React, { useMemo, useState } from 'react'
import { CalendarRange, FileSpreadsheet, Clock, PieChart as PieIcon } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import * as XLSX from 'xlsx'
import Card from '../shared/Card'
import { PIE_COLORS } from '../../lib/constants'
import { todayKey } from '../../lib/week'

// תאריך לפני N ימים כ-YYYY-MM-DD
const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// דוחות לפי טווח תאריכים (למנכ"ל/בת שירות):
//  1) סיכום שעות לכל מדווח/ת בטווח.
//  2) כמות פעילויות לפי קטגוריה (מיומנות) בטווח — טבלה + תרשים עוגה.
export default function RangeReports({
  reports = [],
  profiles = [],
  activities = [],
  actArchives = [],
}) {
  const [from, setFrom] = useState(daysAgo(90))
  const [to, setTo] = useState(todayKey())

  // --- סיכום שעות לפי מדווח/ת בטווח ---
  // מפתח השבוע נשמר כ-YYYY-MM-DD (יום ראשון הפותח) — השוואת מחרוזות עובדת.
  const hours = useMemo(() => {
    const inRange = reports.filter(
      (r) => r.week && r.week >= from && r.week <= to,
    )
    const byProfile = {}
    inRange.forEach((r) => {
      byProfile[r.profile_id] =
        (byProfile[r.profile_id] || 0) + Number(r.hours || 0)
    })
    const rows = profiles
      .filter((p) => p.role === 'service' || p.role === 'instructor')
      .map((p) => ({
        name: p.name,
        role: p.role === 'service' ? 'בת שירות' : 'מדריך/ה',
        hours: byProfile[p.id] || 0,
      }))
      .sort((a, b) => b.hours - a.hours)
    const total = rows.reduce((s, r) => s + r.hours, 0)
    return { rows, total }
  }, [reports, profiles, from, to])

  // --- פעילויות לפי קטגוריה (פרויקט — נקודות אור וכו') בטווח ---
  const categories = useMemo(() => {
    // איחוד פעילויות פעילות + פעילויות שהושלמו (ארכיון), לפי activity_date בטווח.
    const all = [
      ...activities.map((a) => ({
        date: a.activity_date,
        project: a.project,
      })),
      ...actArchives.map((a) => ({
        date: a.activity_date,
        project: a.project,
      })),
    ].filter((a) => a.date && a.date >= from && a.date <= to)

    const counts = {}
    all.forEach((a) => {
      const key = (a.project || '').trim() || 'ללא קטגוריה'
      counts[key] = (counts[key] || 0) + 1
    })
    const data = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
    return { data, total: all.length }
  }, [activities, actArchives, from, to])

  const exportExcel = () => {
    try {
      const wb = XLSX.utils.book_new()
      const rangeLabel = `${from} עד ${to}`
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          hours.rows.map((r) => ({
            'מדווח/ת': r.name,
            'תפקיד': r.role,
            'סה״כ שעות': r.hours,
          })),
        ),
        'שעות לפי מדווח',
      )
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          categories.data.map((c) => ({
            'קטגוריה': c.name,
            'מספר פעילויות': c.value,
          })),
        ),
        'פעילויות לפי קטגוריה',
      )
      XLSX.writeFile(wb, `meirim-doch-${from}_${to}.xlsx`)
    } catch (e) {
      alert('הייצוא נכשל: ' + (e.message || 'שגיאה'))
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <CalendarRange size={16} className="text-amber-600" />
        <h4 className="font-bold text-stone-800 text-sm flex-1">
          דוחות לפי טווח תאריכים
        </h4>
        <button
          onClick={exportExcel}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-semibold text-sm shadow"
        >
          <FileSpreadsheet size={15} /> ייצוא Excel
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="block">
          <span className="text-xs font-medium text-stone-500 mb-1 block">
            מתאריך
          </span>
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 outline-none focus:border-amber-400"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-stone-500 mb-1 block">
            עד תאריך
          </span>
          <input
            type="date"
            value={to}
            min={from}
            max={todayKey()}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 outline-none focus:border-amber-400"
          />
        </label>
      </div>

      {/* סיכום שעות לפי מדווח/ת */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 mb-2">
          <Clock size={15} className="text-sky-600" /> סיכום שעות לפי מדווח/ת
        </div>
        <div className="overflow-hidden rounded-xl border border-stone-100">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-500 text-xs">
              <tr>
                <th className="text-right font-semibold px-3 py-2">מדווח/ת</th>
                <th className="text-right font-semibold px-3 py-2">תפקיד</th>
                <th className="text-left font-semibold px-3 py-2">סה״כ שעות</th>
              </tr>
            </thead>
            <tbody>
              {hours.rows.map((r) => (
                <tr key={r.name} className="border-t border-stone-100">
                  <td className="px-3 py-2 font-medium text-stone-700">
                    {r.name}
                  </td>
                  <td className="px-3 py-2 text-stone-500">{r.role}</td>
                  <td
                    className={`px-3 py-2 text-left font-bold ${
                      r.hours ? 'text-stone-800' : 'text-stone-300'
                    }`}
                  >
                    {r.hours}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-stone-200 bg-stone-50/60">
                <td
                  className="px-3 py-2 font-bold text-stone-700"
                  colSpan={2}
                >
                  סה״כ
                </td>
                <td className="px-3 py-2 text-left font-extrabold text-emerald-700">
                  {hours.total}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* פעילויות לפי קטגוריה */}
      <div>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-stone-700 mb-2">
          <PieIcon size={15} className="text-amber-600" /> פעילויות לפי קטגוריה
          <span className="text-xs font-normal text-stone-400">
            (סה״כ {categories.total} פעילויות בטווח)
          </span>
        </div>
        {categories.data.length === 0 ? (
          <p className="text-sm text-stone-400 py-4 text-center">
            אין פעילויות בטווח התאריכים שנבחר.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 items-center">
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories.data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label={(e) => e.name}
                    labelLine={false}
                  >
                    {categories.data.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-hidden rounded-xl border border-stone-100">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-stone-500 text-xs">
                  <tr>
                    <th className="text-right font-semibold px-3 py-2">
                      קטגוריה
                    </th>
                    <th className="text-left font-semibold px-3 py-2">
                      פעילויות
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.data.map((c, i) => (
                    <tr key={c.name} className="border-t border-stone-100">
                      <td className="px-3 py-2 text-stone-700 flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-sm inline-block shrink-0"
                          style={{
                            background: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                        {c.name}
                      </td>
                      <td className="px-3 py-2 text-left font-bold text-stone-800">
                        {c.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
