-- ============================================================
-- Migration: Row-Level Security policies for Finance
-- Description: Secure access to finance tables.
--              Authenticated users get full CRUD.
-- ============================================================

-- 1. Enable RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- 2. Authenticated users: full access across all tables
CREATE POLICY bank_accounts_all_authenticated ON bank_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY finance_categories_all_authenticated ON finance_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY finance_subcategories_all_authenticated ON finance_subcategories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY transactions_all_authenticated ON transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY budgets_all_authenticated ON budgets FOR ALL TO authenticated USING (true) WITH CHECK (true);
