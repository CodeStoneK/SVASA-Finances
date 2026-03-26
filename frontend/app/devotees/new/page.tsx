"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewDevoteePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    name_to_acknowledge: "",
    email: "",
    phone: "",
    address_line1: "",
    city: "",
    state: "",
    zip_code: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("First name and last name are required");
      return;
    }

    if (!form.phone.trim() && !form.email.trim()) {
      setError("Either a phone number or an email address is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("devotees").insert({
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim() || null,
        last_name: form.last_name.trim(),
        name_to_acknowledge: form.name_to_acknowledge.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address_line1: form.address_line1.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        zip_code: form.zip_code.trim() || null,
      });

      if (insertError) throw insertError;
      router.push("/devotees");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add devotee";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-temple-800">Add Devotee</h1>
        <p className="text-temple-500 mt-1">Register a new devotee in the system</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-ruby-500/10 border border-ruby-500/20 rounded-2xl text-ruby-600">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Name Fields */}
        <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-temple-700 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="first-name" className="block text-xs font-medium text-temple-500 mb-1.5">
                First Name <span className="text-ruby-500">*</span>
              </label>
              <input
                id="first-name"
                type="text"
                value={form.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                className="w-full px-4 py-3 bg-white/80 border-2 border-temple-200 rounded-xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-800"
                required
              />
            </div>
            <div>
              <label htmlFor="middle-name" className="block text-xs font-medium text-temple-500 mb-1.5">
                Middle Name
              </label>
              <input
                id="middle-name"
                type="text"
                value={form.middle_name}
                onChange={(e) => updateField("middle_name", e.target.value)}
                className="w-full px-4 py-3 bg-white/80 border-2 border-temple-200 rounded-xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-800"
              />
            </div>
            <div>
              <label htmlFor="last-name" className="block text-xs font-medium text-temple-500 mb-1.5">
                Last Name <span className="text-ruby-500">*</span>
              </label>
              <input
                id="last-name"
                type="text"
                value={form.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                className="w-full px-4 py-3 bg-white/80 border-2 border-temple-200 rounded-xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-800"
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="name-to-acknowledge" className="block text-xs font-medium text-temple-500 mb-1.5">
              Name to Acknowledge <span className="text-temple-300">(for receipts)</span>
            </label>
            <input
              id="name-to-acknowledge"
              type="text"
              value={form.name_to_acknowledge}
              onChange={(e) => updateField("name_to_acknowledge", e.target.value)}
              placeholder="e.g., Srinivas & Lakshmi Reddy Family"
              className="w-full px-4 py-3 bg-white/80 border-2 border-temple-200 rounded-xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-800 placeholder:text-temple-300"
            />
          </div>
        </div>

        {/* Contact Fields */}
        <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-temple-700 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-temple-500 mb-1.5">Phone</label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="972-555-0101"
                className="w-full px-4 py-3 bg-white/80 border-2 border-temple-200 rounded-xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-800 placeholder:text-temple-300"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-temple-500 mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 bg-white/80 border-2 border-temple-200 rounded-xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-800 placeholder:text-temple-300"
              />
            </div>
          </div>
        </div>

        {/* Address Fields */}
        <div className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-temple-700 mb-4">Address</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-xs font-medium text-temple-500 mb-1.5">Street Address</label>
              <input
                id="address"
                type="text"
                value={form.address_line1}
                onChange={(e) => updateField("address_line1", e.target.value)}
                placeholder="1234 Oak Valley Dr"
                className="w-full px-4 py-3 bg-white/80 border-2 border-temple-200 rounded-xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-800 placeholder:text-temple-300"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-xs font-medium text-temple-500 mb-1.5">City</label>
                <input
                  id="city"
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 border-2 border-temple-200 rounded-xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-800"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-xs font-medium text-temple-500 mb-1.5">State</label>
                <input
                  id="state"
                  type="text"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 border-2 border-temple-200 rounded-xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-800"
                />
              </div>
              <div>
                <label htmlFor="zip" className="block text-xs font-medium text-temple-500 mb-1.5">Zip Code</label>
                <input
                  id="zip"
                  type="text"
                  value={form.zip_code}
                  onChange={(e) => updateField("zip_code", e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 border-2 border-temple-200 rounded-xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            id="btn-save-devotee"
            className="flex-1 py-4 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white text-lg font-bold rounded-2xl shadow-lg shadow-saffron-300/50 hover:shadow-xl hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Devotee"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/devotees")}
            className="px-8 py-4 bg-temple-100 text-temple-600 text-lg font-medium rounded-2xl hover:bg-temple-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
