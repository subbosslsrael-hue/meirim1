-- Cross-branch family duplicate check.
-- Run once in Supabase SQL Editor. Safe to re-run (CREATE OR REPLACE).
-- SECURITY DEFINER: checks across ALL branches but returns only true/false,
-- so a service user never sees other branches' family data.
--
-- A duplicate requires the SAME name, plus EITHER the same normalized phone
-- OR the same city + address. Requiring the name avoids false positives when
-- two different families share a phone (a relative / shared contact).
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
      AND lower(trim(coalesce(f.name, ''))) = lower(trim(coalesce(p_name, '')))
      AND (
        (p_phone IS NOT NULL AND p_phone <> '' AND f.phone = p_phone)
        OR (
          lower(trim(coalesce(f.city, '')))    = lower(trim(coalesce(p_city, '')))
          AND lower(trim(coalesce(f.address,''))) = lower(trim(coalesce(p_address,'')))
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION
  family_duplicate_exists(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
