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
  age INT,
  approved BOOLEAN NOT NULL DEFAULT FALSE, -- אישור כניסה ע"י מנכ"ל; משתמש חדש ממתין לאישור
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
  activity_time TEXT,                       -- שעת הפעילות (נשמרת כמחרוזת "HH:MM")
  location TEXT,                            -- מיקום/כתובת הפעילות
  created_by UUID REFERENCES profiles(id), -- מי יצר את הפעילות
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

-- 9.5 ארכיון חלוקות שהושלמו (אוטומטי דרך trigger; נשמר עד שנה)
CREATE TABLE distribution_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  dist_date DATE,
  items TEXT,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  total_stops INT NOT NULL DEFAULT 0,
  delivered_count INT NOT NULL DEFAULT 0,
  summary JSONB NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 year'
);
CREATE INDEX idx_archives_expires ON distribution_archives(expires_at);
CREATE INDEX idx_archives_branch ON distribution_archives(branch_id);

-- 10. דיווחי פעילות שבועיים
CREATE TABLE activity_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week TEXT NOT NULL,
  project TEXT,
  hours NUMERIC NOT NULL CHECK (hours >= 0),
  note TEXT,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL, -- דיווח שנוצר מפעילות
  activity_name TEXT,                                            -- שם הפעילות (משוכפל, שורד מחיקה/ארכוב)
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

-- שימושית למתנדבים/מדריכים: האם המשפחה מופיעה באיזושהי חלוקה.
-- SECURITY DEFINER עוקפת RLS על distribution_stops כדי למנוע רקורסיה
-- בין הפוליסיות של families ו-distribution_stops.
CREATE OR REPLACE FUNCTION family_in_any_distribution(fid UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM distribution_stops WHERE family_id = fid
  )
$$;

-- ============================================================
-- אוטומציה: כשכל יעדי החלוקה סומנו "נמסר" — לארכב ולמחוק
-- ============================================================
CREATE OR REPLACE FUNCTION archive_completed_distribution()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  dist_id UUID;
  total INT;
  delivered_count INT;
  dist_record RECORD;
  summary_data JSONB;
BEGIN
  dist_id := NEW.distribution_id;

  -- נעילת השורה למניעת מירוץ בין transactions מקבילים
  SELECT * INTO dist_record FROM distributions WHERE id = dist_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE delivered)
    INTO total, delivered_count
    FROM distribution_stops
    WHERE distribution_id = dist_id;

  IF total = 0 OR delivered_count < total THEN
    RETURN NEW;
  END IF;

  -- בניית JSON הסיכום (לפי סדר זמן מסירה)
  SELECT jsonb_build_object(
    'stops', jsonb_agg(
      jsonb_build_object(
        'family_name', f.name,
        'family_city', f.city,
        'family_address', f.address,
        'delivered_at', s.delivered_at,
        'claimed_by_name', p.name,
        'photo_url', s.photo_url
      ) ORDER BY s.delivered_at
    )
  ) INTO summary_data
  FROM distribution_stops s
  LEFT JOIN families f ON f.id = s.family_id
  LEFT JOIN profiles p ON p.id = s.claimed_by
  WHERE s.distribution_id = dist_id;

  INSERT INTO distribution_archives(
    name, dist_date, items, branch_id, total_stops, delivered_count, summary
  ) VALUES (
    dist_record.name, dist_record.dist_date, dist_record.items,
    dist_record.branch_id, total, delivered_count, summary_data
  );

  DELETE FROM distributions WHERE id = dist_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER archive_on_stop_update
  AFTER UPDATE ON distribution_stops
  FOR EACH ROW
  WHEN (NEW.delivered IS DISTINCT FROM OLD.delivered AND NEW.delivered = TRUE)
  EXECUTE FUNCTION archive_completed_distribution();

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
ALTER TABLE distribution_archives ENABLE ROW LEVEL SECURITY;
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
-- עדכון פרופיל: עצמי; admin את כולם; בת שירות את הצוות בסניף שלה.
-- USING בודק את השורה הקיימת (על מי מותר לפעול); WITH CHECK בודק את
-- השורה החדשה. לבת שירות ה-WITH CHECK מתירני יותר בכוונה — כדי שתוכל
-- להעביר איש צוות מהסניף שלה לסניף אחר (היא יכולה לפעול רק על מי
-- שכרגע בסניף שלה, אך לשייך אותו לכל סניף).
CREATE POLICY "profiles update self"
  ON profiles FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR current_user_role() = 'admin'
    OR (current_user_role() = 'service' AND branch_id = current_user_branch())
  )
  WITH CHECK (
    id = auth.uid()
    OR current_user_role() = 'admin'
    OR current_user_role() = 'service'
  );
CREATE POLICY "profiles insert by admin or self"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR current_user_role() = 'admin');

-- משפחות: admin הכל; service לסניף שלו;
-- volunteer/instructor רואים רק משפחות שמופיעות בחלוקות (קריאה בלבד)
CREATE POLICY "families admin all"
  ON families FOR ALL TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');
CREATE POLICY "families service same branch"
  ON families FOR ALL TO authenticated
  USING (current_user_role() = 'service' AND branch_id = current_user_branch())
  WITH CHECK (current_user_role() = 'service' AND branch_id = current_user_branch());
CREATE POLICY "families read for distribution claimers"
  ON families FOR SELECT TO authenticated
  USING (
    (current_user_role() = 'volunteer' OR current_user_role() = 'instructor')
    AND family_in_any_distribution(id)
  );

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

-- חלוקות: admin הכל; service של אותו סניף; volunteer ומדריך קריאה
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
CREATE POLICY "distributions instructor read"
  ON distributions FOR SELECT TO authenticated
  USING (current_user_role() = 'instructor');

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
CREATE POLICY "stops instructor claim"
  ON distribution_stops FOR UPDATE TO authenticated
  USING (current_user_role() = 'instructor' AND (claimed_by IS NULL OR claimed_by = auth.uid()))
  WITH CHECK (claimed_by = auth.uid() OR claimed_by IS NULL);

-- ארכיון חלוקות: admin הכל; service קריאה לסניף שלו
CREATE POLICY "archives admin all"
  ON distribution_archives FOR ALL TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');
CREATE POLICY "archives service read same branch"
  ON distribution_archives FOR SELECT TO authenticated
  USING (
    current_user_role() = 'service'
    AND (branch_id IS NULL OR branch_id = current_user_branch())
  );

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
-- סיום החלק המקורי. בדוק ב-Table Editor שכל הטבלאות נוצרו.
-- ============================================================


-- ############################################################
-- ############################################################
-- ##                                                        ##
-- ##   השלמות סכמה — שוחזרו מקוד הלקוח (אוגוסט 2026)         ##
-- ##                                                        ##
-- ############################################################
-- ############################################################
--
-- ⚠️  קרא/י לפני הרצה:
--
--  החלק שלמטה מכיל טבלאות, פונקציות (RPC), פוליסות ובאקטים
--  שהאפליקציה משתמשת בהם בפועל אך *חסרו* מהחלק המקורי למעלה.
--  הם שוחזרו על-ידי קריאת קוד הלקוח (השאילתות, ה-insert-ים
--  וקריאות ה-rpc), כדי שהרצה של הקובץ *על מסד נתונים ריק*
--  תפיק אפליקציה עובדת במלואה (צ׳אט, צ׳אט-פעילות, ספירת
--  "לא נקרא", ארכוב, והעלאת קבצים).
--
--  🔴 אל תריץ/י את החלק הזה על מסד הנתונים החי (production)!
--     הוא עלול לדרוס פונקציות/פוליסות קיימות בגרסה משוחזרת
--     שאולי שונה במעט מהמקור. הוא מיועד לשחזור/שכפול DB נקי.
--
--  ✅ כדי לקבל את ההגדרות *המדויקות* מה-DB החי (מומלץ לתחזוקה),
--     הרץ/י בטרמינל:
--         supabase db dump --schema public -f schema.sql
--     או ב-SQL Editor של Supabase שאילתה על pg_catalog
--     (pg_get_functiondef, pg_policies) — ראה/י את ה-README.
--
--  הטיפוסים והפוליסות כאן הם הערכה סבירה; אם ב-DB החי קיים
--  שוני, ההגדרות שם הן מקור האמת.
-- ============================================================

-- ------------------------------------------------------------
-- טבלאות צ׳אט כללי (ערוצים: general / announcements)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL DEFAULT 'general',
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sender_name TEXT,                                    -- שם השולח (משוכפל לתצוגה)
  content TEXT NOT NULL,
  reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel
  ON chat_messages(channel, created_at);

CREATE TABLE IF NOT EXISTS chat_reactions (
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (message_id, profile_id, emoji)
);

-- סימון "נקרא עד": שורה אחת למשתמש לכל ערוץ.
CREATE TABLE IF NOT EXISTS chat_reads (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (profile_id, channel)
);

-- ------------------------------------------------------------
-- צ׳אט ברמת פעילות בודדת
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_messages_activity
  ON activity_messages(activity_id, created_at);

CREATE TABLE IF NOT EXISTS activity_reads (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (profile_id, activity_id)
);

-- ------------------------------------------------------------
-- ארכיון פעילויות שהושלמו (נוצר ע"י archive_activity)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  project TEXT,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  activity_date DATE,
  activity_time TEXT,
  location TEXT,
  participants INT DEFAULT 0,
  signed_count INT DEFAULT 0,                 -- כמה נרשמו בפועל (מ-activity_participants)
  what_was_good TEXT,
  what_needs_improvement TEXT,
  rating INT CHECK (rating >= 0 AND rating <= 5),
  files JSONB DEFAULT '[]'::jsonb,            -- מערך [{path, name}] של קבצים מצורפים
  archived_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_archives_branch
  ON activity_archives(branch_id);

-- ------------------------------------------------------------
-- פונקציות RPC הנקראות מהלקוח
-- SECURITY DEFINER + search_path קבוע (מונע עקיפת RLS/הזרקת נתיב)
-- ------------------------------------------------------------

-- ספירת הודעות צ׳אט שלא נקראו, לכל ערוץ, למשתמש המחובר.
-- מוחזר: (channel, unread) — כפי ש-useChatUnread מצפה.
CREATE OR REPLACE FUNCTION chat_unread_counts()
RETURNS TABLE(channel TEXT, unread BIGINT)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT m.channel, COUNT(*)::BIGINT
  FROM chat_messages m
  LEFT JOIN chat_reads r
    ON r.profile_id = auth.uid() AND r.channel = m.channel
  WHERE m.profile_id IS DISTINCT FROM auth.uid()          -- לא סופרים הודעות של עצמי
    AND (r.last_read_at IS NULL OR m.created_at > r.last_read_at)
  GROUP BY m.channel
$$;

-- סימון ערוץ כ"נקרא עכשיו".
CREATE OR REPLACE FUNCTION mark_chat_read(p_channel TEXT)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO chat_reads(profile_id, channel, last_read_at)
  VALUES (auth.uid(), p_channel, NOW())
  ON CONFLICT (profile_id, channel)
  DO UPDATE SET last_read_at = NOW()
$$;

-- ספירת הודעות צ׳אט-פעילות שלא נקראו, לכל פעילות.
-- מוחזר: (activity_id, unread) — כפי ש-ActivitiesPage מצפה.
CREATE OR REPLACE FUNCTION activities_with_unread()
RETURNS TABLE(activity_id UUID, unread BIGINT)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT m.activity_id, COUNT(*)::BIGINT
  FROM activity_messages m
  LEFT JOIN activity_reads r
    ON r.profile_id = auth.uid() AND r.activity_id = m.activity_id
  WHERE m.profile_id IS DISTINCT FROM auth.uid()
    AND (r.last_read_at IS NULL OR m.created_at > r.last_read_at)
  GROUP BY m.activity_id
$$;

-- סימון צ׳אט-פעילות כ"נקרא".
CREATE OR REPLACE FUNCTION mark_activity_read(p_activity_id UUID)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO activity_reads(profile_id, activity_id, last_read_at)
  VALUES (auth.uid(), p_activity_id, NOW())
  ON CONFLICT (profile_id, activity_id)
  DO UPDATE SET last_read_at = NOW()
$$;

-- פרטי הנרשמים לפעילות (שם/גיל/טלפון) — DEFINER כדי שמדריך/מנהל
-- יוכלו לראות טלפון גם אם RLS על profiles מגביל.
CREATE OR REPLACE FUNCTION activity_participants_details(p_activity_id UUID)
RETURNS TABLE(id UUID, name TEXT, age INT, phone TEXT)
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT p.id, p.name, p.age, p.phone
  FROM activity_participants ap
  JOIN profiles p ON p.id = ap.profile_id
  WHERE ap.activity_id = p_activity_id
  ORDER BY p.name
$$;

-- ארכוב פעילות: שומר סיכום ל-activity_archives ומוחק את הפעילות.
-- נקרא מ-ActivityDebrief עם פרמטרים named.
CREATE OR REPLACE FUNCTION archive_activity(
  p_activity_id UUID,
  p_good        TEXT,
  p_improve     TEXT,
  p_rating      INT,
  p_files       JSONB
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a       RECORD;
  n_signed INT;
BEGIN
  SELECT * INTO a FROM activities WHERE id = p_activity_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COUNT(*) INTO n_signed
    FROM activity_participants
    WHERE activity_id = p_activity_id;

  INSERT INTO activity_archives(
    name, project, branch_id, activity_date, activity_time, location,
    participants, signed_count, what_was_good, what_needs_improvement,
    rating, files
  ) VALUES (
    a.name, a.project, a.branch_id, a.activity_date, a.activity_time, a.location,
    a.participants, n_signed, p_good, p_improve,
    p_rating, COALESCE(p_files, '[]'::jsonb)
  );

  DELETE FROM activities WHERE id = p_activity_id;
END;
$$;

-- ארכוב חלוקה ידני (מקביל לטריגר archive_completed_distribution האוטומטי).
-- נקרא מ-DistributionPage עם p_dist_id.
CREATE OR REPLACE FUNCTION archive_distribution(p_dist_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dist_record     RECORD;
  total           INT;
  n_delivered     INT;
  summary_data    JSONB;
BEGIN
  SELECT * INTO dist_record FROM distributions WHERE id = p_dist_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE delivered)
    INTO total, n_delivered
    FROM distribution_stops
    WHERE distribution_id = p_dist_id;

  SELECT jsonb_build_object(
    'stops', COALESCE(jsonb_agg(
      jsonb_build_object(
        'family_name',     f.name,
        'family_city',     f.city,
        'family_address',  f.address,
        'delivered_at',    s.delivered_at,
        'claimed_by_name', p.name,
        'photo_url',       s.photo_url
      ) ORDER BY s.delivered_at
    ), '[]'::jsonb)
  ) INTO summary_data
  FROM distribution_stops s
  LEFT JOIN families f ON f.id = s.family_id
  LEFT JOIN profiles p ON p.id = s.claimed_by
  WHERE s.distribution_id = p_dist_id;

  INSERT INTO distribution_archives(
    name, dist_date, items, branch_id, total_stops, delivered_count, summary
  ) VALUES (
    dist_record.name, dist_record.dist_date, dist_record.items,
    dist_record.branch_id, COALESCE(total, 0), COALESCE(n_delivered, 0),
    COALESCE(summary_data, '{"stops":[]}'::jsonb)
  );

  DELETE FROM distributions WHERE id = p_dist_id;
END;
$$;

-- ------------------------------------------------------------
-- RLS על הטבלאות החדשות
-- ------------------------------------------------------------
ALTER TABLE chat_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_reads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_archives ENABLE ROW LEVEL SECURITY;

-- צ׳אט כללי: כולם קוראים; פרסום ב"general" לכולם, ב"announcements" רק admin/service.
CREATE POLICY "chat read all" ON chat_messages
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "chat insert" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    AND (channel = 'general' OR current_user_role() IN ('admin', 'service'))
  );
CREATE POLICY "chat edit own" ON chat_messages
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "chat delete own or admin" ON chat_messages
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid() OR current_user_role() = 'admin');

-- תגובות (אימוג׳י): קריאה לכולם; הוספה/הסרה של עצמי בלבד.
CREATE POLICY "reactions read" ON chat_reactions
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "reactions add own" ON chat_reactions
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "reactions remove own" ON chat_reactions
  FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- סימוני קריאה: כל אחד רק את עצמו.
CREATE POLICY "chat reads own" ON chat_reads
  FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- צ׳אט-פעילות: קריאה לכולם; כתיבה של עצמי; מחיקה של עצמי/admin.
CREATE POLICY "activity chat read" ON activity_messages
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "activity chat insert own" ON activity_messages
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "activity chat delete own or admin" ON activity_messages
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid() OR current_user_role() = 'admin');

CREATE POLICY "activity reads own" ON activity_reads
  FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- ארכיון פעילויות: admin הכל; service קריאה לסניף שלו.
CREATE POLICY "activity archives admin all" ON activity_archives
  FOR ALL TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');
CREATE POLICY "activity archives service read" ON activity_archives
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'service'
    AND (branch_id IS NULL OR branch_id = current_user_branch())
  );
-- בת שירות יכולה גם לערוך תחקור פעילות בסניף שלה.
CREATE POLICY "activity archives service update" ON activity_archives
  FOR UPDATE TO authenticated
  USING (
    current_user_role() = 'service'
    AND (branch_id IS NULL OR branch_id = current_user_branch())
  )
  WITH CHECK (
    current_user_role() = 'service'
    AND (branch_id IS NULL OR branch_id = current_user_branch())
  );

-- ------------------------------------------------------------
-- Storage: באקטים פרטיים לתמונות דלת ולקבצי תחקור.
-- הצפייה נעשית בקוד דרך Signed URLs (ראה src/lib/storage.js).
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('door-photos',    'door-photos',    FALSE),
       ('activity-files', 'activity-files', FALSE)
ON CONFLICT (id) DO NOTHING;

-- מדיניות פשוטה: משתמש מחובר יכול להעלות/לצפות בבאקטים אלו.
-- ההרשאה מי-רשאי-לעשות-מה נאכפת בשכבת האפליקציה + ב-RLS של הטבלאות.
-- אם תרצה/י להקשיח — הוסף/י תנאי לפי (storage.foldername(name))[1].
CREATE POLICY "door-photos authenticated" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'door-photos')
  WITH CHECK (bucket_id = 'door-photos');
CREATE POLICY "activity-files authenticated" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'activity-files')
  WITH CHECK (bucket_id = 'activity-files');

-- ------------------------------------------------------------
-- Realtime: רישום הטבלאות שהאפליקציה מאזינה להן לשינויים חיים.
-- (חסר גם בחלק המקורי — בלעדיו העדכונים החיים לא יעבדו והמערכת
--  תיפול לרענון ידני בלבד.) בלוק בטוח שמדלג על טבלה שכבר רשומה.
-- ------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
  realtime_tables TEXT[] := ARRAY[
    'chat_messages', 'chat_reads', 'chat_reactions',
    'activity_messages', 'activities',
    'distributions', 'distribution_stops', 'distribution_archives'
  ];
BEGIN
  FOREACH t IN ARRAY realtime_tables LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    EXCEPTION
      WHEN duplicate_object THEN NULL;  -- כבר רשומה — מדלגים
      WHEN undefined_object THEN NULL;  -- ה-publication לא קיים (סביבה לא-Supabase)
    END;
  END LOOP;
END $$;

-- ============================================================
-- סיום ההשלמות המשוחזרות.
-- ============================================================
