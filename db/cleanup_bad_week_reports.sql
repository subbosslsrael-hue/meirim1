-- One-off cleanup: remove activity_reports whose week is NOT in YYYY-MM-DD
-- format (old/malformed values that showed as "NaN" in the reports table).
-- Run in Supabase SQL Editor. Review step 1 before running step 2.

-- Step 1 — preview what will be deleted:
-- SELECT id, profile_id, week, hours, note, created_at
-- FROM activity_reports
-- WHERE week !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$';

-- Step 2 — delete them:
DELETE FROM activity_reports
WHERE week !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$';
