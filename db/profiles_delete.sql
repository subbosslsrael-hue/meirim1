-- Allow deleting users (profiles), with FKs that won't block or cascade-destroy.
-- Run once in Supabase SQL Editor. Safe to re-run.
--
-- Three FKs to profiles were RESTRICT and would block deletion. Switch them to
-- ON DELETE SET NULL so deleting a user keeps their families/activities/stops
-- but clears the reference (e.g. a family becomes "unassigned"). Constraint
-- names are kept identical because the client selects use them by name.
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_responsible_profile_id_fkey;
ALTER TABLE families ADD CONSTRAINT families_responsible_profile_id_fkey
  FOREIGN KEY (responsible_profile_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_created_by_fkey;
ALTER TABLE activities ADD CONSTRAINT activities_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE distribution_stops DROP CONSTRAINT IF EXISTS distribution_stops_claimed_by_fkey;
ALTER TABLE distribution_stops ADD CONSTRAINT distribution_stops_claimed_by_fkey
  FOREIGN KEY (claimed_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Delete policy: admin deletes any non-admin; service deletes volunteers/
-- instructors in her own branch ("everyone under her").
DROP POLICY IF EXISTS "profiles delete" ON profiles;
CREATE POLICY "profiles delete" ON profiles FOR DELETE TO authenticated
USING (
  (current_user_role() = 'admin' AND role <> 'admin')
  OR (
    current_user_role() = 'service'
    AND (role = 'volunteer' OR role = 'instructor')
    AND branch_id = current_user_branch()
  )
);
