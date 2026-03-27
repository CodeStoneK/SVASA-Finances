"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { BankAccount, FinanceCategory, FinanceSubcategory, Transaction } from "@/lib/types";
import { parseQBO, ParsedQBOTransaction } from "@/lib/qboParser";
import Link from "next/link";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export default function TransactionsPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // QBO Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewTx, setPreviewTx] = useState<ParsedQBOTransaction[] | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    async function fetchTransactions() {
      setIsLoading(true);
      setError(null);
      try {
        const [accRes, txRes] = await Promise.all([
          supabase.from("bank_accounts").select("*").order("name"),
          supabase
            .from("transactions")
            .select(`
              *,
              bank_account:bank_accounts!transactions_bank_account_id_fkey(*),
              category:finance_categories(*),
              subcategory:finance_subcategories(*)
            `)
            .order("date", { ascending: false })
            .limit(100)
        ]);

        if (accRes.error) throw accRes.error;
        if (txRes.error) throw txRes.error;

        setBankAccounts(accRes.data || []);
        if (accRes.data && accRes.data.length > 0) {
          setSelectedBankId(accRes.data[0].id);
        }
        setTransactions(txRes.data || []);
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load ledger.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseQBO(text);
        if (parsed.length > 0) {
          setPreviewTx(parsed);

          // Try to auto-match the bank account
          const qboAccountId = parsed[0].qbo_account_id;
          if (qboAccountId) {
            const matchedAccount = bankAccounts.find(
              (acc) => acc.account_number && qboAccountId.includes(acc.account_number)
            );
            if (matchedAccount) {
              setSelectedBankId(matchedAccount.id);
            }
          }
        } else {
          alert("No transactions found in this file.");
        }
      } catch (err) {
        alert("Failed to parse the QBO file. Ensure it is a valid format.");
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmImport = async () => {
    if (!previewTx || !selectedBankId) return;
    setIsImporting(true);
    
    try {
      // Map to DB insert format
      const inserts = previewTx.map(tx => ({
        bank_account_id: selectedBankId,
        date: tx.date,
        amount: tx.amount,
        type: tx.type,
        bank_transaction_id: tx.fitid,
        description: tx.description,
        category_id: null, // default to uncategorized
      }));

      const { error: insertError, count } = await supabase
        .from('transactions')
        .upsert(inserts, { onConflict: 'bank_account_id,bank_transaction_id', ignoreDuplicates: true });

      if (insertError) {
        throw insertError;
      } else {
        alert("Import complete! Duplicate transactions (if any) were skipped.");
      }

      setPreviewTx(null);
      // Refetch
      const { data } = await supabase
        .from("transactions")
        .select(`*, bank_account:bank_accounts!transactions_bank_account_id_fkey(*), category:finance_categories(*), subcategory:finance_subcategories(*)`)
        .order("date", { ascending: false })
        .limit(100);
      if (data) setTransactions(data);

    } catch (err: any) {
      console.error("Import error", err);
      alert(err.message || "Failed to import transactions.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction? This cannot be undone.")) return;
    try {
      const { error: deleteError } = await supabase.from('transactions').delete().eq('id', id);
      if (deleteError) throw deleteError;
      
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete transaction.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-temple-200 border-t-temple-600 rounded-full animate-spin" />
          <p className="text-temple-500">Loading ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-temple-800">Ledger</h1>
          <p className="text-temple-500 mt-1">Manage revenues, expenses, and inter-bank transfers</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            accept=".qbo,.qfx,.ofx" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload} 
          />
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-saffron-300 text-saffron-700 font-medium rounded-xl hover:bg-saffron-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-5 h-5 text-saffron-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import QBO
          </button>
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-saffron-600 text-white font-medium rounded-xl hover:bg-saffron-700 transition-colors shadow-sm shadow-saffron-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Manual
          </button>
        </div>
      </div>

      {previewTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-saffron-100 flex items-center justify-between bg-saffron-50/50">
              <h2 className="text-xl font-bold text-temple-800">Preview QBO Import</h2>
              <button onClick={() => setPreviewTx(null)} className="text-temple-400 hover:text-temple-600">✕</button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 space-y-6">
              <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <label className="text-sm font-semibold text-temple-700">Account for these transactions:</label>
                <select 
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-saffron-200 bg-white font-medium focus:ring-2 focus:ring-saffron-500"
                >
                  {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </div>

              <div className="border border-saffron-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-saffron-50/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-temple-500 font-semibold">Date</th>
                      <th className="px-4 py-2 text-left text-temple-500 font-semibold">Type</th>
                      <th className="px-4 py-2 text-left text-temple-500 font-semibold">Description</th>
                      <th className="px-4 py-2 text-right text-temple-500 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-saffron-100">
                    {previewTx.map((tx, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 whitespace-nowrap">{tx.date}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${tx.type === 'Revenue' ? 'bg-emerald-100 text-emerald-700' : tx.type === 'Expense' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>{tx.type}</span>
                        </td>
                        <td className="px-4 py-2 break-all">{tx.description}</td>
                        <td className="px-4 py-2 text-right font-medium">{formatCurrency(tx.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-saffron-100 bg-saffron-50/30 flex justify-end gap-3">
              <button 
                onClick={() => setPreviewTx(null)}
                className="px-6 py-2 rounded-xl border border-saffron-200 text-temple-600 font-medium hover:bg-saffron-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmImport}
                disabled={isImporting}
                className="px-6 py-2 rounded-xl bg-saffron-600 text-white font-bold hover:bg-saffron-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isImporting ? 'Importing...' : `Import ${previewTx.length} Transactions`}
              </button>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-temple-400 border-b border-saffron-100/50 bg-saffron-50/30">
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Account</th>
                  <th className="px-6 py-4 font-semibold">Description</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold text-right">Amount</th>
                  <th className="px-6 py-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-saffron-50">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-temple-400">
                      No transactions found. Import your QBO statement or add one manually.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-saffron-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-medium text-temple-700 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="px-6 py-4 text-sm text-temple-600 whitespace-nowrap">
                        {tx.bank_account?.name || "Unknown Bank"}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-temple-800 line-clamp-1">{tx.description || tx.reference_number || "No Description"}</p>
                        {tx.bank_transaction_id && (
                          <p className="text-xs text-temple-400 font-mono mt-0.5" title="Bank ID">{tx.bank_transaction_id}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded w-max mb-1 ${
                            tx.type === 'Revenue' ? 'bg-emerald-100 text-emerald-700' :
                            tx.type === 'Expense' ? 'bg-rose-100 text-rose-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {tx.type}
                          </span>
                          <span className="text-sm text-temple-600">
                            {tx.category ? `${tx.category.name} ${tx.subcategory ? `> ${tx.subcategory.name}` : ''}` : "Uncategorized"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className={`font-semibold ${
                          tx.type === 'Revenue' ? 'text-emerald-600' :
                          tx.type === 'Expense' ? 'text-rose-600' :
                          'text-blue-600'
                        }`}>
                          {tx.type === 'Expense' ? '-' : tx.type === 'Revenue' ? '+' : Number(tx.amount) < 0 ? '-' : '+'}
                          {formatCurrency(Math.abs(Number(tx.amount)))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button 
                          onClick={() => handleDelete(tx.id)}
                          className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-opacity p-2"
                          title="Delete Transaction"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
