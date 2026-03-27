-- ============================================================
-- Migration: Fix anon access for finance tables
-- Description: Allow the anon role full CRUD on finance tables
--              since the app currently uses the anon key.
-- ============================================================

CREATE POLICY bank_accounts_all_anon ON bank_accounts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY finance_categories_all_anon ON finance_categories FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY finance_subcategories_all_anon ON finance_subcategories FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY transactions_all_anon ON transactions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY budgets_all_anon ON budgets FOR ALL TO anon USING (true) WITH CHECK (true);
