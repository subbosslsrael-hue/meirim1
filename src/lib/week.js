// מפתח שבוע הדיווח: תאריך יום שבת שמתחיל את השבוע (YYYY-MM-DD).
// השבוע "מתאפס" כל שבת ב-00:00 (מסונכרן ללוח השנה).

const pad = (n) => String(n).padStart(2, '0')
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// מפתח השבוע (יום השבת הפותח) עבור תאריך נתון.
export function weekKeyForDate(date) {
  const diff = (date.getDay() + 1) % 7 // ימים שעברו מאז יום שבת האחרון (שבת=0)
  const sat = new Date(date.getFullYear(), date.getMonth(), date.getDate() - diff)
  return fmt(sat)
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

// טווח התאריכים של השבוע: יום שבת (start) עד יום שישי (end).
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
