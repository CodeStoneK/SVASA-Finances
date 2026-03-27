// ============================================================
// SVASA Finances — TypeScript Types
// ============================================================

export interface Devotee {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  name_to_acknowledge: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  created_at: string;
}

export interface Donation {
  id: string;
  devotee_id: string;
  amount: number;
  payment_method: PaymentMethod;
  instrument_number: string | null;
  donation_date: string;
  onedrive_path: string | null;
  notes: string | null;
  created_at: string;
  // Joined fields
  devotee?: Devotee;
}

export type PaymentMethod =
  | 'Zelle'
  | 'Venmo'
  | 'PayPal'
  | 'Credit Card'
  | 'Cash'
  | 'Check';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Zelle',
  'Venmo',
  'PayPal',
  'Credit Card',
  'Cash',
  'Check',
];

export interface DevoteeSearchResult {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  name_to_acknowledge: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  display_name: string;
  relevance: number;
}

export interface DashboardStats {
  totalDonations: number;
  totalAmount: number;
  totalDevotees: number;
  recentDonations: (Donation & { devotee: Devotee })[];
}

// ============================================================
// FINANCE TYPES
// ============================================================

export interface BankAccount {
  id: string;
  name: string;
  institution: string;
  account_type: 'Checking' | 'Savings';
  starting_balance: number;
  starting_balance_date: string;
  account_number: string | null;
  created_at: string;
  current_balance?: number;
}

export type TransactionType = 'Revenue' | 'Expense' | 'Transfer';

export interface FinanceCategory {
  id: string;
  name: string;
  type: 'Revenue' | 'Expense';
  created_at: string;
}

export interface FinanceSubcategory {
  id: string;
  category_id: string;
  name: string;
  created_at: string;
  category?: FinanceCategory;
}

export interface Transaction {
  id: string;
  bank_account_id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category_id: string | null;
  subcategory_id: string | null;
  reference_number: string | null;
  bank_transaction_id: string | null;
  description: string | null;
  transfer_to_account_id: string | null;
  created_at: string;
  // Joined fields
  bank_account?: BankAccount;
  category?: FinanceCategory;
  subcategory?: FinanceSubcategory;
  transfer_to_account?: BankAccount;
}

export interface Budget {
  id: string;
  year: number;
  quarter: number;
  category_id: string;
  subcategory_id: string | null;
  amount: number;
  created_at: string;
  // Joined fields
  category?: FinanceCategory;
  subcategory?: FinanceSubcategory;
}
