"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Donation, DashboardStats } from "@/lib/types";
import Link from "next/link";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

import { PaymentMethodIcon } from "@/components/PaymentMethodIcon";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      setIsLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        const startOfYear = `${currentYear}-01-01`;

        // Fetch counts and totals (YTD for donations)
        const [devoteeCount, donationData, recentDonations] = await Promise.all([
          supabase.from("devotees").select("id", { count: "exact", head: true }),
          supabase.from("donations").select("amount").gte("donation_date", startOfYear),
          supabase
            .from("donations")
            .select("*, devotee:devotees(*)")
            .order("donation_date", { ascending: false })
            .limit(8),
        ]);

        const totalAmount = (donationData.data || []).reduce(
          (sum: number, d: { amount: number }) => sum + Number(d.amount),
          0
        );

        setStats({
          totalDevotees: devoteeCount.count || 0,
          totalDonations: donationData.data?.length || 0,
          totalAmount,
          recentDonations: (recentDonations.data || []) as (Donation & { devotee: DashboardStats["recentDonations"][0]["devotee"] })[],
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-saffron-200 border-t-saffron-600 rounded-full animate-spin" />
          <p className="text-temple-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-temple-800">Dashboard</h1>
          <p className="text-temple-500 mt-1">Welcome to SVASA Finances</p>
        </div>
        <Link
          href="/donations/new"
          id="btn-new-donation"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-semibold rounded-2xl shadow-lg shadow-saffron-300/50 hover:shadow-xl hover:shadow-saffron-400/50 hover:-translate-y-0.5 transition-all active:translate-y-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Donation
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-saffron-100 to-saffron-200 flex items-center justify-center">
              <span className="text-2xl">🙏</span>
            </div>
            <div>
              <p className="text-sm text-temple-500 font-medium">Total Devotees</p>
              <p className="text-3xl font-bold text-temple-800">{stats?.totalDevotees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/20 flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <p className="text-sm text-temple-500 font-medium">YTD Donated</p>
              <p className="text-3xl font-bold text-temple-800">{formatCurrency(stats?.totalAmount || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-temple-100 to-temple-200 flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <p className="text-sm text-temple-500 font-medium">YTD Donations</p>
              <p className="text-3xl font-bold text-temple-800">{stats?.totalDonations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Donations */}
      <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-saffron-100">
          <h2 className="text-lg font-bold text-temple-800">Recent Donations</h2>
          <Link href="/donations" className="text-sm text-saffron-600 hover:text-saffron-700 font-medium">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-temple-400 border-b border-saffron-100/50">
                <th className="px-6 py-3 font-semibold">Devotee</th>
                <th className="px-6 py-3 font-semibold">Amount</th>
                <th className="px-6 py-3 font-semibold hidden md:table-cell">Method</th>
                <th className="px-6 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-saffron-50">
              {stats?.recentDonations.map((donation) => (
                <tr key={donation.id} className="hover:bg-saffron-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-saffron-300 to-saffron-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {donation.devotee?.first_name?.[0]}
                        {donation.devotee?.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-temple-800">
                          {donation.devotee?.first_name} {donation.devotee?.last_name}
                        </p>
                        {donation.notes && (
                          <p className="text-xs text-temple-400 truncate max-w-[200px]">{donation.notes}</p>
                        )}
                      </div>
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
                  <td className="px-6 py-4 text-sm text-temple-500">
                    {formatDate(donation.donation_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
