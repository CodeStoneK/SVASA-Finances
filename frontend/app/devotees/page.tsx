"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { Devotee } from "@/lib/types";

export default function DevoteesPage() {
  const [devotees, setDevotees] = useState<Devotee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Devotee>>({});

  const fetchDevotees = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("devotees")
        .select("*")
        .order("last_name", { ascending: true })
        .order("first_name", { ascending: true });

      if (error) throw error;
      setDevotees(data || []);
    } catch (err) {
      console.error("Failed to fetch devotees:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevotees();
  }, [fetchDevotees]);

  const filteredDevotees = devotees.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.first_name.toLowerCase().includes(q) ||
      d.last_name.toLowerCase().includes(q) ||
      (d.phone && d.phone.includes(q)) ||
      (d.email && d.email.toLowerCase().includes(q)) ||
      (d.city && d.city.toLowerCase().includes(q))
    );
  });

  const startEdit = (devotee: Devotee) => {
    setEditingId(devotee.id);
    setEditForm({ ...devotee });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const { error } = await supabase
        .from("devotees")
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          name_to_acknowledge: editForm.name_to_acknowledge,
          email: editForm.email,
          phone: editForm.phone,
          address_line1: editForm.address_line1,
          city: editForm.city,
          state: editForm.state,
          zip_code: editForm.zip_code,
        })
        .eq("id", editingId);

      if (error) throw error;
      setEditingId(null);
      setEditForm({});
      fetchDevotees();
    } catch (err) {
      console.error("Failed to update devotee:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-temple-800">Devotees</h1>
          <p className="text-temple-500 mt-1">{filteredDevotees.length} devotees</p>
        </div>
        <Link
          href="/devotees/new"
          id="btn-new-devotee"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-semibold rounded-2xl shadow-lg shadow-saffron-300/50 hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Devotee
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-temple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          id="devotees-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, phone, email, or city..."
          className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-temple-200 rounded-xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all text-temple-800 placeholder:text-temple-300"
        />
      </div>

      {/* Devotees Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-saffron-200 border-t-saffron-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDevotees.map((devotee) => (
            <div
              key={devotee.id}
              className="bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
            >
              {editingId === devotee.id ? (
                /* Edit Mode */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={editForm.first_name || ""}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="px-3 py-2 border-2 border-temple-200 rounded-lg text-sm focus:border-saffron-400 text-temple-800"
                      placeholder="First Name"
                    />
                    <input
                      value={editForm.last_name || ""}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="px-3 py-2 border-2 border-temple-200 rounded-lg text-sm focus:border-saffron-400 text-temple-800"
                      placeholder="Last Name"
                    />
                  </div>
                  <input
                    value={editForm.name_to_acknowledge || ""}
                    onChange={(e) => setEditForm({ ...editForm, name_to_acknowledge: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-temple-200 rounded-lg text-sm focus:border-saffron-400 text-temple-800"
                    placeholder="Name to Acknowledge"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={editForm.phone || ""}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="px-3 py-2 border-2 border-temple-200 rounded-lg text-sm focus:border-saffron-400 text-temple-800"
                      placeholder="Phone"
                    />
                    <input
                      value={editForm.email || ""}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="px-3 py-2 border-2 border-temple-200 rounded-lg text-sm focus:border-saffron-400 text-temple-800"
                      placeholder="Email"
                    />
                  </div>
                  <input
                    value={editForm.address_line1 || ""}
                    onChange={(e) => setEditForm({ ...editForm, address_line1: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-temple-200 rounded-lg text-sm focus:border-saffron-400 text-temple-800"
                    placeholder="Address"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      value={editForm.city || ""}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="px-3 py-2 border-2 border-temple-200 rounded-lg text-sm focus:border-saffron-400 text-temple-800"
                      placeholder="City"
                    />
                    <input
                      value={editForm.state || ""}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className="px-3 py-2 border-2 border-temple-200 rounded-lg text-sm focus:border-saffron-400 text-temple-800"
                      placeholder="State"
                    />
                    <input
                      value={editForm.zip_code || ""}
                      onChange={(e) => setEditForm({ ...editForm, zip_code: e.target.value })}
                      className="px-3 py-2 border-2 border-temple-200 rounded-lg text-sm focus:border-saffron-400 text-temple-800"
                      placeholder="Zip"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={saveEdit} className="flex-1 py-2 bg-saffron-500 text-white rounded-lg text-sm font-medium hover:bg-saffron-600 transition-colors">
                      Save
                    </button>
                    <button onClick={cancelEdit} className="flex-1 py-2 bg-temple-100 text-temple-600 rounded-lg text-sm font-medium hover:bg-temple-200 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-saffron-300 to-saffron-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                      {devotee.first_name[0]}{devotee.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-temple-800 text-lg">
                        {devotee.first_name} {devotee.last_name}
                      </h3>
                      {devotee.name_to_acknowledge && (
                        <p className="text-sm text-temple-500 italic truncate">
                          &ldquo;{devotee.name_to_acknowledge}&rdquo;
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => startEdit(devotee)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-temple-400 hover:text-saffron-600 hover:bg-saffron-50 rounded-lg transition-all"
                      aria-label="Edit devotee"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm">
                    {devotee.phone && (
                      <div className="flex items-center gap-2 text-temple-500">
                        <span>📞</span> {devotee.phone}
                      </div>
                    )}
                    {devotee.email && (
                      <div className="flex items-center gap-2 text-temple-500 truncate">
                        <span>✉️</span> {devotee.email}
                      </div>
                    )}
                    {devotee.city && (
                      <div className="flex items-center gap-2 text-temple-500">
                        <span>📍</span> {devotee.city}, {devotee.state} {devotee.zip_code}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
          {filteredDevotees.length === 0 && (
            <div className="col-span-full py-12 text-center text-temple-400">
              No devotees found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
