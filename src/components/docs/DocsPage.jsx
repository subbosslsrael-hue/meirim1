import React from 'react'
import {
  Database,
  Workflow,
  Cpu,
  BookOpen,
  TrendingUp,
} from 'lucide-react'
import Card from '../shared/Card'
import { useFamilies } from '../../hooks/useFamilies'
import { useActivities } from '../../hooks/useActivities'
import { useReports } from '../../hooks/useReports'

const ENTITIES = [
  { e: 'BRANCH', he: 'סניף', fields: 'id, name, city' },
  {
    e: 'PROFILE',
    he: 'פרופיל משתמש',
    fields: 'id↗auth.users, name, role, phone, branch_id↗, skills',
  },
  {
    e: 'FAMILY',
    he: 'משפחה נתמכת',
    fields: 'id, name, need_category, branch_id↗, responsible_profile_id↗, lat, lng, door_photo_url',
  },
  {
    e: 'ACTIVITY',
    he: 'פעילות',
    fields: 'id, name, project, activity_date, status, cost, branch_id↗, rating',
  },
  {
    e: 'ACTIVITY_INSTRUCTOR',
    he: 'שיבוץ מדריך (N:N)',
    fields: 'activity_id↗, profile_id↗',
  },
  {
    e: 'ACTIVITY_PARTICIPANT',
    he: 'הרשמת מתנדב (N:N)',
    fields: 'activity_id↗, profile_id↗',
  },
  {
    e: 'DISTRIBUTION',
    he: 'חלוקה',
    fields: 'id, name, dist_date, items, branch_id↗',
  },
  {
    e: 'DISTRIBUTION_STOP',
    he: 'יעד חלוקה',
    fields: 'id, distribution_id↗, family_id↗, delivered, photo_url, claimed_by↗',
  },
  {
    e: 'ACTIVITY_REPORT',
    he: 'דיווח שבועי',
    fields: 'id, profile_id↗, week, project, hours',
  },
]

const MAPPING = [
  {
    p: 'ניהול משפחות',
    solves: 'עבודה כפולה ואובדן מידע מקובצי אקסל',
    how: 'קליטה ישירה לשדות קבועים מראש + RLS לפי סניף',
  },
  {
    p: 'שיבוץ מדריכים לפי קטגוריה',
    solves: 'אובדן זיכרון ארגוני וכאוס דיווח',
    how: 'ניהול פעילות מתכנון ועד תחקור, מקושר לכישורים',
  },
  {
    p: 'שיוך אוטומטי משפחה–בת שירות',
    solves: 'החלפות אחריות שנתיות לא מתועדות',
    how: 'חילוף מרוכז עם עדכון אוטומטי בכל הטבלאות',
  },
  {
    p: 'חלוקה על מפת GIS + צילום',
    solves: 'חוסר יעילות לוגיסטי ואיחורים',
    how: 'Leaflet+OSM, גיאוקוד דרך Nominatim, אופטימיזציית מסלול, תמונת פתח',
  },
  {
    p: 'דיווח שבועי + עיבוד אוטומטי',
    solves: 'היעדר נתונים כמותיים לניהול',
    how: 'מדדי תפוקה ושעות לפי פרויקט בזמן אמת (Realtime Supabase)',
  },
]

const LITERATURE = [
  'מערכות CRM וניהול קשרי מתנדבים במגזר השלישי (Third-Sector / Nonprofit IS)',
  'מתודולוגיית DMAIC ו-Six Sigma לשיפור תהליכים',
  'תקן מידול תהליכים BPMN 2.0 (OMG) להשוואת As-Is מול To-Be',
  'בעיית ניתוב כלי רכב (Vehicle Routing Problem) ו-GIS בלוגיסטיקה הומניטרית',
  'ניהול ידע ארגוני (Knowledge Management) ומניעת אובדן ידע שבטי',
  'חקר עבודה ומדידת זמנים (Work Study / Time Study)',
  'עקרונות חווית משתמש (UX) ונגישות בממשקי RTL בעברית',
]

const Section = ({ icon: Icon, title, children }) => (
  <Card className="p-5">
    <div className="flex items-center gap-2 mb-3">
      <Icon size={18} className="text-amber-500" />
      <h3 className="font-bold text-stone-800">{title}</h3>
    </div>
    {children}
  </Card>
)

export default function DocsPage() {
  const { data: families } = useFamilies()
  const { data: activities } = useActivities()
  const { data: reports } = useReports()
  const totalHours = reports.reduce((s, r) => s + Number(r.hours || 0), 0)

  return (
    <div className="space-y-5">
      <Card className="p-5 bg-gradient-to-l from-amber-50 to-emerald-50 border-amber-100">
        <h2 className="font-display text-xl font-black text-emerald-800 mb-1">
          אפיון המערכת ותיעוד הנדסי
        </h2>
        <p className="text-sm text-stone-600">
          מסמך חי המסכם את מודל הנתונים, התהליכים, מדדי הביצוע, המתודולוגיה
          ההנדסית וכיווני סקירת הספרות של פרויקט הגמר בעמותת מאירים.
        </p>
      </Card>

      <Section icon={Database} title="ישויות מסד הנתונים (ERD)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-stone-500 bg-stone-50">
              <tr>
                <th className="text-right px-3 py-2 font-semibold">ישות</th>
                <th className="text-right px-3 py-2 font-semibold">תיאור</th>
                <th className="text-right px-3 py-2 font-semibold">
                  שדות עיקריים (↗ = מפתח זר)
                </th>
              </tr>
            </thead>
            <tbody>
              {ENTITIES.map((x) => (
                <tr key={x.e} className="border-t border-stone-100">
                  <td className="px-3 py-2 font-mono text-xs text-emerald-700 font-bold">
                    {x.e}
                  </td>
                  <td className="px-3 py-2 text-stone-700">{x.he}</td>
                  <td className="px-3 py-2 text-stone-500 text-xs">{x.fields}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-stone-400 mt-2">
          9 ישויות, 2 קשרי רבים-לרבים (שיבוץ מדריכים, הרשמת מתנדבים, יעדי חלוקה).
          RLS פעיל על כל הטבלאות לפי תפקיד וסניף.
        </p>
      </Section>

      <Section icon={Workflow} title="מיפוי תהליכים לבעיות ההנדסיות">
        <div className="space-y-2">
          {MAPPING.map((m, i) => (
            <div
              key={i}
              className="grid md:grid-cols-3 gap-2 p-3 rounded-xl bg-stone-50/70 border border-stone-100 text-sm"
            >
              <div className="font-bold text-emerald-700">{m.p}</div>
              <div className="text-stone-500">
                <span className="text-rose-500 font-semibold">פותר: </span>
                {m.solves}
              </div>
              <div className="text-stone-600">
                <span className="text-amber-600 font-semibold">כיצד: </span>
                {m.how}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid lg:grid-cols-2 gap-5">
        <Section icon={Cpu} title="מתודולוגיה וטכנולוגיה">
          <ul className="space-y-2 text-sm text-stone-700">
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">DMAIC</span> — חקר
              המצב הקיים ומדידת זמני עבודה
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">BPMN</span> — מידול
              והשוואת מצב קיים מול מוצע
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">DFD + ERD</span> —
              ניתוח זרימת נתונים ועיצוב מסד הנתונים
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600 font-bold">React + Vite</span> —
              צד לקוח (חווית משתמש)
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600 font-bold">Supabase</span> —
              PostgreSQL, Auth, Storage, Realtime
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600 font-bold">Leaflet + OSM</span>{' '}
              — תכנון מסלולי חלוקה
            </li>
          </ul>
        </Section>

        <Section icon={BookOpen} title="כיווני סקירת ספרות">
          <ul className="space-y-1.5 text-sm text-stone-700 list-disc pr-5">
            {LITERATURE.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </Section>
      </div>

      <Section icon={TrendingUp} title="מדדי ביצוע (KPIs) שהמערכת מפיקה">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {[
            { v: families.length, l: 'משפחות מנוהלות' },
            { v: totalHours, l: 'שעות מדווחות' },
            { v: activities.length, l: 'פעילויות' },
            { v: 'GIS', l: 'אופטימיזציית מסלול' },
          ].map((k, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-emerald-50 border border-amber-100"
            >
              <div className="text-2xl font-extrabold text-emerald-700">
                {k.v}
              </div>
              <div className="text-xs text-stone-500 mt-1">{k.l}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
