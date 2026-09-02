-- Cross-branch family duplicate check.
-- Run once in Supabase SQL Editor. Safe to re-run (CREATE OR REPLACE).
-- SECURITY DEFINER: checks across ALL branches but returns only true/false,
-- so a service user never sees other branches' family data.
--
-- A duplicate = the SAME name AND the SAME normalized phone. City/address are
-- intentionally NOT compared: a common surname at the same city (or even the
-- same building address without an apartment number) is legitimate and must
-- not be blocked. Every family has a required phone, so name+phone is enough.
-- (p_city / p_address are kept in the signature but unused, so the client
--  call and the grant don't need to change.)
CREATE OR REPLACE FUNCTION family_duplicate_exists(
  p_name    TEXT,
  p_city    TEXT,
  p_address TEXT,
  p_phone   TEXT,
  p_exclude UUID DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM families f
    WHERE (p_exclude IS NULL OR f.id <> p_exclude)
      AND p_phone IS NOT NULL AND p_phone <> ''
      AND f.phone = p_phone
      AND lower(trim(coalesce(f.name, ''))) = lower(trim(coalesce(p_name, '')))
  );
$$;

GRANT EXECUTE ON FUNCTION
  family_duplicate_exists(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
