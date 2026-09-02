/** @type {import('tailwindcss').Config} */
const DYNAMIC_COLORS = ['emerald', 'amber', 'orange', 'sky', 'rose', 'stone']
const SAFE_SHADES = ['50', '100', '200', '400', '500', '600', '700', '800']

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: [
    ...DYNAMIC_COLORS.flatMap((c) => [
      ...SAFE_SHADES.map((s) => `bg-${c}-${s}`),
      ...SAFE_SHADES.map((s) => `text-${c}-${s}`),
      ...SAFE_SHADES.map((s) => `border-${c}-${s}`),
    ]),
    'bg-emerald-50/60',
    'bg-amber-50/60',
    'bg-orange-50/60',
    'bg-sky-50/60',
  ],
  theme: {
    extend: {
      // הכתום המותגי הועמק כדי שיהיה בולט יותר על רקע לבן.
      // מעדכנים רק את הגוונים ה"קדמיים" (טקסט/כפתורים/מסגרות); הגוונים
      // הבהירים (50/100/200/300) נשארים כברירת המחדל כדי לא לשבור רקעים
      // ותגיות בהירות. Tailwind ממזג עמוק, לכן די לדרוס את הגוונים הנבחרים.
      colors: {
        amber: {
          400: '#f59e0b', // היה #fbbf24 — בולט יותר בגרדיאנטים/מסגרות פוקוס
          500: '#dc6803', // היה #f59e0b — הכתום המרכזי, "קופץ" על לבן
          600: '#b54708', // היה #d97706 — טקסט/כפתור כהה יותר (נגיש)
          700: '#8a3a08', // היה #b45309 — טקסט כהה, ניגודיות גבוהה
        },
        orange: {
          500: '#ea580c', // היה #f97316 — כתום עמוק יותר
          600: '#c2410c', // היה #ea580c
        },
      },
      fontFamily: {
        sans: ['Assistant', 'system-ui', 'sans-serif'],
        display: ['"Frank Ruhl Libre"', 'serif'],
      },
    },
  },
  plugins: [],
}
