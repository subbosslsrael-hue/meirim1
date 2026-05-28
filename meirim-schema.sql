-- ============================================================
-- מאירים – סכמת מסד נתונים מלאה ל-Supabase
-- העתק את כל הקובץ הזה ל-SQL Editor בלוח הבקרה של Supabase
-- והרץ בלחיצה אחת.  השדות הם באנגלית (קונבנציה של DB),
-- הערכים והממשק יוצגו בעברית בצד הלקוח.
-- ============================================================

-- 1. סוגי enum
CREATE TYPE user_role AS ENUM ('admin', 'service', 'volunteer', 'instructor');
CREATE TYPE activity_status AS ENUM ('planning', 'active', 'done');

-- 2. סניפים
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. פרופילים – משתמשים מחוברים ל-Supabase Auth
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'volunteer',
  phone TEXT,
  branch_id UUID REFERENCES branches(id),
  skills TEXT,
  active_from DATE DEFAULT CURRENT_DATE,
  active_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. משפחות נתמכות
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  address TEXT,
  phone TEXT,
  need_category TEXT,
  branch_id UUID REFERENCES branches(id),
  responsible_profile_id UUID REFERENCES profiles(id),
  lat NUMERIC,
  lng NUMERIC,
  door_photo_url TEXT,
  intake_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. פעילויות
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  project TEXT,
  activity_date DATE,
  status activity_status DEFAULT 'planning',
  participants INT DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  required_skills TEXT,
  branch_id UUID REFERENCES branches(id),
  rating INT CHECK (rating >= 0 AND rating <= 5),
  debrief_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. שיבוץ מדריכים לפעילות (N:N)
CREATE TABLE activity_instructors (
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (activity_id, profile_id)
);

-- 7. הרשמת מתנדבים לפעילות (N:N)
CREATE TABLE activity_participants (
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  signed_up_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (activity_id, profile_id)
);

-- 8. חלוקות חג
CREATE TABLE distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  dist_date DATE,
  items TEXT,
  branch_id UUID REFERENCES branches(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. יעדי חלוקה
CREATE TABLE distribution_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id UUID REFERENCES distributions(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  delivered BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMPTZ,
  photo_url TEXT,
  route_order INT,
  claimed_by UUID REFERENCES profiles(id),
  UNIQUE (distribution_id, family_id)
);

-- 10. דיווחי פעילות שבועיים
CREATE TABLE activity_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week TEXT NOT NULL,
  project TEXT,
  hours NUMERIC NOT NULL CHECK (hours >= 0),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- אינדקסים לביצועים
-- ============================================================
CREATE INDEX idx_profiles_branch ON profiles(branch_id);
CREATE INDEX idx_families_branch ON families(branch_id);
CREATE INDEX idx_families_responsible ON families(responsible_profile_id);
CREATE INDEX idx_activities_branch ON activities(branch_id);
CREATE INDEX idx_activities_date ON activities(activity_date);
CREATE INDEX idx_stops_dist ON distribution_stops(distribution_id);
CREATE INDEX idx_reports_week ON activity_reports(week);
CREATE INDEX idx_reports_profile ON activity_reports(profile_id);

-- ============================================================
-- פונקציית עזר: יצירת פרופיל אוטומטית בעת הרשמה
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'volunteer')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ============================================================
-- פונקציות עזר לבדיקת תפקיד וסניף של המשתמש המחובר
-- ============================================================
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION current_user_branch()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT branch_id FROM profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- Row Level Security – מדיניות הרשאות
-- כאן מוגדר מי רואה ועושה מה. זה הלב של מערכת ההרשאות.
-- ============================================================

-- הפעלת RLS על כל הטבלאות
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_reports ENABLE ROW LEVEL SECURITY;

-- סניפים: כולם רואים, רק admin משנה
CREATE POLICY "branches readable by all"
  ON branches FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "branches manage by admin"
  ON branches FOR ALL TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- פרופילים: כל אחד רואה את עצמו; admin רואה הכל; service רואה את אותו סניף
CREATE POLICY "profiles read self"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR current_user_role() = 'admin' OR
         (current_user_role() = 'service' AND branch_id = current_user_branch()));
CREATE POLICY "profiles update self"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR current_user_role() = 'admin');
CREATE POLICY "profiles insert by admin or self"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR current_user_role() = 'admin');

-- משפחות: admin הכל; service לסניף שלו; volunteer ללא גישה
CREATE POLICY "families admin all"
  ON families FOR ALL TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');
CREATE POLICY "families service same branch"
  ON families FOR ALL TO authenticated
  USING (current_user_role() = 'service' AND branch_id = current_user_branch())
  WITH CHECK (current_user_role() = 'service' AND branch_id = current_user_branch());

-- פעילויות: admin הכל; service לסניף שלו; volunteer קריאה בלבד
CREATE POLICY "activities admin all"
  ON activities FOR ALL TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');
CREATE POLICY "activities service same branch"
  ON activities FOR ALL TO authenticated
  USING (current_user_role() = 'service' AND branch_id = current_user_branch())
  WITH CHECK (current_user_role() = 'service' AND branch_id = current_user_branch());
CREATE POLICY "activities volunteer read"
  ON activities FOR SELECT TO authenticated
  USING (current_user_role() = 'volunteer');

-- שיבוצי מדריכים: admin ו-service של אותו סניף
CREATE POLICY "activity_instructors manage"
  ON activity_instructors FOR ALL TO authenticated
  USING (
    current_user_role() = 'admin' OR
    (current_user_role() = 'service' AND
     EXISTS (SELECT 1 FROM activities a WHERE a.id = activity_id AND a.branch_id = current_user_branch()))
  )
  WITH CHECK (
    current_user_role() = 'admin' OR
    (current_user_role() = 'service' AND
     EXISTS (SELECT 1 FROM activities a WHERE a.id = activity_id AND a.branch_id = current_user_branch()))
  );

-- הרשמת מתנדבים: כל אחד נרשם רק את עצמו; admin רואה הכל
CREATE POLICY "participants read"
  ON activity_participants FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "participants self signup"
  ON activity_participants FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid() OR current_user_role() = 'admin');
CREATE POLICY "participants self cancel"
  ON activity_participants FOR DELETE TO authenticated
  USING (profile_id = auth.uid() OR current_user_role() = 'admin');

-- חלוקות: admin הכל; service של אותו סניף; volunteer קריאה
CREATE POLICY "distributions admin all"
  ON distributions FOR ALL TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');
CREATE POLICY "distributions service same branch"
  ON distributions FOR ALL TO authenticated
  USING (current_user_role() = 'service' AND (branch_id IS NULL OR branch_id = current_user_branch()));
CREATE POLICY "distributions volunteer read"
  ON distributions FOR SELECT TO authenticated
  USING (current_user_role() = 'volunteer');

-- יעדי חלוקה: דומה לחלוקות; מתנדב יכול לעדכן claimed_by/delivered/photo_url של עצמו
CREATE POLICY "stops read all"
  ON distribution_stops FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "stops admin/service manage"
  ON distribution_stops FOR ALL TO authenticated
  USING (
    current_user_role() = 'admin' OR
    (current_user_role() = 'service' AND
     EXISTS (SELECT 1 FROM families f WHERE f.id = family_id AND f.branch_id = current_user_branch()))
  );
CREATE POLICY "stops volunteer claim"
  ON distribution_stops FOR UPDATE TO authenticated
  USING (current_user_role() = 'volunteer' AND (claimed_by IS NULL OR claimed_by = auth.uid()))
  WITH CHECK (claimed_by = auth.uid() OR claimed_by IS NULL);

-- דיווחים: כל אחד מדווח רק על עצמו; service של הסניף שלו רואה את שלו; admin הכל
CREATE POLICY "reports own"
  ON activity_reports FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
CREATE POLICY "reports admin read"
  ON activity_reports FOR SELECT TO authenticated
  USING (current_user_role() = 'admin');
CREATE POLICY "reports service same branch read"
  ON activity_reports FOR SELECT TO authenticated
  USING (
    current_user_role() = 'service' AND
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_id AND p.branch_id = current_user_branch())
  );

-- ============================================================
-- נתוני בסיס: סניפים בדרום
-- ============================================================
INSERT INTO branches (name, city) VALUES
  ('סניף שדרות', 'שדרות'),
  ('סניף נתיבות', 'נתיבות'),
  ('סניף אופקים', 'אופקים'),
  ('סניף אשקלון', 'אשקלון');

-- ============================================================
-- סיום. בדוק ב-Table Editor שכל הטבלאות נוצרו.
-- ============================================================
