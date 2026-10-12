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
  MessagesSquare,
  UserPlus,
  Star,
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
    desc: 'מסך הפתיחה האישי. מציג לכל משתמש "מה דורש ממנו פעולה" (תחקורים שצריך למלא, הודעות מנהלים והודעות צ׳אט חדשות, יעדי חלוקה שטרם נמסרו), נתונים מותאמים לתפקיד וקיצורי דרך מהירים. למתנדבים ולמדריכים מוצג גם לאיזה סניף הם משויכים ומי בת השירות האחראית.',
  },
  {
    icon: Users,
    title: 'ניהול משפחות',
    desc: 'מאגר המשפחות הנתמכות — הוספה, עריכה ומחיקה של פרטים והערות. הכתובת מושלמת אוטומטית ממאגר כתובות אמת (רחוב + מספר בית) כדי שתופיע נכון על המפה, הטלפון מוגבל ל-10 ספרות, וחובה לשייך כל משפחה לבת שירות אחראית. המערכת מונעת כפילות (אותה משפחה — שם וטלפון זהים — לא תיווצר פעמיים). כולל ייבוא מאקסל וחילוף אחריות מרוכז בין בנות שירות.',
  },
  {
    icon: CalendarHeart,
    title: 'פעילויות ומדריכים',
    desc: 'תכנון פעילויות (תיאור, תאריך — מהיום והלאה בלבד, שעה, מקום), בחירת הכישורים הנדרשים מתוך רשימה שהמנכ"ל מנהל (או כישור חופשי תחת "אחר"), שיבוץ מדריכים לפי כישורים, הרשמת מתנדבים וצ׳אט נפרד לכל פעילות עם סימון הודעות חדשות. יוצר הפעילות ובת השירות רואים את פרטי הנרשמים. יום אחרי שהפעילות מתקיימת — חובת תחקור שנשמר בדיווחים; ניתן גם לסמן שהפעילות לא התקיימה, ותחקור ממתין מוצג בלוח הבקרה.',
  },
  {
    icon: Truck,
    title: 'חלוקת מוצרים',
    desc: 'ניהול חלוקות סלי מזון על מפה אמיתית עם מסלול נסיעה מותאם ועדכון חי בכל לקיחת יעד או מסירה. מתנדבים "לוקחים" יעדים, מנווטים בוויז, מסמנים מסירה ומצלמים את פתח הבית. לא ניתן לקבוע חלוקה לתאריך שעבר. בת השירות והמתנדב רואים את כל יעדי החלוקה, והיעדים שבסניף שלהם מודגשים בבירור (טבעת זהב במפה ותגית ברשימה). בסיום החלוקה — ארכוב אוטומטי לסיכום.',
  },
  {
    icon: MessagesSquare,
    title: 'צ׳אט',
    desc: 'צ׳אט ארגוני בשני ערוצים: "כללי" לשאלות ושיח של כולם, ו"הודעות חשובות" שבו רק המנכ"ל ובנות השירות יכולים לפרסם (וכולם קוראים). כולל תגובות אימוג׳י, מענה להודעה, עריכה ומחיקה, סימון הודעות שלא נקראו, ועדכון חי. בנוסף, בת שירות יכולה לנהל שיחה פרטית עם המנכ"ל.',
  },
  {
    icon: UserPlus,
    title: 'בקשות כניסה',
    desc: 'אישור משתמשים חדשים לפני שהם נכנסים למערכת. המנכ"ל מאשר בנות שירות; מדריכים ומתנדבים מנותבים אוטומטית לאישור בת השירות של הסניף שלהם (ואם אין בסניף בת שירות — למנכ"ל). עד לאישור המשתמש ממתין במסך ייעודי.',
  },
  {
    icon: Contact,
    title: 'צוות',
    desc: 'רשימת כל אנשי הצוות — בנות שירות, מדריכים ומתנדבים — עם טלפון, גיל וסניף. כל אחד יכול לערוך את הפרטים שלו; המנכ"ל רואה, עורך ומוחק את כולם; בת שירות רואה ועורכת את צוות הסניף שלה, מוחקת אנשי צוות שתחתיה, מעבירה איש צוות לסניף אחר ומבצעת חילוף של בת שירות אחראית.',
  },
  {
    icon: Star,
    title: 'המיומנויות שלי',
    desc: 'כרטיסייה למדריכים לצפייה ולעדכון של הכישורים שלהם (מתוך הרשימה הארגונית או כישור חופשי). המנכ"ל ובת השירות יכולים לעדכן את כישורי המדריכים גם מתוך עמוד הצוות.',
  },
  {
    icon: ClipboardList,
    title: 'דיווחים ומעקב',
    desc: 'דיווח שעות שבועי — בוחרים שבוע בלוח שנה (שבוע שלם, ראשון עד שבת), רואים אילו שבועות כבר דווחו, ומשייכים שעות לפעילות או ל"כללי" כשאין פעילות (ואפשר לסמן "ללא פעילות" בלי שעות). טבלת-על שבועית (שבועות בשורות, מדווחים בעמודות, שעות בתאים) עם צלילה לפרטים, ודוחות לפי טווח תאריכים — סיכום שעות לכל מדווח/ת ופילוח פעילויות לפי קטגוריה עם תרשים עוגה. כולל סיכום שבועי, מעקב מי מילא וייצוא מלא לאקסל. בנות שירות ומדריכים חייבים למלא דיווח בכל שבוע (חלון שמופיע אוטומטית עד שהשבוע דווח). כולל ארכיון קבוע של סיכומי חלוקות ותחקורי פעילויות.',
  },
]

const ROLES = [
  {
    role: 'מנכ״ל',
    desc: 'גישה מלאה לכל המערכת ולכל הסניפים: אישור בנות שירות חדשות, שעות מדווחות, צוות מלא (עריכה, מחיקה ושיוך לסניפים), ועמוד אפיון זה.',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    role: 'בת שירות',
    desc: 'ניהול הסניף שלה — משפחות, פעילויות, חלוקות וצוות הסניף (עריכה, מחיקה והעברה בין סניפים). מאשרת מדריכים ומתנדבים בסניף, רואה את כל יעדי החלוקה (ושלה מודגשים), ומנהלת שיחה פרטית עם המנכ"ל. חייבת למלא דיווח שבועי.',
    cls: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  {
    role: 'מדריך',
    desc: 'יצירה וניהול של פעילויות, בחירת הכישורים שלו וצפייה בהם, צ׳אט עם הנרשמים ותחקור. חייב למלא דיווח שבועי.',
    cls: 'bg-sky-50 text-sky-700 border-sky-100',
  },
  {
    role: 'מתנדב',
    desc: 'הרשמה לפעילויות, לקיחת יעדי חלוקה, סימון מסירה וצילום פתח-בית. רואה את כל יעדי החלוקה, ואלה שבסניף שלו מודגשים.',
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
