-- ============================================================
-- בדיקת כפילות משפחות — חוצת-סניפים
-- הריצי אותי פעם אחת ב-Supabase → SQL Editor.
-- בטוח להרצה חוזרת (CREATE OR REPLACE).
--
-- מטרה: לחסום יצירת/עריכת משפחה עם פרטים זהים גם כשהכפילות נמצאת
-- בסניף אחר. הפונקציה רצה ב-SECURITY DEFINER (עוקפת RLS ובודקת בכל
-- הסניפים) אך מחזירה true/false בלבד — כך בת שירות לא רואה פרטי
-- משפחות מסניפים אחרים, רק מקבלת חסימה.
--
-- "כפילות" = אותו טלפון (מנורמל), או אותו שם + עיר + כתובת
-- (השוואה ללא רגישות לרישיות ולרווחים מיותרים).
-- ============================================================
CREATE OR REPLACE FUNCTION family_duplicate_exists(
  p_name    TEXT,
  p_city    TEXT,
  p_address TEXT,
  p_phone   TEXT,
  p_exclude UUID DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM families f
    WHERE (p_exclude IS NULL OR f.id <> p_exclude)
      AND (
        (p_phone IS NOT NULL AND p_phone <> '' AND f.phone = p_phone)
        OR (
          lower(trim(coalesce(f.name, '')))    = lower(trim(coalesce(p_name, '')))
          AND lower(trim(coalesce(f.city, ''))) = lower(trim(coalesce(p_city, '')))
          AND lower(trim(coalesce(f.address,''))) = lower(trim(coalesce(p_address,'')))
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION
  family_duplicate_exists(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
