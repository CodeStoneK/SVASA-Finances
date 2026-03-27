"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { BankAccount, Transaction } from "@/lib/types";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editAccountNumber, setEditAccountNumber] = useState("");

  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [accRes, txRes] = await Promise.all([
        supabase.from("bank_accounts").select("*").order("institution").order("name"),
        supabase.from("transactions").select("bank_account_id, transfer_to_account_id, amount, type")
      ]);

      if (accRes.error) throw accRes.error;
      if (txRes.error) throw txRes.error;

      const txs = txRes.data || [];
      const accountsWithCurrent = (accRes.data || []).map(acc => {
        let netChange = 0;

        txs.forEach(tx => {
          if (tx.bank_account_id === acc.id) {
            if (tx.type === 'Revenue') netChange += Math.abs(Number(tx.amount));
            if (tx.type === 'Expense') netChange -= Math.abs(Number(tx.amount));
            if (tx.type === 'Transfer') {
              if (tx.transfer_to_account_id) {
                netChange -= Math.abs(Number(tx.amount)); // Linked manual transfer OUT
              } else {
                netChange += Number(tx.amount); // Disconnected QBO transfer (+ or -)
              }
            }
          }
          if (tx.transfer_to_account_id === acc.id && tx.type === 'Transfer') {
            netChange += Math.abs(Number(tx.amount)); // Linked manual transfer IN
          }
        });

        return {
          ...acc,
          current_balance: Number(acc.starting_balance) + netChange
        };
      });

      setAccounts(accountsWithCurrent);
    } catch (err: any) {
      console.error("Failed to fetch accounts:", err);
      if (err.message?.includes("relation") && err.message?.includes("does not exist")) {
        setError("Database tables not found. Please run the Supabase migrations.");
      } else {
        setError("Failed to load bank accounts.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSave = async (id: string) => {
    try {
      const parsedBalance = parseFloat(editBalance.replace(/[^0-9.-]+/g, ""));
      if (isNaN(parsedBalance)) return alert("Invalid amount");
      if (!editDate) return alert("Date is required");

      const { error: updateError } = await supabase
        .from("bank_accounts")
        .update({
          starting_balance: parsedBalance,
          starting_balance_date: editDate,
          account_number: editAccountNumber || null,
        })
        .eq("id", id);

      if (updateError) throw updateError;
      setEditingId(null);
      fetchAccounts();
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update account.");
    }
  };

  const startEdit = (acc: BankAccount) => {
    setEditingId(acc.id);
    setEditBalance(acc.starting_balance.toString());
    setEditDate(acc.starting_balance_date);
    setEditAccountNumber(acc.account_number || "");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-saffron-200 border-t-saffron-600 rounded-full animate-spin" />
          <p className="text-temple-500">Loading accounts...</p>
        </div>
      </div>
    );
  }

  // Group by institution
  const byInstitution: Record<string, BankAccount[]> = {};
  accounts.forEach(acc => {
    if (!byInstitution[acc.institution]) byInstitution[acc.institution] = [];
    byInstitution[acc.institution].push(acc);
  });

  const grandTotal = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-temple-800">Bank Accounts</h1>
          <p className="text-temple-500 mt-1">Manage standard operating accounts and verify balances</p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl p-12 text-center">
          <p className="text-temple-500">No bank accounts found.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(byInstitution).map(([inst, accs]) => (
            <div key={inst} className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6 pb-6 border-b border-saffron-100/50">
                <h2 className="text-2xl font-bold text-temple-800 flex items-center gap-3">
                  <span className="text-3xl">🏛️</span> {inst}
                </h2>
                <div className="text-right">
                  <p className="text-sm text-temple-500 uppercase tracking-widest font-semibold">{inst} Total</p>
                  <p className="text-3xl font-black text-temple-900 tracking-tight">
                    {formatCurrency(accs.reduce((sum, a) => sum + (a.current_balance || 0), 0))}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accs.map((acc) => (
                  <div key={acc.id} className="bg-white border border-saffron-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-4 leading-none">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                        acc.account_type === 'Checking' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {acc.account_type}
                      </span>
                      {acc.account_number && (
                        <p className="text-xs text-temple-500 font-mono mt-1 text-right">••••{acc.account_number.slice(-4)}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-saffron-50 to-saffron-100 flex items-center justify-center shrink-0 border border-saffron-200">
                        <span className="text-xl">🏦</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-temple-800 leading-tight">{acc.name}</h3>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-temple-400 uppercase tracking-wide font-semibold mb-1">Current Balance</p>
                      <p className="text-4xl font-black text-temple-900 tracking-tight">
                        {acc.current_balance !== undefined ? formatCurrency(acc.current_balance) : '...'}
                      </p>
                    </div>

                    <div className="bg-saffron-50/30 rounded-lg p-3 mt-auto border border-saffron-100/30">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-temple-500">Starting Balance Config</span>
                        {editingId !== acc.id && (
                          <button onClick={() => startEdit(acc)} className="text-xs text-saffron-600 hover:text-saffron-700 underline opacity-0 group-hover:opacity-100 transition-opacity">
                            Edit
                          </button>
                        )}
                      </div>

                      {editingId === acc.id ? (
                        <div className="space-y-3 mt-2">
                          <div>
                            <label className="text-xs text-temple-400">Account Number (QBO strict match)</label>
                            <input type="text" value={editAccountNumber} onChange={(e) => setEditAccountNumber(e.target.value)} className="w-full px-2 py-1 text-xs rounded border border-saffron-200 focus:outline-none focus:ring-1 focus:ring-saffron-500" placeholder="e.g. 1227272737" />
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-xs text-temple-400">Start Balance</label>
                              <input type="number" value={editBalance} onChange={(e) => setEditBalance(e.target.value)} className="w-full px-2 py-1 text-xs rounded border border-saffron-200 focus:outline-none focus:ring-1 focus:ring-saffron-500" />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs text-temple-400">As of Date</label>
                              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full px-2 py-1 text-xs rounded border border-saffron-200 focus:outline-none focus:ring-1 focus:ring-saffron-500" />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end mt-2">
                            <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-temple-500 hover:bg-saffron-100 rounded transition-colors">Cancel</button>
                            <button onClick={() => handleSave(acc.id)} className="px-2 py-1 text-xs bg-saffron-600 text-white rounded hover:bg-saffron-700 transition-colors">Save</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-temple-700">{formatCurrency(acc.starting_balance)}</p>
                          <p className="text-[10px] uppercase tracking-wider text-temple-400 mt-0.5">Anchored {acc.starting_balance_date}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Grand Total */}
          <div className="bg-temple-900 text-saffron-100 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center shadow-lg mt-8 border border-temple-800 gap-4">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-saffron-500/20 flex items-center justify-center">
                 <span className="text-2xl">💰</span>
               </div>
               <div>
                  <h2 className="text-xl font-medium tracking-wide uppercase text-saffron-200">Total</h2>
                  <p className="text-sm text-temple-400">Consolidated Cash on Hand</p>
               </div>
             </div>
             <span className="text-5xl font-black tracking-tight text-white">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
