-- ============================================================
-- Migration: Create devotees table
-- Description: Core table for devotee/donor records.
--              Includes pg_trgm indexes for zero-lag suggestive search.
-- ============================================================

-- 1. Enable trigram extension for fuzzy/partial text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create the devotees table
CREATE TABLE devotees (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name          text NOT NULL,
    last_name           text NOT NULL,
    name_to_acknowledge text,           -- Free-text, used on receipts
    email               text,
    phone               text,
    address_line1       text,
    city                text,
    state               text,
    zip_code            text,
    created_at          timestamptz NOT NULL DEFAULT now()
);

-- 3. Add table/column comments for DBeaver clarity
COMMENT ON TABLE  devotees IS 'Devotee/donor master records';
COMMENT ON COLUMN devotees.id IS 'Primary key — supports migration of existing Dataverse GUIDs';
COMMENT ON COLUMN devotees.name_to_acknowledge IS 'Free-text name printed on donation receipts';
COMMENT ON COLUMN devotees.phone IS 'Primary contact number, indexed for instant lookup';

-- 4. Trigram GIN indexes — powers the suggestive search
CREATE INDEX idx_devotees_first_name_trgm
    ON devotees USING GIN (first_name gin_trgm_ops);

CREATE INDEX idx_devotees_last_name_trgm
    ON devotees USING GIN (last_name gin_trgm_ops);

CREATE INDEX idx_devotees_phone_trgm
    ON devotees USING GIN (phone gin_trgm_ops);

-- 5. Unique index on email (partial — allows NULLs)
CREATE UNIQUE INDEX idx_devotees_email_unique
    ON devotees (email)
    WHERE email IS NOT NULL;
