-- Shared required-skills list for activities, managed by admin.
-- Run once in Supabase SQL Editor. Safe to re-run.
-- Read: any authenticated user. Write (add/delete): admin only (RLS).
-- No seed rows here on purpose (skill names are Hebrew) - the admin adds
-- them from the app: Activities > add/edit activity > "manage skills list".
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

DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE skill_options';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;
