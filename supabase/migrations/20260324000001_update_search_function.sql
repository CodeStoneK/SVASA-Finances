-- ============================================================
-- Migration: Update Devotee search RPC to include city & state
-- Description: Adds city and state columns to the returned table.
-- ============================================================

-- First we must drop the existing function because we are changing the RETURN TABLE signature.
DROP FUNCTION IF EXISTS search_devotees(text);

CREATE OR REPLACE FUNCTION search_devotees(search_query text)
RETURNS TABLE (
    id                  uuid,
    first_name          text,
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
        d.last_name,
        d.name_to_acknowledge,
        d.email,
        d.phone,
        d.city,
        d.state,
        d.first_name || ' ' || d.last_name AS display_name,
        greatest(
            similarity(d.first_name, search_query),
            similarity(d.last_name, search_query),
            similarity(coalesce(d.phone, ''), search_query)
        ) AS relevance
    FROM devotees d
    WHERE
        d.first_name ILIKE '%' || search_query || '%'
        OR d.last_name ILIKE '%' || search_query || '%'
        OR d.phone ILIKE '%' || search_query || '%'
    ORDER BY relevance DESC, d.last_name, d.first_name
    LIMIT 10;
$$;

-- Allow authenticated and anon roles to call this function
GRANT EXECUTE ON FUNCTION search_devotees(text) TO authenticated;
GRANT EXECUTE ON FUNCTION search_devotees(text) TO anon;

COMMENT ON FUNCTION search_devotees IS
    'Suggestive search across devotee name and phone. Returns top 10 matches ranked by trigram similarity, now including city and state.';
