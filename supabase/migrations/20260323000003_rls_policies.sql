-- ============================================================
-- Migration: Row-Level Security policies
-- Description: Secure access to devotees and donations tables.
--              Authenticated users get full CRUD.
--              Anonymous role gets INSERT-only on donations (future public API).
-- ============================================================

-- 1. Enable RLS on both tables
ALTER TABLE devotees  ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- DEVOTEES policies
-- ============================================================

-- Authenticated users: full read access
CREATE POLICY devotees_select_authenticated
    ON devotees FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users: insert new devotees
CREATE POLICY devotees_insert_authenticated
    ON devotees FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Authenticated users: update devotee records
CREATE POLICY devotees_update_authenticated
    ON devotees FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Authenticated users: delete devotee records
CREATE POLICY devotees_delete_authenticated
    ON devotees FOR DELETE
    TO authenticated
    USING (true);

-- ============================================================
-- DONATIONS policies
-- ============================================================

-- Authenticated users: full read access
CREATE POLICY donations_select_authenticated
    ON donations FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users: insert donations
CREATE POLICY donations_insert_authenticated
    ON donations FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Authenticated users: update donations (e.g., set onedrive_path)
CREATE POLICY donations_update_authenticated
    ON donations FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Authenticated users: delete donations
CREATE POLICY donations_delete_authenticated
    ON donations FOR DELETE
    TO authenticated
    USING (true);

-- ============================================================
-- PUBLIC API (anon) — future website integration
-- ============================================================

-- Anonymous: INSERT-only on donations (for public donation forms)
-- The webhook/payment confirmation flow will validate before inserting.
CREATE POLICY donations_insert_anon
    ON donations FOR INSERT
    TO anon
    WITH CHECK (true);

-- ============================================================
-- Service role bypass
-- ============================================================
-- Note: The service_role key bypasses RLS by default in Supabase.
-- Edge Functions use the service_role key for PDF generation
-- and OneDrive upload operations.
