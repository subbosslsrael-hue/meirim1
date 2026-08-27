// מפתח שבוע הדיווח: תאריך יום ראשון שמתחיל את השבוע (YYYY-MM-DD).
// השבוע רץ מיום ראשון עד יום שבת ו"מתאפס" כל יום ראשון ב-00:00.

const pad = (n) => String(n).padStart(2, '0')
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// מפתח השבוע (יום ראשון הפותח) עבור תאריך נתון.
// כל תאריך "נצמד" ליום ראשון של אותו שבוע — כך שגם בחירת תאריך
// באמצע השבוע מחזירה תמיד את השבוע השלם (ראשון עד שבת).
export function weekKeyForDate(date) {
  const diff = date.getDay() // ימים שעברו מאז יום ראשון האחרון (ראשון=0 … שבת=6)
  const sun = new Date(date.getFullYear(), date.getMonth(), date.getDate() - diff)
  return fmt(sun)
}

// מפתח השבוע הנוכחי.
export function currentReportWeek() {
  return weekKeyForDate(new Date())
}

// המרת מפתח 'YYYY-MM-DD' לאובייקט Date מקומי.
function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// טווח התאריכים של השבוע: יום ראשון (start) עד יום שבת (end).
export function weekRange(key) {
  const start = parseKey(key)
  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 6,
  )
  return { start, end }
}

// תווית קריאה לטווח השבוע, למשל "23.8 – 29.8.2026".
export function formatWeekRange(key) {
  const { start, end } = weekRange(key)
  const dm = (x) => `${x.getDate()}.${x.getMonth() + 1}`
  return `${dm(start)} – ${dm(end)}.${end.getFullYear()}`
}

// רשימת מפתחות השבועות האחרונים, מהחדש לישן (כולל השבוע הנוכחי).
export function recentWeeks(count = 8) {
  const today = new Date()
  const keys = []
  for (let i = 0; i < count; i++) {
    const d = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 7 * i,
    )
    keys.push(weekKeyForDate(d))
  }
  return keys
}
