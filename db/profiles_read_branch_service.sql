-- Let volunteers/instructors see the service worker(s) of their own branch,
-- so the dashboard can show "my branch + my service worker(s)".
-- Additive SELECT policy (RLS policies are OR'd). Run once in Supabase. Safe to re-run.
DROP POLICY IF EXISTS "profiles read branch service" ON profiles;
CREATE POLICY "profiles read branch service"
  ON profiles FOR SELECT TO authenticated
  USING (
    (current_user_role() = 'volunteer' OR current_user_role() = 'instructor')
    AND role = 'service'
    AND branch_id = current_user_branch()
  );
