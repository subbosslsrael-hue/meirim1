-- Let a service user see and edit instructor profiles.
-- Instructors are system-wide and have no branch, so the existing
-- "same branch" rule excluded them. Run once in Supabase SQL Editor.
-- Safe to re-run.
DROP POLICY IF EXISTS "profiles read self" ON profiles;
CREATE POLICY "profiles read self"
  ON profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR current_user_role() = 'admin'
    OR (current_user_role() = 'service' AND branch_id = current_user_branch())
    OR (current_user_role() = 'service' AND role = 'instructor')
  );

DROP POLICY IF EXISTS "profiles update self" ON profiles;
CREATE POLICY "profiles update self"
  ON profiles FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR current_user_role() = 'admin'
    OR (current_user_role() = 'service' AND branch_id = current_user_branch())
    OR (current_user_role() = 'service' AND role = 'instructor')
  )
  WITH CHECK (
    id = auth.uid()
    OR current_user_role() = 'admin'
    OR current_user_role() = 'service'
  );
