"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { FinanceCategory, FinanceSubcategory, Transaction } from "@/lib/types";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

// Months 1-12 mapped to their Quarter
const MONTH_MAP = [
  { m: 1, name: 'JAN', q: 1 }, { m: 2, name: 'FEB', q: 1 }, { m: 3, name: 'MAR', q: 1 },
  { m: 4, name: 'APR', q: 2 }, { m: 5, name: 'MAY', q: 2 }, { m: 6, name: 'JUN', q: 2 },
  { m: 7, name: 'JUL', q: 3 }, { m: 8, name: 'AUG', q: 3 }, { m: 9, name: 'SEP', q: 3 },
  { m: 10, name: 'OCT', q: 4 }, { m: 11, name: 'NOV', q: 4 }, { m: 12, name: 'DEC', q: 4 }
];

export default function YearlySummaryPage() {
  const [categories, setCategories] = useState<(FinanceCategory & { subcategories: FinanceSubcategory[] })[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [catsRes, txRes] = await Promise.all([
          supabase.from("finance_categories").select("*, subcategories:finance_subcategories(*)").order("type", { ascending: false }).order("name"),
          supabase.from("transactions").select("*").gte("date", `${selectedYear}-01-01`).lte("date", `${selectedYear}-12-31`)
        ]);

        if (catsRes.error) throw catsRes.error;
        if (txRes.error) throw txRes.error;

        setCategories(catsRes.data || []);
        setTransactions(txRes.data || []);
      } catch (err) {
        console.error("Failed to load report data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [selectedYear]);

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  // Helper to get total for a specific month (1-12) or quarter (Q1-4) or 'year'
  const getActual = (catId: string, subId: string | null, period: {type: 'month'|'quarter'|'year', value?: number}) => {
    return transactions.filter(tx => {
      if (tx.category_id !== catId) return false;
      if (subId !== null && tx.subcategory_id !== subId) return false;
      
      if (period.type === 'year') return true;
      
      const month = new Date(tx.date).getMonth() + 1;
      
      if (period.type === 'month') {
        return month === period.value;
      }
      if (period.type === 'quarter') {
        const txQ = Math.ceil(month / 3);
        return txQ === period.value;
      }
      return false;
    }).reduce((sum, tx) => sum + Number(tx.amount), 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-temple-200 border-t-temple-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Pre-calculate totals for Net Balance
  const monthlyNet: Record<number, number> = {};
  const quarterlyNet: Record<number, number> = {1:0, 2:0, 3:0, 4:0};
  let yearlyNet = 0;

  MONTH_MAP.forEach(({ m, q }) => {
    const rev = transactions.filter(t => t.type === 'Revenue' && new Date(t.date).getMonth() + 1 === m).reduce((s, t) => s + Number(t.amount), 0);
    const exp = transactions.filter(t => t.type === 'Expense' && new Date(t.date).getMonth() + 1 === m).reduce((s, t) => s + Number(t.amount), 0);
    const net = rev - exp;
    
    monthlyNet[m] = net;
    quarterlyNet[q] += net;
    yearlyNet += net;
  });

  return (
    <div className="max-w-[100vw] overflow-x-hidden space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-3xl p-6 shadow-sm mx-4 xl:mx-8">
        <div>
          <h1 className="text-3xl font-bold text-temple-800">Yearly Summary</h1>
          <p className="text-temple-500 mt-1">Monthly breakdown and P&L for {selectedYear}</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-temple-700">Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 rounded-xl border-2 border-saffron-200 bg-white shadow-sm font-bold text-temple-800 focus:outline-none focus:ring-2 focus:ring-saffron-500"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="mx-4 xl:mx-8 bg-white border border-saffron-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-saffron-600 text-white uppercase tracking-wider text-xs">
                <th className="px-4 py-3 text-left font-bold sticky left-0 bg-saffron-700 z-10 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">Category</th>
                
                {MONTH_MAP.map(({ m, name, q }) => (
                  <React.Fragment key={name}>
                    <th className="px-3 py-3 text-right font-semibold min-w-[80px]">{name}</th>
                    {m % 3 === 0 && (
                      <th className="px-3 py-3 text-right font-bold bg-saffron-800/20 min-w-[90px]">Q{q}</th>
                    )}
                  </React.Fragment>
                ))}
                <th className="px-4 py-3 text-right font-bold bg-white/20 min-w-[100px]">Annual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-saffron-50">
              {["Revenue", "Expense"].map((type) => {
                const typeCats = categories.filter((c) => c.type === type);
                if (typeCats.length === 0) return null;

                return (
                  <React.Fragment key={type}>
                    <tr>
                      <td colSpan={18} className={`px-4 py-2 font-bold ${type === 'Revenue' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'} sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>
                        {type}
                      </td>
                    </tr>
                    {typeCats.map(cat => {
                      const renderRow = (id: string, name: string, subId: string | null, isSub: boolean) => {
                        return (
                          <tr key={`${id}-${subId || 'main'}`} className={`hover:bg-saffron-50/50 ${isSub ? '' : 'bg-saffron-50/10 font-medium'}`}>
                            <td className={`px-4 py-2 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] bg-white ${isSub ? 'pl-8 text-temple-600' : 'text-temple-800'}`}>
                              {name}
                            </td>
                            {MONTH_MAP.map(({ m, q }) => {
                              const val = getActual(id, subId, {type: 'month', value: m});
                              const qVal = m % 3 === 0 ? getActual(id, subId, {type: 'quarter', value: q}) : null;
                              return (
                                <React.Fragment key={`${m}`}>
                                  <td className="px-3 py-2 text-right">{val === 0 ? '-' : formatCurrency(val)}</td>
                                  {m % 3 === 0 && (
                                    <td className="px-3 py-2 text-right font-semibold bg-saffron-50/30">{qVal === 0 ? '-' : formatCurrency(qVal!)}</td>
                                  )}
                                </React.Fragment>
                              );
                            })}
                            <td className="px-4 py-2 text-right font-bold bg-saffron-50/50">
                              {(() => {
                                const yrVal = getActual(id, subId, {type: 'year'});
                                return yrVal === 0 ? '-' : formatCurrency(yrVal);
                              })()}
                            </td>
                          </tr>
                        );
                      };

                      const rows = [];
                      if (cat.subcategories.length === 0) {
                        rows.push(renderRow(cat.id, cat.name, null, false));
                      } else {
                        rows.push(
                          <tr key={`${cat.id}-header`} className="bg-saffron-50/20">
                            <td colSpan={18} className="px-4 py-2 font-bold text-temple-800 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] bg-saffron-50/90 backdrop-blur">{cat.name}</td>
                          </tr>
                        );
                        cat.subcategories.forEach(sub => {
                          rows.push(renderRow(cat.id, sub.name, sub.id, true));
                        });
                      }
                      return rows;
                    })}
                  </React.Fragment>
                );
              })}

              {/* Net Balance Row */}
              <tr className="bg-temple-800 text-white">
                <td className="px-4 py-4 font-bold sticky left-0 bg-temple-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]">
                  Net Balance
                </td>
                {MONTH_MAP.map(({ m, q }) => {
                  const net = monthlyNet[m];
                  const qNet = quarterlyNet[q];
                  return (
                    <React.Fragment key={m}>
                      <td className={`px-3 py-4 text-right font-semibold ${net > 0 ? 'text-emerald-400' : net < 0 ? 'text-rose-400' : ''}`}>
                        {net === 0 ? '-' : formatCurrency(net)}
                      </td>
                      {m % 3 === 0 && (
                        <td className={`px-3 py-4 text-right font-bold bg-white/10 ${qNet > 0 ? 'text-emerald-400' : qNet < 0 ? 'text-rose-400' : ''}`}>
                          {qNet === 0 ? '-' : formatCurrency(qNet)}
                        </td>
                      )}
                    </React.Fragment>
                  );
                })}
                <td className={`px-4 py-4 text-right font-bold bg-white/20 text-lg ${yearlyNet > 0 ? 'text-emerald-400' : yearlyNet < 0 ? 'text-rose-400' : ''}`}>
                  {yearlyNet === 0 ? '-' : formatCurrency(yearlyNet)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
