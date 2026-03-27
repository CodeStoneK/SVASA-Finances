-- ============================================================
-- Migration: Create Finance Tables
-- Description: Core tables for bank accounts, transactions,
--              categories, subcategories, and budgets.
-- ============================================================

-- 1. Create bank_accounts
CREATE TABLE bank_accounts (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    text NOT NULL,
    institution             text NOT NULL, -- 'Wells Fargo', 'US Bank'
    account_type            text NOT NULL, -- 'Checking', 'Savings'
    starting_balance        numeric(12, 2) NOT NULL DEFAULT 0.00,
    starting_balance_date   date NOT NULL,
    created_at              timestamptz NOT NULL DEFAULT now()
);

-- 2. Create finance_categories
CREATE TABLE finance_categories (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    type        text NOT NULL, -- 'Revenue', 'Expense'
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE(name, type)
);

-- 3. Create finance_subcategories
CREATE TABLE finance_subcategories (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL REFERENCES finance_categories(id) ON DELETE CASCADE,
    name        text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE(category_id, name)
);

-- 4. Create transactions
CREATE TABLE transactions (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id         uuid NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    date                    date NOT NULL,
    amount                  numeric(12, 2) NOT NULL,
    type                    text NOT NULL, -- 'Revenue', 'Expense', 'Transfer'
    category_id             uuid REFERENCES finance_categories(id) ON DELETE SET NULL,
    subcategory_id          uuid REFERENCES finance_subcategories(id) ON DELETE SET NULL,
    reference_number        text,
    bank_transaction_id     text, -- ID from QBO/CSV to prevent duplicates
    description             text,
    transfer_to_account_id  uuid REFERENCES bank_accounts(id) ON DELETE SET NULL,
    created_at              timestamptz NOT NULL DEFAULT now(),
    UNIQUE(bank_account_id, bank_transaction_id)
);

-- 5. Create budgets
CREATE TABLE budgets (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    year            integer NOT NULL,
    quarter         integer NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
    category_id     uuid NOT NULL REFERENCES finance_categories(id) ON DELETE CASCADE,
    subcategory_id  uuid REFERENCES finance_subcategories(id) ON DELETE CASCADE,
    amount          numeric(12, 2) NOT NULL DEFAULT 0.00,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE(year, quarter, category_id, subcategory_id)
);

-- Triggers for updated_at could go here if needed, but not strictly required for standard inserts.
