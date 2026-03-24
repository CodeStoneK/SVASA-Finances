"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Donation, Devotee } from "@/lib/types";
import { PaymentMethodIcon } from "@/components/PaymentMethodIcon";

interface YearEndReportProps {
  year: number;
}

type JoinedDonation = Donation & { devotee: Devotee };

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function YearEndReport({ year }: YearEndReportProps) {
  const [donations, setDonations] = useState<JoinedDonation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchYearData() {
      setIsLoading(true);
      try {
        const startOfYear = `${year}-01-01`;
        const endOfYear = `${year}-12-31`;

        const { data, error } = await supabase
          .from("donations")
          .select("*, devotee:devotees(*)")
          .gte("donation_date", startOfYear)
          .lte("donation_date", endOfYear)
          .order("donation_date", { ascending: false });

        if (error) throw error;
        setDonations((data || []) as JoinedDonation[]);
      } catch (err) {
        console.error("Failed to fetch year-end report:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchYearData();
  }, [year]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-saffron-200 border-t-saffron-600 rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Calculate Aggregate by Payment Method
  const methodTotals = donations.reduce((acc, donation) => {
    const method = donation.payment_method;
    acc[method] = (acc[method] || 0) + Number(donation.amount);
    return acc;
  }, {} as Record<string, number>);

  const totalAmount = Object.values(methodTotals).reduce((sum, val) => sum + val, 0);
  const sortedMethods = Object.entries(methodTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 mt-6 animate-in fade-in duration-300">
      {/* Overview Section (No Cards) */}
      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-temple-800">
            {formatCurrency(totalAmount)}
          </h2>
          <p className="text-temple-500 font-medium mt-1">
            Total Donated in {year} &bull; {donations.length} total donations
          </p>
        </div>

        {/* Payment Method Breakdown (Less Significance) */}
        {donations.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
            {sortedMethods.map(([method, amount]) => {
              const percentage = ((amount / totalAmount) * 100).toFixed(1);
              return (
                <div key={method} className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 bg-temple-50 rounded flex items-center justify-center">
                    <PaymentMethodIcon method={method} className="w-3.5 h-3.5 text-temple-500" />
                  </span>
                  <span className="text-temple-700 font-medium">{method}:</span>
                  <span className="text-temple-900 font-bold">{formatCurrency(amount)}</span>
                  <span className="text-temple-400">({percentage}%)</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chronological Table */}
      <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-temple-400 border-b border-saffron-100/50 bg-saffron-50/30">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Devotee Name</th>
                <th className="px-6 py-4 font-semibold">Method</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-saffron-50">
              {donations.map((d) => {
                // Combine names robustly
                const firstName = d.devotee?.first_name || "";
                const middleName = d.devotee?.middle_name ? ` ${d.devotee.middle_name}` : "";
                const lastName = d.devotee?.last_name ? ` ${d.devotee.last_name}` : "";
                
                // Using just First + Middle as requested or full name? User said: "First Name and middle Name do not need to be two separate columns; just make it as DEVOTEE NAME"
                // Assuming it should show first, middle, and last like a normal system, but let's at least combine whatever is given.
                const devoteeName = `${firstName}${middleName}${lastName}`.trim() || "Unknown";

                return (
                  <tr key={d.id} className="hover:bg-saffron-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-temple-500 font-medium whitespace-nowrap">
                      {formatDate(d.donation_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-temple-800">
                      {devoteeName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-temple-50 text-temple-600 rounded-lg text-sm tooltip" title={d.payment_method}>
                        <PaymentMethodIcon method={d.payment_method} className="w-4 h-4 text-temple-600" />
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-emerald-600">{formatCurrency(Number(d.amount))}</span>
                    </td>
                  </tr>
                );
              })}
              {donations.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-temple-400">
                    No donations recorded in {year}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
