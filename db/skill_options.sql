-- ============================================================
-- רשימת מיומנויות נדרשות לפעילויות — משותפת, בניהול מנכ"ל
-- הריצי אותי פעם אחת ב-Supabase → SQL Editor. בטוח להרצה חוזרת.
--
-- קריאה: כל משתמש מחובר (כדי לאכלס את בורר המיומנויות בטופס הפעילות).
-- כתיבה (הוספה/מחיקה): מנכ"ל בלבד — נאכף ב-RLS.
-- ============================================================
CREATE TABLE IF NOT EXISTS skill_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE skill_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skill_options read all" ON skill_options;
CREATE POLICY "skill_options read all"
  ON skill_options FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "skill_options admin manage" ON skill_options;
CREATE POLICY "skill_options admin manage"
  ON skill_options FOR ALL TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- זרעים ראשוניים (אפשר לשנות/למחוק דרך הממשק אחר כך)
INSERT INTO skill_options (name) VALUES
  ('עבודה עם ילדים'),
  ('עבודה עם קשישים'),
  ('מוגבלויות'),
  ('הדרכה'),
  ('מוזיקה'),
  ('ספורט'),
  ('אמנות ויצירה'),
  ('בישול')
ON CONFLICT (name) DO NOTHING;

-- רישום ל-Realtime כדי ששינויים של המנכ"ל ישתקפו מיד לכל המשתמשים.
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE skill_options';
  EXCEPTION
    WHEN duplicate_object THEN NULL;   -- כבר רשומה
    WHEN undefined_object THEN NULL;   -- אין publication (סביבה לא-Supabase)
  END;
END $$;
