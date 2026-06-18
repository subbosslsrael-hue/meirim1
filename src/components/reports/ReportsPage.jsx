import React, { useMemo, useState } from 'react'
import {
  Plus,
  Package,
  ChevronDown,
  ChevronUp,
  Camera as CameraIcon,
  ClipboardList,
  Star,
} from 'lucide-react'
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
import { useDistributionArchives } from '../../hooks/useDistributionArchives'
import { useActivityArchives } from '../../hooks/useActivityArchives'
import { getDoorPhotoUrl } from '../../lib/storage'

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
  const canViewArchives =
    profile?.role === 'admin' || profile?.role === 'service'
  const { data: archives } = useDistributionArchives({ enabled: canViewArchives })
  const { data: actArchives } = useActivityArchives({ enabled: canViewArchives })

  const [open, setOpen] = useState(false)
  const [expandedArchive, setExpandedArchive] = useState(null)
  const [expandedAct, setExpandedAct] = useState(null)
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

      {canViewArchives && archives.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package size={16} className="text-emerald-600" />
            <h4 className="font-bold text-stone-800 text-sm">
              סיכומי חלוקות שהושלמו ({archives.length})
            </h4>
            <span className="text-xs text-stone-400">· נשמר עד שנה</span>
          </div>
          <div className="space-y-2">
            {archives.map((a) => {
              const isOpen = expandedArchive === a.id
              const stops = a.summary?.stops || []
              return (
                <div
                  key={a.id}
                  className="border border-stone-100 rounded-xl overflow-hidden bg-stone-50/40"
                >
                  <button
                    onClick={() =>
                      setExpandedArchive(isOpen ? null : a.id)
                    }
                    className="w-full flex items-center justify-between gap-2 p-3 text-right hover:bg-stone-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-stone-800 text-sm truncate">
                        {a.name}
                      </div>
                      <div className="text-xs text-stone-500">
                        {a.dist_date || '—'}
                        {a.branch?.name ? ` · ${a.branch.name}` : ''}
                        {' · '}
                        הושלם{' '}
                        {new Date(a.archived_at).toLocaleDateString('he-IL')}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 shrink-0">
                      {a.delivered_count}/{a.total_stops} נמסרו
                    </span>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-stone-400" />
                    ) : (
                      <ChevronDown size={16} className="text-stone-400" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-t border-stone-100 p-3 space-y-1.5 bg-white">
                      {stops.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-stone-700 truncate">
                              {s.family_name || '—'}
                            </div>
                            <div className="text-[10px] text-stone-500 truncate">
                              {s.family_city}
                              {s.family_address ? `, ${s.family_address}` : ''}
                              {s.claimed_by_name
                                ? ` · ע״י ${s.claimed_by_name}`
                                : ''}
                            </div>
                          </div>
                          {s.photo_url && (
                            <button
                              type="button"
                              onClick={async () => {
                                const w = window.open('about:blank', '_blank')
                                const u = await getDoorPhotoUrl(s.photo_url)
                                if (u && w) w.location.href = u
                                else if (w) w.close()
                              }}
                              className="text-amber-600"
                              title="תמונת מסירה"
                            >
                              <CameraIcon size={14} />
                            </button>
                          )}
                          <span className="text-[10px] text-stone-400 shrink-0">
                            {s.delivered_at
                              ? new Date(s.delivered_at).toLocaleDateString(
                                  'he-IL',
                                )
                              : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {canViewArchives && actArchives.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList size={16} className="text-emerald-600" />
            <h4 className="font-bold text-stone-800 text-sm">
              תחקורי פעילויות ({actArchives.length})
            </h4>
          </div>
          <div className="space-y-2">
            {actArchives.map((a) => {
              const isOpen = expandedAct === a.id
              return (
                <div
                  key={a.id}
                  className="border border-stone-100 rounded-xl overflow-hidden bg-stone-50/40"
                >
                  <button
                    onClick={() => setExpandedAct(isOpen ? null : a.id)}
                    className="w-full flex items-center justify-between gap-2 p-3 text-right hover:bg-stone-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-stone-800 text-sm truncate">
                        {a.name}
                      </div>
                      <div className="text-xs text-stone-500 truncate">
                        {a.project ? `${a.project} · ` : ''}
                        {a.activity_date || '—'}
                        {a.branch?.name ? ` · ${a.branch.name}` : ''}
                      </div>
                    </div>
                    {a.rating ? (
                      <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500 shrink-0">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {a.rating}
                      </span>
                    ) : null}
                    {isOpen ? (
                      <ChevronUp size={16} className="text-stone-400" />
                    ) : (
                      <ChevronDown size={16} className="text-stone-400" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-t border-stone-100 p-3 space-y-2 bg-white text-xs">
                      {a.location && (
                        <div className="text-stone-500">מקום: {a.location}</div>
                      )}
                      <div className="text-stone-500">
                        נרשמו: {a.signed_count ?? 0}
                      </div>
                      <div>
                        <div className="font-semibold text-emerald-700 mb-0.5">
                          מה היה טוב
                        </div>
                        <p className="text-stone-600 whitespace-pre-wrap">
                          {a.what_was_good || '—'}
                        </p>
                      </div>
                      <div>
                        <div className="font-semibold text-amber-700 mb-0.5">
                          מה טעון שיפור
                        </div>
                        <p className="text-stone-600 whitespace-pre-wrap">
                          {a.what_needs_improvement || '—'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

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
