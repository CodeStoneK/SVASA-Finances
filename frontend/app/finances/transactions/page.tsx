"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { BankAccount, FinanceCategory, FinanceSubcategory, Transaction } from "@/lib/types";
import { parseQBO, ParsedQBOTransaction } from "@/lib/qboParser";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export default function TransactionsPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<(FinanceCategory & { subcategories: FinanceSubcategory[] })[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // QBO Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewTx, setPreviewTx] = useState<ParsedQBOTransaction[] | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);

  // Inline Category Edit State
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editCatId, setEditCatId] = useState<string>("");
  const [editSubcatId, setEditSubcatId] = useState<string>("");

  // Manual Transaction Modal State
  const [showManual, setShowManual] = useState(false);
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0]);
  const [manualBankId, setManualBankId] = useState("");
  const [manualType, setManualType] = useState<'Revenue' | 'Expense' | 'Transfer'>('Expense');
  const [manualAmount, setManualAmount] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualCatId, setManualCatId] = useState("");
  const [manualSubcatId, setManualSubcatId] = useState("");
  const [manualTransferToId, setManualTransferToId] = useState("");

  const fetchLedger = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [accRes, catRes, txRes] = await Promise.all([
        supabase.from("bank_accounts").select("*").order("name"),
        supabase.from("finance_categories").select("*, subcategories:finance_subcategories(*)").order("name"),
        supabase
          .from("transactions")
          .select(`*, bank_account:bank_accounts!transactions_bank_account_id_fkey(*), category:finance_categories(*), subcategory:finance_subcategories(*)`)
          .order("date", { ascending: false })
          .limit(200)
      ]);

      if (accRes.error) throw accRes.error;
      if (catRes.error) throw catRes.error;
      if (txRes.error) throw txRes.error;

      setBankAccounts(accRes.data || []);
      setCategories(catRes.data || []);
      setTransactions(txRes.data || []);

      if (accRes.data && accRes.data.length > 0) {
        setSelectedBankId(accRes.data[0].id);
        setManualBankId(accRes.data[0].id);
      }
    } catch (err: any) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load ledger.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  // --------------- QBO IMPORT LOGIC ---------------
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmImport = async () => {
    if (!previewTx || !selectedBankId) return;
    setIsImporting(true);
    
    try {
      const inserts = previewTx.map(tx => ({
        bank_account_id: selectedBankId,
        date: tx.date,
        amount: tx.amount,
        type: tx.type,
        bank_transaction_id: tx.fitid,
        description: tx.description,
        category_id: null,
      }));

      const { error: insertError } = await supabase
        .from('transactions')
        .upsert(inserts, { onConflict: 'bank_account_id,bank_transaction_id', ignoreDuplicates: true });

      if (insertError) throw insertError;
      
      alert("Import complete! Duplicate transactions (if any) were skipped.");
      setPreviewTx(null);
      fetchLedger();
    } catch (err: any) {
      console.error("Import error", err);
      alert(err.message || "Failed to import transactions.");
    } finally {
      setIsImporting(false);
    }
  };

  // --------------- EDITING & DELETING ---------------
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      const { error: deleteError } = await supabase.from('transactions').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete transaction.");
    }
  };

  const startCategoryEdit = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditCatId(tx.category_id || "");
    setEditSubcatId(tx.subcategory_id || "");
  };

  const saveCategoryEdit = async (id: string) => {
    try {
      const payload = {
        category_id: editCatId || null,
        subcategory_id: editSubcatId || null,
      };
      const { error } = await supabase.from('transactions').update(payload).eq('id', id);
      if (error) throw error;

      setEditingTxId(null);
      fetchLedger();
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to save categorization.");
    }
  };

  // --------------- MANUAL ENTRY ---------------
  const saveManualTransaction = async () => {
    try {
      const amt = parseFloat(manualAmount.replace(/[^0-9.-]+/g, ""));
      if (isNaN(amt)) return alert("Invalid amount.");
      if (!manualDesc) return alert("Description is required.");

      const payload = {
        bank_account_id: manualBankId,
        date: manualDate,
        amount: amt,
        type: manualType,
        description: manualDesc,
        category_id: manualType === 'Transfer' ? null : (manualCatId || null),
        subcategory_id: manualType === 'Transfer' ? null : (manualSubcatId || null),
        transfer_to_account_id: manualType === 'Transfer' ? manualTransferToId : null,
      };

      const { error } = await supabase.from('transactions').insert([payload]);
      if (error) throw error;

      setShowManual(false);
      setManualAmount("");
      setManualDesc("");
      fetchLedger();
    } catch (err) {
      console.error("Manual insert failed:", err);
      alert("Failed to save transaction.");
    }
  };

  if (isLoading && bankAccounts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-temple-200 border-t-temple-600 rounded-full animate-spin" />
          <p className="text-temple-500">Loading ledger...</p>
        </div>
      </div>
    );
  }

  // Filter available subcategories for editing/manual based on active category
  const activeEditCat = categories.find(c => c.id === editCatId);
  const activeManualCat = categories.find(c => c.id === manualCatId);
  const filteredTypeCats = categories.filter(c => c.type === manualType);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-temple-800">Ledger</h1>
          <p className="text-temple-500 mt-1">Manage revenues, expenses, and inter-bank transfers</p>
        </div>
        <div className="flex gap-3">
          <input type="file" accept=".qbo,.qfx,.ofx" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-saffron-300 text-saffron-700 font-medium rounded-xl hover:bg-saffron-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            Import QBO
          </button>
          <button
            onClick={() => setShowManual(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-saffron-600 text-white font-medium rounded-xl hover:bg-saffron-700 transition-colors shadow-sm"
          >
            Add Manual
          </button>
        </div>
      </div>

      {previewTx && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-saffron-50/50">
              <h2 className="text-xl font-bold text-temple-800">Preview QBO Import</h2>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-6">
              <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="text-sm font-semibold">Account for these transactions:</label>
                <select 
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="px-4 py-2 rounded-lg border bg-white focus:ring-2"
                >
                  {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </div>
              <div className="border border-saffron-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-saffron-50/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Date</th>
                      <th className="px-4 py-2 text-left font-semibold">Type</th>
                      <th className="px-4 py-2 text-left font-semibold">Description</th>
                      <th className="px-4 py-2 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-saffron-100">
                    {previewTx.map((tx, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">{tx.date}</td>
                        <td className="px-4 py-2">{tx.type}</td>
                        <td className="px-4 py-2">{tx.description}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(Math.abs(tx.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-saffron-50/30 flex justify-end gap-3">
              <button onClick={() => setPreviewTx(null)} className="px-6 py-2 border rounded-xl hover:bg-gray-50">Cancel</button>
              <button 
                onClick={confirmImport}
                disabled={isImporting}
                className="px-6 py-2 bg-saffron-600 text-white rounded-xl hover:bg-saffron-700 disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : `Import ${previewTx.length}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showManual && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-temple-800 mb-6">Add Manual Transaction</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-temple-400">Date</label>
                  <input type="date" className="w-full mt-1 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-saffron-500" value={manualDate} onChange={e => setManualDate(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-temple-400">Type</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-xl focus:ring-2" value={manualType} onChange={(e: any) => { setManualType(e.target.value); setManualCatId(""); setManualSubcatId(""); }}>
                    <option value="Expense">Expense</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Transfer">Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-temple-400">{manualType === 'Transfer' ? 'From Bank Account' : 'Bank Account'}</label>
                <select className="w-full mt-1 px-3 py-2 border rounded-xl focus:ring-2" value={manualBankId} onChange={e => setManualBankId(e.target.value)}>
                  {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {manualType === 'Transfer' && (
                <div>
                  <label className="text-xs font-semibold text-sky-500">To Bank Account</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-xl bg-sky-50 focus:ring-2" value={manualTransferToId} onChange={e => setManualTransferToId(e.target.value)}>
                    <option value="">Select Destination...</option>
                    {bankAccounts.filter(a => a.id !== manualBankId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-temple-400">Amount</label>
                <input type="number" step="0.01" className="w-full mt-1 px-3 py-2 border rounded-xl focus:ring-2" value={manualAmount} onChange={e => setManualAmount(e.target.value)} placeholder="0.00" />
              </div>

              {manualType !== 'Transfer' && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-temple-400">Category</label>
                    <select className="w-full mt-1 px-2 py-2 border rounded-xl text-sm" value={manualCatId} onChange={e => { setManualCatId(e.target.value); setManualSubcatId(""); }}>
                      <option value="">Uncategorized</option>
                      {filteredTypeCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-temple-400">Subcategory</label>
                    <select className="w-full mt-1 px-2 py-2 border rounded-xl text-sm" value={manualSubcatId} onChange={e => setManualSubcatId(e.target.value)} disabled={!activeManualCat || activeManualCat.subcategories.length === 0}>
                      <option value="">None</option>
                      {activeManualCat?.subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-temple-400">Description / Memo</label>
                <input type="text" className="w-full mt-1 px-3 py-2 border rounded-xl focus:ring-2" value={manualDesc} onChange={e => setManualDesc(e.target.value)} />
              </div>

            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowManual(false)} className="px-5 py-2 hover:bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={saveManualTransaction} className="px-5 py-2 bg-saffron-600 text-white rounded-xl shadow-sm hover:bg-saffron-700">Save Transaction</button>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">{error}</div>
      ) : (
        <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
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
                      <td className="px-6 py-4 text-sm font-medium text-temple-700 whitespace-nowrap">{tx.date}</td>
                      <td className="px-6 py-4 text-sm text-temple-600 whitespace-nowrap">{tx.bank_account?.name || "Unknown Bank"}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-temple-800 line-clamp-1">{tx.description || "No Description"}</p>
                        {tx.bank_transaction_id && <p className="text-xs text-temple-400 font-mono mt-0.5" title="Bank ID">{tx.bank_transaction_id}</p>}
                      </td>
                      <td className="px-6 py-4 min-w-[280px]">
                        {tx.type === 'Transfer' ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded w-max bg-blue-100 text-blue-700">Transfer</span>
                            <span className="text-sm text-temple-500 italic">Inter-account Transfer</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded w-max ${
                              tx.type === 'Revenue' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>{tx.type}</span>
                            
                            {editingTxId === tx.id ? (
                              <div className="flex items-center gap-2 mt-1 -ml-1">
                                <select 
                                  value={editCatId} onChange={e => { setEditCatId(e.target.value); setEditSubcatId(""); }}
                                  className="px-2 py-1 border rounded text-xs bg-white focus:ring-1 focus:outline-none"
                                >
                                  <option value="">Uncategorized</option>
                                  {categories.filter(c => c.type === tx.type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select 
                                  value={editSubcatId} onChange={e => setEditSubcatId(e.target.value)}
                                  disabled={!activeEditCat || activeEditCat.subcategories.length === 0}
                                  className="px-2 py-1 border rounded text-xs bg-white focus:ring-1 focus:outline-none w-24"
                                >
                                  <option value="">None</option>
                                  {activeEditCat?.subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <button onClick={() => saveCategoryEdit(tx.id)} className="p-1 px-2 bg-saffron-600 text-white rounded text-xs hover:bg-saffron-700 shadow-sm ml-1">Save</button>
                                <button onClick={() => setEditingTxId(null)} className="p-1 text-temple-400 hover:text-temple-600">✕</button>
                              </div>
                            ) : (
                              <div 
                                className="text-sm text-temple-600 cursor-pointer hover:bg-saffron-100 px-1 -mx-1 rounded transition-colors group/cat flex items-center gap-2"
                                onClick={() => startCategoryEdit(tx)}
                              >
                                {tx.category ? `${tx.category.name} ${tx.subcategory ? `> ${tx.subcategory.name}` : ''}` : <span className="text-rose-500 font-medium">Uncategorized / Click to Edit</span>}
                                <svg className="w-3 h-3 text-saffron-400 opacity-0 group-hover/cat:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className={`font-semibold ${tx.type === 'Revenue' ? 'text-emerald-600' : tx.type === 'Expense' ? 'text-rose-600' : 'text-blue-600'}`}>
                          {tx.type === 'Expense' ? '-' : tx.type === 'Revenue' ? '+' : Number(tx.amount) < 0 ? '-' : '+'}
                          {formatCurrency(Math.abs(Number(tx.amount)))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button onClick={() => handleDelete(tx.id)} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-opacity p-2" title="Delete Transaction">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
