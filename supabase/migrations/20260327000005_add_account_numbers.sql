-- ============================================================
-- Migration: Add account_number to bank_accounts
-- Description: Adds account number and associates them with seeded data.
-- ============================================================

ALTER TABLE bank_accounts ADD COLUMN account_number text;

UPDATE bank_accounts SET account_number = '1227272737' 
WHERE name = 'Wells Fargo Checking';

UPDATE bank_accounts SET account_number = '7345808971' 
WHERE name = 'Wells Fargo Savings';

UPDATE bank_accounts SET account_number = '157530626017' 
WHERE name = 'US Bank Checking';

UPDATE bank_accounts SET account_number = '253475350216' 
WHERE name = 'US Bank Savings';
