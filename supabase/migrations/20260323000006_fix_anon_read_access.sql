-- ============================================================
-- Migration: Fix RLS policies for anon read access
-- Description: Allow the anon role to SELECT from devotees
--              and donations. Required because the app uses
--              the anon key (no Supabase Auth yet).
-- ============================================================

-- Allow anon to read devotees
CREATE POLICY devotees_select_anon
    ON devotees FOR SELECT
    TO anon
    USING (true);

-- Allow anon to read donations
CREATE POLICY donations_select_anon
    ON donations FOR SELECT
    TO anon
    USING (true);
