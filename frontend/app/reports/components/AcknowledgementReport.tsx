"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Donation, Devotee } from "@/lib/types";

interface AcknowledgementReportProps {
  year: number;
}

type JoinedDonation = Donation & { devotee: Devotee };

interface DevoteeSummary {
  devotee: Devotee;
  totalAmount: number;
  donationCount: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export function AcknowledgementReport({ year }: AcknowledgementReportProps) {
  const [summaries, setSummaries] = useState<DevoteeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAcknowledgements() {
      setIsLoading(true);
      try {
        const startOfYear = `${year}-01-01`;
        const endOfYear = `${year}-12-31`;

        // Fetch all donations for the year
        const { data, error } = await supabase
          .from("donations")
          .select("*, devotee:devotees(*)")
          .gte("donation_date", startOfYear)
          .lte("donation_date", endOfYear);

        if (error) throw error;

        const donations = (data || []) as JoinedDonation[];

        // Group by devotee_id
        const grouped = donations.reduce((acc, donation) => {
          const devId = donation.devotee_id;
          if (!acc[devId]) {
            acc[devId] = {
              devotee: donation.devotee,
              totalAmount: 0,
              donationCount: 0,
            };
          }
          acc[devId].totalAmount += Number(donation.amount);
          acc[devId].donationCount += 1;
          return acc;
        }, {} as Record<string, DevoteeSummary>);

        // Filter out those less than $500, then sort by highest amount
        const qualified = Object.values(grouped)
          .filter((summary) => summary.totalAmount >= 500)
          .sort((a, b) => b.totalAmount - a.totalAmount);

        setSummaries(qualified);
      } catch (err) {
        console.error("Failed to fetch acknowledgements:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAcknowledgements();
  }, [year]);

  const handleGenerateLetter = (summary: DevoteeSummary) => {
    // Placeholder action for testing
    alert(`Generating letter for ${summary.devotee.first_name}... (Template not yet provided)`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-saffron-200 border-t-saffron-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-8 animate-in fade-in duration-300">
      <div className="bg-saffron-50 border border-saffron-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🖨️</div>
          <div>
            <h2 className="text-lg font-bold text-temple-800">Special Acknowledgements</h2>
            <p className="text-temple-600 mt-1 max-w-2xl text-sm leading-relaxed">
              This list indicates devotees who have donated <strong>$500 or more in aggregate</strong> during {year}.
              Generate and download the specialized tax acknowledgement letter for these donors below.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-saffron-100">
          <h3 className="font-bold text-temple-800">Qualifying Donors ({summaries.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-temple-400 border-b border-saffron-100/50">
                <th className="px-6 py-4 font-semibold">Devotee</th>
                <th className="px-6 py-4 font-semibold">Donation Count</th>
                <th className="px-6 py-4 font-semibold">Total Given</th>
                <th className="px-6 py-4 font-semibold w-40">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-saffron-50">
              {summaries.map((summary) => (
                <tr key={summary.devotee.id} className="hover:bg-saffron-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-saffron-300 to-saffron-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                        {summary.devotee.first_name[0]}
                        {summary.devotee.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-temple-800">
                          {`${summary.devotee.first_name}${summary.devotee.middle_name ? ` ${summary.devotee.middle_name}` : ""} ${summary.devotee.last_name}`}
                        </p>
                        <div className="flex gap-2 text-xs text-temple-400 mt-0.5">
                          {summary.devotee.city && summary.devotee.state && (
                            <span>📍 {summary.devotee.city}, {summary.devotee.state}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-temple-600 font-medium">
                    {summary.donationCount} donations
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-emerald-600 text-lg">
                      {formatCurrency(summary.totalAmount)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleGenerateLetter(summary)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-temple-50 text-temple-700 font-medium rounded-xl hover:bg-temple-100 transition-all text-sm w-full justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Generate
                    </button>
                  </td>
                </tr>
              ))}
              {summaries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-temple-400">
                    No devotees have donated $500 or more during {year}.
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
