-- ============================================================
-- Migration: Create donations table
-- Description: Tracks all donation transactions with FK to devotees.
--              Includes CHECK constraint on payment_method.
-- ============================================================

-- 1. Create the donations table
CREATE TABLE donations (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    devotee_id        uuid NOT NULL REFERENCES devotees(id) ON DELETE RESTRICT,
    amount            numeric(12,2) NOT NULL CHECK (amount > 0),
    payment_method    text NOT NULL CHECK (
                          payment_method IN (
                              'Zelle', 'Venmo', 'PayPal',
                              'Credit Card', 'Cash', 'Check'
                          )
                      ),
    instrument_number text,            -- Check #, Zelle ref, Transaction ID
    donation_date     date NOT NULL DEFAULT current_date,
    onedrive_path     text,            -- Set after PDF receipt upload
    notes             text,
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- 2. Add table/column comments
COMMENT ON TABLE  donations IS 'Donation transaction records linked to devotees';
COMMENT ON COLUMN donations.amount IS 'Donation amount with financial precision (12,2)';
COMMENT ON COLUMN donations.payment_method IS 'Constrained to: Zelle, Venmo, PayPal, Credit Card, Cash, Check';
COMMENT ON COLUMN donations.instrument_number IS 'Check number, Zelle reference, or payment transaction ID';
COMMENT ON COLUMN donations.onedrive_path IS 'OneDrive path set after PDF receipt is generated and uploaded';

-- 3. B-tree indexes for common query patterns
CREATE INDEX idx_donations_devotee_id
    ON donations (devotee_id);

CREATE INDEX idx_donations_date_desc
    ON donations (donation_date DESC);

-- 4. Composite index for devotee donation history
CREATE INDEX idx_donations_devotee_date
    ON donations (devotee_id, donation_date DESC);
