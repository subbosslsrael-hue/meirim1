import React from 'react'
import { FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { PROJECTS, STATUS } from '../../lib/constants'

export default function ExportButton({ families, activities, reports }) {
  const onClick = () => {
    try {
      const wb = XLSX.utils.book_new()

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

      const rep = reports.map((r) => ({
        'מדווח/ת': r.profile?.name || '',
        'שבוע': r.week,
        'פרויקט': r.project,
        'שעות': r.hours,
        'הערות': r.note,
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rep), 'דיווחים')

      const sum = {}
      reports.forEach(
        (r) => (sum[r.project] = (sum[r.project] || 0) + Number(r.hours || 0)),
      )
      const summary = PROJECTS.map((p) => ({
        'פרויקט': p,
        'סה״כ שעות': sum[p] || 0,
      }))
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(summary),
        'סיכום שעות',
      )

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
