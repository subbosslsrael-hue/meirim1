import React from 'react'
import {
  LayoutDashboard,
  Users,
  CalendarHeart,
  Truck,
  Contact,
  ClipboardList,
  ShieldCheck,
  Archive,
  TrendingUp,
  Database,
} from 'lucide-react'
import Card from '../shared/Card'
import { useFamilies } from '../../hooks/useFamilies'
import { useActivities } from '../../hooks/useActivities'
import { useReports } from '../../hooks/useReports'
import { useProfiles } from '../../hooks/useProfiles'

const MODULES = [
  {
    icon: LayoutDashboard,
    title: 'לוח בקרה',
    desc: 'מסך הפתיחה האישי. מציג לכל משתמש "מה דורש ממנו פעולה" (תחקורים שצריך למלא, צ׳אטים עם הודעות חדשות, יעדי חלוקה שטרם נמסרו), נתונים מותאמים לתפקיד וקיצורי דרך מהירים.',
  },
  {
    icon: Users,
    title: 'ניהול משפחות',
    desc: 'מאגר המשפחות הנתמכות — הוספה ועריכה של פרטים, הערות, שיוך בת שירות אחראית, ייבוא מאקסל, וחילוף אחריות מרוכז בין בנות שירות. כל משפחה כוללת כתובת על המפה וטלפון תקין.',
  },
  {
    icon: CalendarHeart,
    title: 'פעילויות ומדריכים',
    desc: 'תכנון פעילויות (תיאור, יום, שעה, מקום), שיבוץ מדריכים לפי כישורים, הרשמת מתנדבים, וצ׳אט נפרד לכל פעילות עם סימון הודעות חדשות. יוצר הפעילות ובת השירות רואים את פרטי הנרשמים. יום אחרי שהפעילות מתקיימת — חובת תחקור שנשמר בדיווחים.',
  },
  {
    icon: Truck,
    title: 'חלוקת מוצרים',
    desc: 'ניהול חלוקות סלי מזון על מפה אמיתית עם מסלול נסיעה מותאם. מתנדבים "לוקחים" יעדים, מנווטים בוויז, מסמנים מסירה ומצלמים את פתח הבית. בסיום החלוקה — ארכוב אוטומטי לסיכום.',
  },
  {
    icon: Contact,
    title: 'צוות',
    desc: 'רשימת כל אנשי הצוות — בנות שירות, מדריכים ומתנדבים — עם טלפון, גיל וסניף. המנכ"ל רואה את כולם; בת שירות רואה את צוות הסניף שלה.',
  },
  {
    icon: ClipboardList,
    title: 'דיווחים ומעקב',
    desc: 'דיווח שעות שבועי לפי פעילות עם סיכום שבועי, מעקב מי מילא את הדיווח, וארכיון קבוע של סיכומי חלוקות ותחקורי פעילויות. בנות שירות ומדריכים חייבים למלא דיווח בכל שבוע.',
  },
]

const ROLES = [
  {
    role: 'מנכ״ל',
    desc: 'גישה מלאה לכל המערכת ולכל הסניפים, כולל שעות מדווחות, צוות מלא, ועמוד אפיון זה.',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    role: 'בת שירות',
    desc: 'ניהול הסניף שלה — משפחות, פעילויות, חלוקות וצוות הסניף. חייבת למלא דיווח שבועי.',
    cls: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  {
    role: 'מדריך',
    desc: 'יצירה וניהול של פעילויות, צ׳אט עם הנרשמים, ותחקור. חייב למלא דיווח שבועי.',
    cls: 'bg-sky-50 text-sky-700 border-sky-100',
  },
  {
    role: 'מתנדב',
    desc: 'הרשמה לפעילויות, לקיחת יעדי חלוקה, סימון מסירה וצילום פתח-בית.',
    cls: 'bg-orange-50 text-orange-700 border-orange-100',
  },
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
  const { data: profiles } = useProfiles()
  const totalHours = reports.reduce((s, r) => s + Number(r.hours || 0), 0)
  const teamCount = profiles.filter((p) => p.role !== 'admin').length

  return (
    <div className="space-y-5">
      <Card className="p-5 bg-gradient-to-l from-amber-50 to-emerald-50 border-amber-100">
        <h2 className="font-display text-xl font-black text-emerald-800 mb-1">
          על המערכת — מדריך מנהלים
        </h2>
        <p className="text-sm text-stone-600">
          מערכת "מאירים" מרכזת במקום אחד את כל הפעילות של העמותה: ניהול
          המשפחות הנתמכות, הפעילויות והמדריכים, חלוקות סלי המזון, הצוות
          והדיווחים. המסמך הזה מסביר בקצרה מה כל חלק עושה ומי רשאי לגשת אליו.
        </p>
      </Card>

      <Section icon={LayoutDashboard} title="המודולים במערכת">
        <div className="space-y-3">
          {MODULES.map((m) => {
            const Icon = m.icon
            return (
              <div key={m.title} className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <div className="font-bold text-stone-800 text-sm">
                    {m.title}
                  </div>
                  <p className="text-sm text-stone-600 mt-0.5">{m.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      <Section icon={ShieldCheck} title="מי רואה מה — תפקידים והרשאות">
        <div className="grid md:grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <div
              key={r.role}
              className={`p-3 rounded-xl border ${r.cls}`}
            >
              <div className="font-bold text-sm mb-0.5">{r.role}</div>
              <p className="text-xs text-stone-600">{r.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-stone-400 mt-3">
          ההרשאות נאכפות גם בשרת — כל משתמש רואה ועורך רק את מה שמותר לתפקידו
          ולסניפו, גם אם ינסה לעקוף את הממשק.
        </p>
      </Section>

      <Section icon={Archive} title="מה המערכת שומרת לתמיד">
        <ul className="space-y-2 text-sm text-stone-700">
          <li className="flex gap-2">
            <Truck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <b>סיכומי חלוקות שהושלמו</b> — מי קיבל, מתי, וצילומי המסירה.
            </span>
          </li>
          <li className="flex gap-2">
            <ClipboardList size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <b>תחקורי פעילויות</b> — מה היה טוב ומה לשפר לפעם הבאה, כולל קבצים
              מצורפים לשימוש חוזר.
            </span>
          </li>
          <li className="flex gap-2">
            <ClipboardList size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <b>דיווחי השעות השבועיים</b> — לכל מדריך ובת שירות, לפי פעילות.
            </span>
          </li>
        </ul>
      </Section>

      <Section icon={TrendingUp} title="המערכת במספרים (כעת)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {[
            { v: families.length, l: 'משפחות מנוהלות' },
            { v: activities.length, l: 'פעילויות פעילות' },
            { v: teamCount, l: 'אנשי צוות' },
            { v: totalHours, l: 'שעות מדווחות' },
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

      <Section icon={Database} title="על מה המערכת בנויה">
        <p className="text-sm text-stone-600">
          המערכת פועלת בדפדפן ובנייד (ללא התקנה), והמידע נשמר בענן מאובטח
          (Supabase / PostgreSQL) עם גיבוי, עדכון חי בין משתמשים, והרשאות לפי
          תפקיד. המפות והניווט מבוססים על שירותי מפות פתוחים.
        </p>
      </Section>
    </div>
  )
}
