import React from 'react'
import { FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { PROJECTS, STATUS, ROLES, GENERAL_PROJECT } from '../../lib/constants'
import { formatWeekRange } from '../../lib/week'

export default function ExportButton({
  families,
  activities,
  reports,
  profiles = [],
}) {
  const onClick = () => {
    try {
      const wb = XLSX.utils.book_new()

      // מיפוי סניף לפי פרופיל (להצגת הסניף של המדווח בגיליון הדיווחים)
      const branchByProfile = {}
      profiles.forEach((p) => {
        branchByProfile[p.id] = p.branch?.name || ''
      })

      // --- דיווחים: כל הפרטים (מדווח, תפקיד, סניף, שבוע, פעילות, שעות ועוד) ---
      const rep = reports.map((r) => ({
        'מדווח/ת': r.profile?.name || '',
        'תפקיד': ROLES[r.profile?.role]?.label || r.profile?.role || '',
        'סניף': branchByProfile[r.profile_id] || '',
        'שבוע': r.week,
        'טווח תאריכים': r.week ? formatWeekRange(r.week) : '',
        'פעילות': r.activity_name || '',
        'פרויקט': r.project || GENERAL_PROJECT,
        'שעות': r.hours,
        'הערות': r.note || '',
        'תאריך דיווח': r.created_at
          ? new Date(r.created_at).toLocaleDateString('he-IL')
          : '',
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rep), 'דיווחים')

      // --- סיכום שעות לפי פרויקט (כולל "כללי" וכל פרויקט שמופיע בפועל) ---
      const sum = {}
      reports.forEach((r) => {
        const key = r.project || GENERAL_PROJECT
        sum[key] = (sum[key] || 0) + Number(r.hours || 0)
      })
      const projectKeys = [...new Set([...PROJECTS, ...Object.keys(sum)])]
      const summary = projectKeys.map((p) => ({
        'פרויקט': p,
        'סה״כ שעות': sum[p] || 0,
      }))
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(summary),
        'סיכום שעות לפי פרויקט',
      )

      // --- סיכום שעות לפי שבוע ---
      const weekSum = {}
      reports.forEach((r) => {
        if (!r.week) return
        weekSum[r.week] = (weekSum[r.week] || 0) + Number(r.hours || 0)
      })
      const weekSummary = Object.keys(weekSum)
        .sort()
        .reverse()
        .map((w) => ({
          'שבוע': w,
          'טווח תאריכים': formatWeekRange(w),
          'סה״כ שעות': weekSum[w],
        }))
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(weekSummary),
        'סיכום לפי שבוע',
      )

      // --- משפחות ---
      const fam = families.map((f) => ({
        'שם משפחה': f.name,
        'סניף': f.branch?.name || '',
        'עיר': f.city,
        'כתובת': f.address,
        'טלפון': f.phone,
        'סוג צורך': f.need_category,
        'בת שירות אחראית': f.responsible?.name || '',
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fam), 'משפחות')

      // --- פעילויות ---
      const act = activities.map((a) => ({
        'פעילות': a.name,
        'פרויקט': a.project,
        'תאריך': a.activity_date,
        'סניף': a.branch?.name || '',
        'סטטוס': STATUS[a.status]?.label || a.status,
        'משתתפים': a.participants,
        'עלות': a.cost,
        'מדריכים': (a.instructors || [])
          .map((row) => row.profile?.name)
          .filter(Boolean)
          .join(', '),
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(act), 'פעילויות')

      XLSX.writeFile(wb, 'meirim-doch.xlsx')
    } catch (err) {
      console.error(err)
      alert('הייצוא נכשל: ' + (err.message || 'שגיאה לא ידועה'))
    }
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold shadow"
    >
      <FileSpreadsheet size={18} /> ייצוא ל-Excel
    </button>
  )
}
