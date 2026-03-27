"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { FinanceCategory, FinanceSubcategory, Budget } from "@/lib/types";

export default function ProformaBudgetPage() {
  const [categories, setCategories] = useState<(FinanceCategory & { subcategories: FinanceSubcategory[] })[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state: "catId|subId|quarter" => amount
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch categories and subcategories
        const { data: catData, error: catError } = await supabase
          .from("finance_categories")
          .select("*, subcategories:finance_subcategories(*)")
          .order("type", { ascending: false }) // Revenue first, then Expense
          .order("name");

        if (catError) throw catError;
        setCategories(catData || []);

        // Fetch existing budgets for selected year
        const { data: budgetData, error: budgetError } = await supabase
          .from("budgets")
          .select("*")
          .eq("year", selectedYear);

        if (budgetError) throw budgetError;
        setBudgets(budgetData || []);

        // Initialize form data
        const initialForm: Record<string, string> = {};
        budgetData?.forEach((b) => {
          const key = `${b.category_id}|${b.subcategory_id || ""}|${b.quarter}`;
          initialForm[key] = b.amount.toString();
        });
        setFormData(initialForm);
      } catch (err: any) {
        console.error("Failed to fetch budget data:", err);
        setError("Failed to load proforma budget. Did you run the database migrations?");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [selectedYear]);

  const handleInputChange = (catId: string, subId: string | null, quarter: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [`${catId}|${subId || ""}|${quarter}`]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: Partial<Budget>[] = [];

      categories.forEach((cat) => {
        // Handle categories without subcategories
        if (cat.subcategories.length === 0) {
          [1, 2, 3, 4].forEach((q) => {
            const val = formData[`${cat.id}||${q}`];
            if (val) {
              updates.push({
                year: selectedYear,
                quarter: q,
                category_id: cat.id,
                subcategory_id: null,
                amount: parseFloat(val) || 0,
              });
            }
          });
        }

        // Handle subcategories
        cat.subcategories.forEach((sub) => {
          [1, 2, 3, 4].forEach((q) => {
            const val = formData[`${cat.id}|${sub.id}|${q}`];
            if (val) {
              updates.push({
                year: selectedYear,
                quarter: q,
                category_id: cat.id,
                subcategory_id: sub.id,
                amount: parseFloat(val) || 0,
              });
            }
          });
        });
      });

      // Simple upsert logic
      if (updates.length > 0) {
        const { error } = await supabase.from("budgets").upsert(
          updates, 
          { onConflict: 'year, quarter, category_id, subcategory_id' }
        );
        if (error) throw error;
      }
      
      alert("Proforma budget saved successfully!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save budgets.");
    } finally {
      setIsSaving(false);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-temple-500">Loading budget...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-temple-800">Proforma Budget</h1>
          <p className="text-temple-500 mt-1">Set estimated quarterly goals for your finances</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2.5 rounded-xl border border-saffron-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-saffron-500 font-medium text-temple-800"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 px-6 py-2.5 font-semibold text-white rounded-xl shadow-lg transition-all active:translate-y-0 ${
              isSaving 
                ? "bg-temple-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-300/50 hover:shadow-xl hover:shadow-emerald-400/50 hover:-translate-y-0.5"
            }`}
          >
            {isSaving ? "Saving..." : "Save Budget"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      ) : (
        <div className="space-y-8">
          {["Revenue", "Expense"].map((type) => {
            const typeCats = categories.filter((c) => c.type === type);
            if (typeCats.length === 0) return null;

            return (
              <div key={type} className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-saffron-50/50 px-6 py-4 border-b border-saffron-100/50">
                  <h2 className="text-xl font-bold text-temple-800">{type} Estimates</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-temple-400 border-b border-saffron-100/50">
                        <th className="px-6 py-3 font-semibold min-w-[200px]">Category / Subcategory</th>
                        <th className="px-4 py-3 font-semibold text-center w-32">Q1 Estimate</th>
                        <th className="px-4 py-3 font-semibold text-center w-32">Q2 Estimate</th>
                        <th className="px-4 py-3 font-semibold text-center w-32">Q3 Estimate</th>
                        <th className="px-4 py-3 font-semibold text-center w-32">Q4 Estimate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-saffron-50">
                      {typeCats.map((cat) => (
                        <React.Fragment key={cat.id}>
                          {/* Category Header Row (if it has subcategories, we don't put inputs here usually, but let's allow it if there are no subcats) */}
                          <tr className="bg-saffron-50/20">
                            <td className="px-6 py-3 font-semibold text-temple-800">{cat.name}</td>
                            {[1, 2, 3, 4].map((q) => (
                              <td key={q} className="px-4 py-2">
                                {cat.subcategories.length === 0 ? (
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-temple-400 text-sm">$</span>
                                    <input
                                      type="number"
                                      value={formData[`${cat.id}||${q}`] || ""}
                                      onChange={(e) => handleInputChange(cat.id, null, q, e.target.value)}
                                      className="w-full pl-7 pr-3 py-1.5 text-sm rounded-lg border border-saffron-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                                      placeholder="0.00"
                                    />
                                  </div>
                                ) : <div className="text-center text-xs text-temple-300">-</div>}
                              </td>
                            ))}
                          </tr>
                          
                          {/* Subcategory Rows */}
                          {cat.subcategories.map((sub) => (
                            <tr key={sub.id} className="hover:bg-saffron-50/50 transition-colors">
                              <td className="px-6 py-3 pl-10 text-sm text-temple-600 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-saffron-300" />
                                {sub.name}
                              </td>
                              {[1, 2, 3, 4].map((q) => (
                                <td key={q} className="px-4 py-2">
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-temple-400 text-sm">$</span>
                                    <input
                                      type="number"
                                      value={formData[`${cat.id}|${sub.id}|${q}`] || ""}
                                      onChange={(e) => handleInputChange(cat.id, sub.id, q, e.target.value)}
                                      className="w-full pl-7 pr-3 py-1.5 text-sm rounded-lg border border-saffron-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
