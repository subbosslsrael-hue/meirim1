-- Let a service worker see ALL families that appear in a distribution (not just
-- her own branch), so the distribution map/list shows every stop. Volunteers and
-- instructors already had this; service was limited to her branch.
-- Run once in Supabase SQL Editor. Safe to re-run.
DROP POLICY IF EXISTS "families read for distribution claimers" ON families;
CREATE POLICY "families read for distribution claimers"
  ON families FOR SELECT TO authenticated
  USING (
    current_user_role() IN ('volunteer', 'instructor', 'service')
    AND family_in_any_distribution(id)
  );
