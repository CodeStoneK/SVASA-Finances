"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DevoteeSearch } from "@/components/DevoteeSearch";
import type { DevoteeSearchResult, PaymentMethod, Donation, Devotee } from "@/lib/types";
import { PAYMENT_METHODS } from "@/lib/types";
import { downloadReceipt } from "@/lib/receipt";

import { PaymentMethodIcon } from "@/components/PaymentMethodIcon";

export default function NewDonationPage() {
  const router = useRouter();
  const [selectedDevotee, setSelectedDevotee] = useState<DevoteeSearchResult | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [instrumentNumber, setInstrumentNumber] = useState("");
  const [donationDate, setDonationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [savedDonation, setSavedDonation] = useState<Donation | null>(null);
  const [savedDevotee, setSavedDevotee] = useState<Devotee | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedDevotee) {
      setError("Please select a devotee");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!paymentMethod) {
      setError("Please select a payment method");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: insertedDonation, error: insertError } = await supabase
        .from("donations")
        .insert({
          devotee_id: selectedDevotee.id,
          amount: Number(amount),
          payment_method: paymentMethod,
          instrument_number: instrumentNumber || null,
          donation_date: donationDate,
          notes: notes || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Fetch full devotee record for receipt (includes address)
      const { data: fullDevotee } = await supabase
        .from("devotees")
        .select("*")
        .eq("id", selectedDevotee.id)
        .single();

      // Get a serial number (count of all donations)
      const { count } = await supabase
        .from("donations")
        .select("id", { count: "exact", head: true });

      const donation = insertedDonation as Donation;
      const devotee = fullDevotee as Devotee;
      const serialNo = count || 1;

      setSavedDonation(donation);
      setSavedDevotee(devotee);

      // Auto-download receipt
      try {
        downloadReceipt(donation, devotee, serialNo);
      } catch (pdfErr) {
        console.warn("Receipt download failed:", pdfErr);
      }

      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record donation";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [51, 101, 116, 251, 501, 1001, 1116];

  const handleRedownloadReceipt = () => {
    if (savedDonation && savedDevotee) {
      downloadReceipt(savedDonation, savedDevotee, 0);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white/70 backdrop-blur-sm border border-emerald-200 rounded-3xl p-12 shadow-lg">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-temple-800 mb-2">Donation Recorded!</h2>
          <p className="text-temple-500">
            {selectedDevotee?.display_name} — {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount))}
          </p>
          <p className="text-sm text-emerald-600 mt-2">📄 Receipt downloaded automatically</p>
          <div className="flex gap-3 mt-6 justify-center">
            <button
              onClick={handleRedownloadReceipt}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-saffron-300 text-saffron-700 font-medium rounded-xl hover:bg-saffron-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Receipt Again
            </button>
            <button
              onClick={() => router.push("/donations")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              View All Donations →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-temple-800">New Donation</h1>
        <p className="text-temple-500 mt-1">Record a donation from a devotee</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-ruby-500/10 border border-ruby-500/20 rounded-2xl text-ruby-600">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Devotee Search */}
        <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl p-6 shadow-sm relative z-50">
          <label className="block text-sm font-semibold text-temple-700 mb-3">
            Select Devotee <span className="text-ruby-500">*</span>
          </label>
          <DevoteeSearch
            selectedDevotee={selectedDevotee}
            onSelect={setSelectedDevotee}
            onClear={() => setSelectedDevotee(null)}
          />
        </div>

        {/* Amount */}
        <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl p-6 shadow-sm">
          <label htmlFor="donation-amount" className="block text-sm font-semibold text-temple-700 mb-3">
            Amount <span className="text-ruby-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-temple-400 font-medium">$</span>
            <input
              id="donation-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-4 text-2xl font-semibold bg-white/80 border-2 border-temple-200 rounded-2xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-800 placeholder:text-temple-200"
            />
          </div>
          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {quickAmounts.map((qa) => (
              <button
                key={qa}
                type="button"
                onClick={() => setAmount(String(qa))}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  Number(amount) === qa
                    ? "bg-saffron-500 text-white shadow-md"
                    : "bg-saffron-50 text-saffron-700 hover:bg-saffron-100"
                }`}
              >
                ${qa}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl p-6 shadow-sm">
          <label className="block text-sm font-semibold text-temple-700 mb-3">
            Payment Method <span className="text-ruby-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                id={`payment-${method.toLowerCase().replace(/\s+/g, "-")}`}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  paymentMethod === method
                    ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-md shadow-saffron-300/50"
                    : "bg-white border-2 border-temple-200 text-temple-600 hover:border-saffron-300 hover:bg-saffron-50"
                }`}
              >
                <PaymentMethodIcon
                  method={method}
                  className={paymentMethod === method ? "w-5 h-5 text-white" : "w-5 h-5 text-temple-600"}
                />
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Details Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Instrument Number */}
          <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl p-6 shadow-sm">
            <label htmlFor="instrument-number" className="block text-sm font-semibold text-temple-700 mb-3">
              Reference / Check #
            </label>
            <input
              id="instrument-number"
              type="text"
              value={instrumentNumber}
              onChange={(e) => setInstrumentNumber(e.target.value)}
              placeholder="e.g., CHK-1234, ZEL-5678"
              className="w-full px-4 py-3 bg-white/80 border-2 border-temple-200 rounded-xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-800 placeholder:text-temple-300"
            />
          </div>

          {/* Donation Date */}
          <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl p-6 shadow-sm">
            <label htmlFor="donation-date" className="block text-sm font-semibold text-temple-700 mb-3">
              Donation Date
            </label>
            <input
              id="donation-date"
              type="date"
              value={donationDate}
              onChange={(e) => setDonationDate(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 border-2 border-temple-200 rounded-xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-800"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl p-6 shadow-sm">
          <label htmlFor="donation-notes" className="block text-sm font-semibold text-temple-700 mb-3">
            Notes
          </label>
          <textarea
            id="donation-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes about this donation..."
            className="w-full px-4 py-3 bg-white/80 border-2 border-temple-200 rounded-xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-800 placeholder:text-temple-300 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          id="btn-submit-donation"
          className="w-full py-4 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white text-lg font-bold rounded-2xl shadow-lg shadow-saffron-300/50 hover:shadow-xl hover:shadow-saffron-400/50 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Recording Donation...
            </span>
          ) : (
            "Record Donation"
          )}
        </button>
      </form>
    </div>
  );
}
