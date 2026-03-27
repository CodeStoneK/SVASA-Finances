"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { FinanceCategory, FinanceSubcategory, Budget, Transaction } from "@/lib/types";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

export default function BudgetVsActualPage() {
  const [categories, setCategories] = useState<(FinanceCategory & { subcategories: FinanceSubcategory[] })[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [catsRes, budgetsRes, txRes] = await Promise.all([
          supabase.from("finance_categories").select("*, subcategories:finance_subcategories(*)").order("type", { ascending: false }).order("name"),
          supabase.from("budgets").select("*").eq("year", selectedYear),
          supabase.from("transactions").select("*").gte("date", `${selectedYear}-01-01`).lte("date", `${selectedYear}-12-31`)
        ]);

        if (catsRes.error) throw catsRes.error;
        if (budgetsRes.error) throw budgetsRes.error;
        if (txRes.error) throw txRes.error;

        setCategories(catsRes.data || []);
        setBudgets(budgetsRes.data || []);
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

  // Helper to get budget for a specific Q and Category/Subcat
  const getBudget = (catId: string, subId: string | null, q: number) => {
    return budgets.find(b => b.category_id === catId && b.subcategory_id === subId && b.quarter === q)?.amount || 0;
  };

  // Helper to get actuals for a specific Q and Category/Subcat
  const getActual = (catId: string, subId: string | null, q: number) => {
    return transactions.filter(tx => {
      if (tx.category_id !== catId) return false;
      if (subId !== null && tx.subcategory_id !== subId) return false;
      if (subId === null && tx.subcategory_id !== null) return false; // Strict null matching if needed, but often we roll up if subId missing
      
      const month = new Date(tx.date).getMonth() + 1; // 1-12
      const txQ = Math.ceil(month / 3);
      return txQ === q;
    }).reduce((sum, tx) => sum + Number(tx.amount), 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-temple-200 border-t-temple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-3xl p-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-temple-800">Estimated vs Actual</h1>
          <p className="text-temple-500 mt-1">Quarterly variance report for the selected year</p>
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

      {["Revenue", "Expense"].map((type) => {
        const typeCats = categories.filter((c) => c.type === type);
        if (typeCats.length === 0) return null;

        return (
          <div key={type} className="bg-white border border-saffron-200 rounded-2xl shadow-sm overflow-hidden">
            <div className={`px-4 py-3 border-b border-saffron-200 ${type === 'Revenue' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              <h2 className="text-lg font-bold">{type}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-saffron-50/50 text-temple-500 uppercase tracking-wider text-xs border-b border-saffron-100">
                    <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-saffron-50/90 backdrop-blur">Category</th>
                    {[1, 2, 3, 4].map(q => (
                      <React.Fragment key={q}>
                        <th className="px-3 py-3 text-right">Q{q} Est</th>
                        <th className="px-3 py-3 text-right border-r border-saffron-100">Q{q} Act</th>
                      </React.Fragment>
                    ))}
                    <th className="px-4 py-3 text-right bg-saffron-100/50">Total Est</th>
                    <th className="px-4 py-3 text-right bg-saffron-100/50">Total Act</th>
                    <th className="px-4 py-3 text-right bg-saffron-200/50 font-bold">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-saffron-50">
                  {typeCats.map(cat => {
                    const renderRow = (id: string, name: string, subId: string | null, isSub: boolean) => {
                      let totalEst = 0;
                      let totalAct = 0;
                      
                      const cols = [1, 2, 3, 4].map(q => {
                        const est = getBudget(id, subId, q);
                        const act = getActual(id, subId, q);
                        totalEst += est;
                        totalAct += act;
                        return (
                          <React.Fragment key={q}>
                            <td className="px-3 py-2 text-right">{est === 0 ? '-' : formatCurrency(est)}</td>
                            <td className="px-3 py-2 text-right border-r border-saffron-50 font-medium">{act === 0 ? '-' : formatCurrency(act)}</td>
                          </React.Fragment>
                        );
                      });

                      const variance = type === 'Revenue' ? totalAct - totalEst : totalEst - totalAct;

                      return (
                        <tr key={`${id}-${subId || 'main'}`} className={`hover:bg-saffron-50/30 ${isSub ? '' : 'bg-saffron-50/10 font-medium'}`}>
                          <td className={`px-4 py-2 sticky left-0 bg-white ${isSub ? 'pl-8 text-temple-600' : 'text-temple-800'}`}>
                            {name}
                          </td>
                          {cols}
                          <td className="px-4 py-2 text-right bg-saffron-50/30">{totalEst === 0 ? '-' : formatCurrency(totalEst)}</td>
                          <td className="px-4 py-2 text-right bg-saffron-50/30 font-semibold">{totalAct === 0 ? '-' : formatCurrency(totalAct)}</td>
                          <td className={`px-4 py-2 text-right font-bold bg-saffron-100/30 ${variance > 0 ? 'text-emerald-600' : variance < 0 ? 'text-rose-600' : 'text-temple-500'}`}>
                            {variance === 0 ? '-' : formatCurrency(variance)}
                          </td>
                        </tr>
                      );
                    };

                    const rows = [];
                    // Render category rollup (could implement full rollup math, but for now just showing if it has generic budget)
                    if (cat.subcategories.length === 0) {
                      rows.push(renderRow(cat.id, cat.name, null, false));
                    } else {
                      // Subcategories
                      rows.push(
                        <tr key={`${cat.id}-header`} className="bg-saffron-50/30">
                          <td colSpan={14} className="px-4 py-2 font-bold text-temple-800 sticky left-0">{cat.name}</td>
                        </tr>
                      );
                      cat.subcategories.forEach(sub => {
                        rows.push(renderRow(cat.id, sub.name, sub.id, true));
                      });
                    }
                    return rows;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
