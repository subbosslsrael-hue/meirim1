import React, { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import Card from '../shared/Card'
import Modal from '../shared/Modal'
import Field, { inputCls } from '../shared/Field'
import LoadingScreen from '../shared/LoadingScreen'
import ExportButton from './ExportButton'
import ComplianceTracker from './ComplianceTracker'
import { PROJECTS } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'
import { useReports } from '../../hooks/useReports'
import { useProfiles } from '../../hooks/useProfiles'
import { useFamilies } from '../../hooks/useFamilies'
import { useActivities } from '../../hooks/useActivities'

function currentWeek() {
  const d = new Date()
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((target - yearStart) / 86400000 + 1) / 7)
  return `${target.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

export default function ReportsPage() {
  const { profile } = useAuth()
  const reports = useReports()
  const { data: profiles } = useProfiles()
  const { data: families } = useFamilies()
  const { data: activities } = useActivities()

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    week: currentWeek(),
    project: PROJECTS[0],
    hours: 0,
    note: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const byProfile = useMemo(() => {
    const m = {}
    reports.data.forEach(
      (r) => (m[r.profile_id] = (m[r.profile_id] || 0) + Number(r.hours || 0)),
    )
    return profiles
      .filter((p) => p.role === 'service' || p.role === 'instructor')
      .map((p) => ({ name: p.name, שעות: m[p.id] || 0 }))
  }, [reports.data, profiles])

  if (reports.loading) return <LoadingScreen message="טוען דיווחים…" />

  const submit = async () => {
    if (!Number(form.hours)) {
      setError('יש להזין מספר שעות גדול מ-0')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await reports.insert({
        profile_id: profile.id,
        week: form.week,
        project: form.project,
        hours: Number(form.hours),
        note: form.note,
      })
      setForm({ week: currentWeek(), project: PROJECTS[0], hours: 0, note: '' })
      setOpen(false)
    } catch (err) {
      setError(err.message || 'שגיאה בשמירה')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-stone-800">דיווחי פעילות שבועיים</h3>
        <div className="flex items-center gap-2">
          <ExportButton
            families={families}
            activities={activities}
            reports={reports.data}
          />
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold shadow"
          >
            <Plus size={18} /> דיווח
          </button>
        </div>
      </div>

      <ComplianceTracker reports={reports.data} profiles={profiles} />

      <Card className="p-5">
        <h4 className="font-bold text-stone-800 text-sm mb-3">
          תפוקת מתנדבים — סה״כ שעות לפי משתתף
        </h4>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={byProfile}
              margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece4" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} />
              <YAxis tick={{ fontSize: 11, fill: '#78716c' }} />
              <Tooltip />
              <Bar dataKey="שעות" radius={[6, 6, 0, 0]} fill="#2E8B6F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500 text-xs">
            <tr>
              <th className="text-right font-semibold px-4 py-2.5">מדווח/ת</th>
              <th className="text-right font-semibold px-4 py-2.5">שבוע</th>
              <th className="text-right font-semibold px-4 py-2.5">פרויקט</th>
              <th className="text-right font-semibold px-4 py-2.5">שעות</th>
              <th className="text-right font-semibold px-4 py-2.5 hidden md:table-cell">
                הערות
              </th>
            </tr>
          </thead>
          <tbody>
            {reports.data.map((r) => (
              <tr key={r.id} className="border-t border-stone-100">
                <td className="px-4 py-2.5 font-medium text-stone-700">
                  {r.profile?.name || '—'}
                </td>
                <td className="px-4 py-2.5 text-stone-500">{r.week}</td>
                <td className="px-4 py-2.5">
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                    {r.project}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-bold text-stone-800">
                  {r.hours}
                </td>
                <td className="px-4 py-2.5 text-stone-500 hidden md:table-cell">
                  {r.note || '—'}
                </td>
              </tr>
            ))}
            {reports.data.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center text-stone-400 text-sm py-6"
                >
                  אין דיווחים עדיין.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {open && (
        <Modal title="דיווח פעילות שבועי" onClose={() => setOpen(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="שבוע">
              <input
                className={inputCls}
                value={form.week}
                onChange={(e) => setForm({ ...form, week: e.target.value })}
                placeholder="2026-W22"
              />
            </Field>
            <Field label="שעות">
              <input
                type="number"
                min="0"
                step="0.5"
                className={inputCls}
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
              />
            </Field>
          </div>
          <Field label="פרויקט">
            <select
              className={inputCls}
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
            >
              {PROJECTS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="תיאור הפעילות">
            <textarea
              className={inputCls}
              rows={3}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>
          {error && (
            <div className="text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl text-sm mb-2">
              {error}
            </div>
          )}
          <button
            onClick={submit}
            disabled={busy}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold mt-2"
          >
            {busy ? 'שומר…' : 'שמירת דיווח'}
          </button>
        </Modal>
      )}
    </div>
  )
}
