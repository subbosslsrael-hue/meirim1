# הוראת פתיחה לקלוד קוד

זה הטקסט שתעתיק במלואו לחלון של קלוד קוד בריצה הראשונה.
התחל מהשורה הבאה (אחרי הקו), עד סוף המסמך.

---

שלום קלוד. אתה הולך להפוך אב-טיפוס React לאפליקציית ייצור אמיתית עבור עמותת "מאירים" — עמותה ישראלית שמסייעת למשפחות במצוקה בדרום הארץ. המערכת תשמש 200+ אנשי שטח בעברית.

## הקשר

קיים בתיקייה זו קובץ אב-טיפוס בשם `prototype.jsx`. הוא עובד מקצה לקצה אבל הוא דמו חד-משתמש שרץ בדפדפן בלי שרת. תפקידך להפוך אותו ל:
- אפליקציית React-Vite מודולרית עם מבנה תיקיות נכון
- מחוברת ל-Supabase (PostgreSQL + Auth + Storage)
- עם אוטנטיקציה אמיתית במקום הדמו של RolePicker
- עם RLS שכבר הוגדר ב-Supabase שיגן על ההרשאות
- מוכנה לפריסה ב-Netlify

## נתונים שיש לך

- `prototype.jsx` — קוד האב-טיפוס המלא. **קרא אותו ראשון כולו** לפני שאתה כותב משהו. הוא מתעד את כל לוגיקת המוצר.
- `.env.local` — מכיל את `VITE_SUPABASE_URL` ו-`VITE_SUPABASE_ANON_KEY` של פרויקט Supabase שכבר הוקם.
- הסכמה כבר רצה ב-Supabase. הטבלאות והפוליסות קיימות. אסור לך לרוץ migrations נוספות בלי לבקש אישור.

## טכנולוגיות

- Vite + React 18
- @supabase/supabase-js
- Tailwind CSS (עם הגדרת RTL)
- Lucide React לאייקונים
- Recharts לתרשימים
- SheetJS (xlsx) לייצוא Excel
- Leaflet + react-leaflet למפת GIS אמיתית (במקום ה-SVG הסכמטי שבאב-טיפוס)

## המעבר — שלבים בסדר חובה

### שלב א: הקמת שלד
‎1. הקם פרויקט Vite + React חדש בתיקייה הנוכחית: `npm create vite@latest . -- --template react`.
‎2. התקן Tailwind CSS לפי המדריך הרשמי שלהם עבור Vite.
‎3. הוסף `.gitignore` שמתעלם מ-`node_modules`, `dist`, ו-`.env.local`.
‎4. וודא שהאפליקציה הריקה עולה: `npm run dev`.

### שלב ב: התשתית
‎1. צור `src/lib/supabase.js` שמייצא client של `@supabase/supabase-js` מבוסס על משתני הסביבה.
‎2. צור `src/contexts/AuthContext.jsx` שמספק את המשתמש המחובר, ה-profile, ופונקציות login/logout/signup.
‎3. צור `src/hooks/` עם hooks ייעודיים לכל טבלה: `useFamilies`, `useActivities`, `useDistributions`, `useReports`. כל hook יטען נתונים מ-Supabase ויחזיר `{data, loading, error, mutate}`.
‎4. הוסף Realtime listening לטבלאות שמשתנות תכופות (פעילויות, יעדי חלוקה).

### שלב ג: פיצול ה-prototype
פצל את `prototype.jsx` למבנה הבא:

```
src/
  components/
    auth/
      LoginScreen.jsx          (במקום RolePicker — login אמיתי)
      RoleSelector.jsx         (לפעם ראשונה אחרי הרשמה)
    layout/
      Sidebar.jsx
      Header.jsx
    dashboard/Dashboard.jsx
    families/
      FamiliesPage.jsx
      FamilyCard.jsx
      FamilyForm.jsx
      ImportFromExcel.jsx
      ChangeoverModal.jsx
    activities/
      ActivitiesPage.jsx
      ActivityCard.jsx
      ActivityForm.jsx
      DebriefModal.jsx
    distribution/
      DistributionPage.jsx
      DistributionMap.jsx      (Leaflet אמיתי)
      StopsList.jsx
    reports/
      ReportsPage.jsx
      ComplianceTracker.jsx
      ExportButton.jsx
    docs/DocsPage.jsx
    shared/
      Card.jsx
      Modal.jsx
      Field.jsx
  App.jsx
  main.jsx
  index.css
```

כל קובץ קצר וממוקד. אם קובץ עובר 200 שורות — חשוב לפצל אותו.

### שלב ד: החלפת הרשאות מקומיות באמיתיות
- במקום ה-RolePicker שכותב ל-localStorage, השתמש ב-Supabase Auth.
- ה-RLS כבר מסנן בצד השרת — אבל גם בקליינט, השתמש ב-profile.role כדי להציג/להסתיר UI (חזרה על הלוגיקה של האב-טיפוס).
- מסך כניסה ראשונה לבת שירות חדשה: אחרי signup, חייב להראות RoleSelector שבוחר סניף ומעדכן את ה-profile.

### שלב ה: GIS אמיתי
- החלף את ה-SVG הסכמטי ב-Leaflet עם תילים של OpenStreetMap.
- בעת הוספת משפחה חדשה, השתמש ב-Nominatim API (החינמי של OpenStreetMap) להמרת כתובת לקואורדינטות.
- שמור `lat`/`lng` בטבלה.

### שלב ו: צילום פתח הבית
- כשמשתמש לוחץ על אייקון המצלמה, פתח `<input type="file" accept="image/*" capture="environment">`.
- העלה ל-Supabase Storage תחת `door-photos/{family_id}-{timestamp}.jpg`.
- עדכן `families.door_photo_url` ו-`distribution_stops.photo_url`.

### שלב ז: בדיקות ידניות
לפני שאתה אומר "סיימתי", רוץ דרך התרחישים האלה:

‎1. Signup חדש כ-volunteer → התחברות → נווט לפעילויות → הירשם לפעילות.
‎2. Login כ-service (אחרי שמעלה ידנית את ה-role ב-Supabase) → ראה רק את משפחות הסניף שלך.
‎3. Login כ-admin → גישה מלאה, חילוף אחראית בין שתי בנות שירות.
‎4. צילום פתח בית במכשיר נייד → התמונה נשמרת ומופיעה.
‎5. ייצוא לאקסל → הקובץ יורד תקין.

## הנחיות עבודה איתי

- אני יזהר (קוראים לי גם יעקב), המייסד. **אני לא מפתח**. תסביר לי בעברית ברורה כל צעד.
- לפני שאתה רץ פקודה שמשנה את המערכת (התקנה, מחיקה, push) — בקש אישור ותסביר מה זה עושה.
- אם נתקלת בשגיאה — תספר לי במילים פשוטות מה היא ומה אתה מציע לעשות.
- אל תיצור קוד מנוחש לפי תקשורת חלקית — אם יש ספק, תשאל.
- שמור את העיצוב והניסוח העברי כמו באב-טיפוס: גוונים זהובים-ירוקים, RTL מלא, Assistant + Frank Ruhl Libre, אייקוני Lucide.

## איך להתחיל

‎1. ענה לי "מוכן" וסכם במשפט אחד מה הבנת.
‎2. שאל אותי שאלה אחת בלבד אם משהו חיוני לא ברור.
‎3. אחרת — תתחיל משלב א.

קדימה.
