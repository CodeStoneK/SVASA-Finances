"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { DevoteeSearchResult } from "@/lib/types";

interface DevoteeSearchProps {
  onSelect: (devotee: DevoteeSearchResult) => void;
  selectedDevotee: DevoteeSearchResult | null;
  onClear: () => void;
}

export function DevoteeSearch({ onSelect, selectedDevotee, onClear }: DevoteeSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DevoteeSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchDevotees = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("search_devotees", {
        search_query: searchQuery.trim(),
      });

      if (error) throw error;
      setResults(data || []);
      setIsOpen(true);
      setHighlightIndex(-1);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchDevotees(value), 150);
  };

  const handleSelect = (devotee: DevoteeSearchResult) => {
    onSelect(devotee);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (selectedDevotee) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-saffron-50 to-saffron-100/50 border-2 border-saffron-300 rounded-2xl">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
          {selectedDevotee.first_name[0]}
          {selectedDevotee.last_name[0]}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-temple-800 text-lg">{selectedDevotee.display_name}</p>
          <div className="flex gap-4 text-sm text-temple-500">
            {selectedDevotee.phone && <span>📞 {selectedDevotee.phone}</span>}
            {selectedDevotee.email && <span>✉️ {selectedDevotee.email}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="p-2 text-temple-400 hover:text-ruby-500 hover:bg-ruby-500/10 rounded-xl transition-all"
          aria-label="Clear selection"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-temple-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          id="devotee-search"
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search by name or phone number..."
          className="w-full pl-12 pr-12 py-4 text-lg bg-white/80 backdrop-blur-sm border-2 border-temple-200 rounded-2xl focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all placeholder:text-temple-300 text-temple-800"
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-saffron-300 border-t-saffron-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-saffron-200 rounded-2xl shadow-2xl shadow-saffron-200/30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {results.map((devotee, idx) => (
            <button
              key={devotee.id}
              type="button"
              onClick={() => handleSelect(devotee)}
              onMouseEnter={() => setHighlightIndex(idx)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                idx === highlightIndex
                  ? "bg-saffron-50"
                  : "hover:bg-saffron-50/50"
              } ${idx > 0 ? "border-t border-saffron-100/50" : ""}`}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-saffron-300 to-saffron-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {devotee.first_name[0]}
                {devotee.last_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-temple-800 truncate">
                  {devotee.display_name}
                </p>
                <div className="flex gap-3 mt-1 text-xs text-temple-400">
                  {devotee.phone && <span>📞 {devotee.phone}</span>}
                  {devotee.email && <span className="truncate">✉️ {devotee.email}</span>}
                  {(devotee.city || devotee.state) && (
                    <span className="truncate">
                      📍 {[devotee.city, devotee.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && query.trim().length > 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-temple-200 rounded-2xl shadow-xl p-6 text-center">
          <p className="text-temple-500">No devotees found for &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-temple-400 mt-1">Try a different name or phone number</p>
        </div>
      )}
    </div>
  );
}
