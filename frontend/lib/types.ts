// ============================================================
// SVASA Finances — TypeScript Types
// ============================================================

export interface Devotee {
  id: string;
  first_name: string;
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
