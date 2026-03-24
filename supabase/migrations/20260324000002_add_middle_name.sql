-- ============================================================
-- Migration: Add middle_name and update search RPC
-- Description: Adds middle_name to devotees table and includes it in search_devotees.
-- ============================================================

-- 1. Add column to devotees table
ALTER TABLE devotees ADD COLUMN IF NOT EXISTS middle_name text;

-- 2. Drop the existing function to change the RETURN TABLE signature
DROP FUNCTION IF EXISTS search_devotees(text);

-- 3. Recreate the function with middle_name
CREATE OR REPLACE FUNCTION search_devotees(search_query text)
RETURNS TABLE (
    id                  uuid,
    first_name          text,
    middle_name         text,
    last_name           text,
    name_to_acknowledge text,
    email               text,
    phone               text,
    city                text,
    state               text,
    display_name        text,
    relevance           real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT
        d.id,
        d.first_name,
        d.middle_name,
        d.last_name,
        d.name_to_acknowledge,
        d.email,
        d.phone,
        d.city,
        d.state,
        concat_ws(' ', d.first_name, d.middle_name, d.last_name) AS display_name,
        greatest(
            similarity(d.first_name, search_query),
            similarity(d.last_name, search_query),
            similarity(coalesce(d.middle_name, ''), search_query),
            similarity(coalesce(d.phone, ''), search_query)
        ) AS relevance
    FROM devotees d
    WHERE
        d.first_name ILIKE '%' || search_query || '%'
        OR d.last_name ILIKE '%' || search_query || '%'
        OR d.middle_name ILIKE '%' || search_query || '%'
        OR d.phone ILIKE '%' || search_query || '%'
    ORDER BY relevance DESC, d.last_name, d.first_name
    LIMIT 10;
$$;

-- Allow authenticated and anon roles to call this function
GRANT EXECUTE ON FUNCTION search_devotees(text) TO authenticated;
GRANT EXECUTE ON FUNCTION search_devotees(text) TO anon;

COMMENT ON FUNCTION search_devotees IS
    'Suggestive search across devotee name (including middle name) and phone. Returns top 10 matches ranked by trigram similarity.';
