-- ============================================================
-- Migration: Fix RLS for anonymous devotee creation
-- Description: The initial setup only allowed authenticated users
--              to insert devotees, but the current UI runs without
--              authentication, acting as the 'anon' role.
-- ============================================================

-- Allow anon to insert devotees
CREATE POLICY devotees_insert_anon
    ON devotees FOR INSERT
    TO anon
    WITH CHECK (true);

-- Allow anon to update devotees (for inline edits)
CREATE POLICY devotees_update_anon
    ON devotees FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);
