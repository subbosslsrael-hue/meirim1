// מפתח שבוע הדיווח: תאריך יום שבת שמתחיל את השבוע (YYYY-MM-DD).
// השבוע "מתאפס" כל שבת ב-00:00 (מסונכרן ללוח השנה).
export function currentReportWeek() {
  const d = new Date()
  const diff = (d.getDay() + 1) % 7 // ימים שעברו מאז יום שבת האחרון (שבת=0)
  const sat = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff)
  return `${sat.getFullYear()}-${String(sat.getMonth() + 1).padStart(2, '0')}-${String(
    sat.getDate(),
  ).padStart(2, '0')}`
}
