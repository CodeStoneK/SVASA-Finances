"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { Donation, Devotee } from "@/lib/types";
import { downloadReceipt } from "@/lib/receipt";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

import { PaymentMethodIcon } from "@/components/PaymentMethodIcon";

type DonationWithDevotee = Donation & { devotee: Devotee };

export default function DonationsPage() {
  const [donations, setDonations] = useState<DonationWithDevotee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMethod, setFilterMethod] = useState<string>("");

  const fetchDonations = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("donations")
        .select("*, devotee:devotees(*)")
        .order("donation_date", { ascending: false });

      if (filterMethod) {
        query = query.eq("payment_method", filterMethod);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      setDonations((data || []) as DonationWithDevotee[]);
    } catch (err) {
      console.error("Failed to fetch donations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filterMethod]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const filteredDonations = donations.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = `${d.devotee?.first_name} ${d.devotee?.last_name}`.toLowerCase();
    return (
      name.includes(q) ||
      d.amount.toString().includes(q) ||
      (d.instrument_number && d.instrument_number.toLowerCase().includes(q)) ||
      (d.notes && d.notes.toLowerCase().includes(q))
    );
  });

  const totalFiltered = filteredDonations.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-temple-800">Donations</h1>
          <p className="text-temple-500 mt-1">
            {filteredDonations.length} donations · {formatCurrency(totalFiltered)} total
          </p>
        </div>
        <Link
          href="/donations/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-semibold rounded-2xl shadow-lg shadow-saffron-300/50 hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Donation
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-temple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            id="donations-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search donations..."
            className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-temple-200 rounded-xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-800 placeholder:text-temple-300"
          />
        </div>
        <select
          id="filter-payment-method"
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="px-4 py-3 bg-white/80 border-2 border-temple-200 rounded-xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-700"
        >
          <option value="">All Methods</option>
          <option value="Zelle">⚡ Zelle</option>
          <option value="Venmo">💜 Venmo</option>
          <option value="PayPal">🅿️ PayPal</option>
          <option value="Credit Card">💳 Credit Card</option>
          <option value="Cash">💵 Cash</option>
          <option value="Check">📝 Check</option>
        </select>
      </div>

      {/* Donations Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-saffron-200 border-t-saffron-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-temple-400 border-b border-saffron-100">
                  <th className="px-6 py-4 font-semibold">Devotee</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold hidden md:table-cell">Method</th>
                  <th className="px-6 py-4 font-semibold hidden lg:table-cell">Reference</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold hidden lg:table-cell">Notes</th>
                  <th className="px-6 py-4 font-semibold w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-saffron-50">
                {filteredDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-saffron-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-saffron-300 to-saffron-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {donation.devotee?.first_name?.[0]}{donation.devotee?.last_name?.[0]}
                        </div>
                        <span className="font-medium text-temple-800">
                          {donation.devotee?.first_name} {donation.devotee?.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-emerald-600">{formatCurrency(Number(donation.amount))}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-temple-50 text-temple-600 rounded-lg text-sm">
                        <PaymentMethodIcon method={donation.payment_method} className="w-4 h-4 text-temple-600" />
                        {donation.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-sm text-temple-500 font-mono">
                      {donation.instrument_number || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-temple-500">
                      {formatDate(donation.donation_date)}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-sm text-temple-400 max-w-[200px] truncate">
                      {donation.notes || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => downloadReceipt(donation, donation.devotee, 0)}
                        title="Download Receipt"
                        className="p-2 text-temple-400 hover:text-saffron-600 hover:bg-saffron-50 rounded-lg transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredDonations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-temple-400">
                      No donations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
