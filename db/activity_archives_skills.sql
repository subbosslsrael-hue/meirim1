-- Keep required_skills on archived activities, for the by-category report.
-- Run once in Supabase SQL Editor. Safe to re-run.
-- (Existing archived rows stay NULL = "no category"; new archives carry it.)
ALTER TABLE activity_archives
  ADD COLUMN IF NOT EXISTS required_skills TEXT;

-- DROP first: the existing function has parameter defaults, and CREATE OR
-- REPLACE cannot remove them (ERROR 42P13). Dropping + recreating is safe -
-- the client always calls it with all 5 arguments.
DROP FUNCTION IF EXISTS archive_activity(uuid, text, text, integer, jsonb);

CREATE FUNCTION archive_activity(
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
  a        RECORD;
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
    rating, files, required_skills
  ) VALUES (
    a.name, a.project, a.branch_id, a.activity_date, a.activity_time, a.location,
    a.participants, n_signed, p_good, p_improve,
    p_rating, COALESCE(p_files, '[]'::jsonb), a.required_skills
  );

  DELETE FROM activities WHERE id = p_activity_id;
END;
$$;
