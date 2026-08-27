import React from 'react'
import { Check, CalendarDays } from 'lucide-react'
import {
  recentWeeks,
  formatWeekRange,
  currentReportWeek,
  weekKeyForDate,
} from '../../lib/week'

// בורר שבוע לדיווח:
//   • בחירה חופשית לפי תאריך (לוח שנה) — כל תאריך "נצמד" לשבוע שלו.
//   • רשימת השבועות האחרונים; שבוע שכבר דווח מסומן ✓ ואינו ניתן לבחירה.
// value / onChange עובדים על מפתח השבוע (מחרוזת 'YYYY-MM-DD' של יום השבת הפותח).
export default function WeekPicker({
  value,
  onChange,
  reportedWeeks = [],
  weeksToShow = 8,
}) {
  const reported = new Set(reportedWeeks)
  const current = currentReportWeek()
  const weeks = recentWeeks(weeksToShow)
  // ודא שהשבוע הנבחר מופיע ברשימה גם אם הוא ישן מהחלון המוצג.
  const list = value && !weeks.includes(value) ? [value, ...weeks] : weeks

  const onDate = (e) => {
    if (!e.target.value) return
    const [y, m, d] = e.target.value.split('-').map(Number)
    onChange(weekKeyForDate(new Date(y, m - 1, d)))
  }

  return (
    <div className="mb-3">
      <label className="block text-sm font-semibold text-stone-600 mb-1.5">
        בחר/י שבוע לדיווח
      </label>

      <div className="flex items-center gap-2 mb-2 text-xs text-stone-500">
        <CalendarDays size={14} className="text-amber-500 shrink-0" />
        <span className="shrink-0">בחירה לפי תאריך:</span>
        <input
          type="date"
          onChange={onDate}
          className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-stone-200 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1 border border-stone-100 rounded-xl p-1.5">
        {list.map((key) => {
          const isReported = reported.has(key)
          const isSel = key === value
          return (
            <button
              key={key}
              type="button"
              disabled={isReported && !isSel}
              onClick={() => onChange(key)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-right transition ${
                isSel
                  ? 'bg-amber-500 text-white font-semibold shadow'
                  : isReported
                    ? 'bg-emerald-50 text-emerald-700 cursor-default'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span>
                {formatWeekRange(key)}
                {key === current ? ' · השבוע' : ''}
              </span>
              {isReported ? (
                <span className="flex items-center gap-1 text-xs font-semibold shrink-0">
                  <Check size={14} /> דווח
                </span>
              ) : isSel ? (
                <Check size={16} className="shrink-0" />
              ) : null}
            </button>
          )
        })}
      </div>

      {value && reported.has(value) && (
        <p className="text-xs text-amber-700 mt-1.5">
          כבר קיים דיווח לשבוע זה.
        </p>
      )}
    </div>
  )
}
