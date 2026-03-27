-- ============================================================
-- Migration: Seed Finance Data
-- Description: Initial bank accounts and categories/subcategories.
-- ============================================================

-- Seed Default Bank Accounts (Starting balances can be updated in UI)
INSERT INTO bank_accounts (id, name, institution, account_type, starting_balance, starting_balance_date)
VALUES
    ('aaaaaaaa-1111-1111-1111-111111111111', 'Wells Fargo Checking', 'Wells Fargo', 'Checking', 0.00, '2025-12-31'),
    ('aaaaaaaa-1111-1111-1111-111111111112', 'Wells Fargo Savings', 'Wells Fargo', 'Savings', 0.00, '2025-12-31'),
    ('aaaaaaaa-1111-1111-1111-111111111113', 'US Bank Checking', 'US Bank', 'Checking', 0.00, '2025-12-31'),
    ('aaaaaaaa-1111-1111-1111-111111111114', 'US Bank Savings', 'US Bank', 'Savings', 0.00, '2025-12-31');

-- Seed Revenue Categories & Subcategories
INSERT INTO finance_categories (id, name, type)
VALUES
    ('bbbbbbbb-1111-1111-1111-000000000001', 'Donations', 'Revenue'),
    ('bbbbbbbb-1111-1111-1111-000000000002', 'Interest', 'Revenue');

INSERT INTO finance_subcategories (category_id, name)
VALUES
    ('bbbbbbbb-1111-1111-1111-000000000001', 'General Donations'),
    ('bbbbbbbb-1111-1111-1111-000000000001', 'Event Donations'),
    ('bbbbbbbb-1111-1111-1111-000000000002', 'Bank Interest');

-- Seed Expense Categories
INSERT INTO finance_categories (id, name, type)
VALUES
    ('cccccccc-1111-1111-1111-000000000001', 'Jayanthi', 'Expense'),
    ('cccccccc-1111-1111-1111-000000000002', 'Vardhanthi', 'Expense'),
    ('cccccccc-1111-1111-1111-000000000003', 'Fees/Licenses', 'Expense'),
    ('cccccccc-1111-1111-1111-000000000004', 'Office Expenses', 'Expense'),
    ('cccccccc-1111-1111-1111-000000000005', 'Community Outreach', 'Expense'),
    ('cccccccc-1111-1111-1111-000000000006', 'Publishings', 'Expense'),
    ('cccccccc-1111-1111-1111-000000000007', 'Advertising', 'Expense'),
    ('cccccccc-1111-1111-1111-000000000008', 'Transportation', 'Expense'),
    ('cccccccc-1111-1111-1111-000000000009', 'Miscellaneous', 'Expense');

-- Seed Expense Subcategories
INSERT INTO finance_subcategories (category_id, name)
VALUES
    -- Jayanthi
    ('cccccccc-1111-1111-1111-000000000001', 'Altar Decoration'),
    ('cccccccc-1111-1111-1111-000000000001', 'Altar Flowers'),
    ('cccccccc-1111-1111-1111-000000000001', 'Cleaning'),
    ('cccccccc-1111-1111-1111-000000000001', 'Equipment Rental'),
    ('cccccccc-1111-1111-1111-000000000001', 'Insurance'),
    ('cccccccc-1111-1111-1111-000000000001', 'Facilities Rental'),
    ('cccccccc-1111-1111-1111-000000000001', 'Honorarium'),
    ('cccccccc-1111-1111-1111-000000000001', 'Media'),
    ('cccccccc-1111-1111-1111-000000000001', 'Miscellaneous'),
    ('cccccccc-1111-1111-1111-000000000001', 'Office Expenses'),
    ('cccccccc-1111-1111-1111-000000000001', 'Prasadam for Deities'),
    ('cccccccc-1111-1111-1111-000000000001', 'Prasadam for Devotees'),
    ('cccccccc-1111-1111-1111-000000000001', 'Supplies'),
    ('cccccccc-1111-1111-1111-000000000001', 'Transportation'),
    ('cccccccc-1111-1111-1111-000000000001', 'Vasthrabharanalu for Deities'),

    -- Vardhanthi
    ('cccccccc-1111-1111-1111-000000000002', 'Cleaning'),
    ('cccccccc-1111-1111-1111-000000000002', 'Insurance'),
    ('cccccccc-1111-1111-1111-000000000002', 'Facilities Rental'),
    ('cccccccc-1111-1111-1111-000000000002', 'Honorarium'),
    ('cccccccc-1111-1111-1111-000000000002', 'Miscellaneous'),
    ('cccccccc-1111-1111-1111-000000000002', 'Prasadam'),
    ('cccccccc-1111-1111-1111-000000000002', 'Supplies'),
    ('cccccccc-1111-1111-1111-000000000002', 'Transportation'),

    -- Fees/Licenses
    ('cccccccc-1111-1111-1111-000000000003', 'Administrative'),
    ('cccccccc-1111-1111-1111-000000000003', 'Document Filing'),

    -- Office Expenses
    ('cccccccc-1111-1111-1111-000000000004', 'Email Service'),
    ('cccccccc-1111-1111-1111-000000000004', 'General'),
    ('cccccccc-1111-1111-1111-000000000004', 'Equipment'),
    ('cccccccc-1111-1111-1111-000000000004', 'Supplies'),
    ('cccccccc-1111-1111-1111-000000000004', 'Meeting & Events'),

    -- Community Outreach
    ('cccccccc-1111-1111-1111-000000000005', 'ENPC Events'),
    ('cccccccc-1111-1111-1111-000000000005', 'Expansion & Outreach'),
    ('cccccccc-1111-1111-1111-000000000005', 'Honorarium'),

    -- Publishings
    ('cccccccc-1111-1111-1111-000000000006', 'Books & Educational Material'),

    -- Advertising
    ('cccccccc-1111-1111-1111-000000000007', 'Web'),

    -- Transportation
    ('cccccccc-1111-1111-1111-000000000008', 'Meeting & Events'),

    -- Miscellaneous
    ('cccccccc-1111-1111-1111-000000000009', 'Events & Activities');
