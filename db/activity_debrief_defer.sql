-- "Skip / didn't happen" for the blocking activity debrief.
-- Run once in Supabase SQL Editor. Safe to re-run.
--
-- Adds a debrief_deferred flag on activities. When the creator skips the
-- blocking debrief, the activity is marked deferred so it stops blocking on
-- login, but it stays in the activities list and keeps showing on the
-- dashboard as a pending debrief reminder.
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS debrief_deferred BOOLEAN DEFAULT FALSE;

-- SECURITY DEFINER so it works for any creator role (instructors have no
-- direct UPDATE on activities). Only the activity's creator or an admin
-- can defer it.
CREATE OR REPLACE FUNCTION defer_activity_debrief(p_activity_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE activities
    SET debrief_deferred = TRUE
    WHERE id = p_activity_id
      AND (created_by = auth.uid() OR current_user_role() = 'admin');
END;
$$;

GRANT EXECUTE ON FUNCTION defer_activity_debrief(UUID) TO authenticated;
