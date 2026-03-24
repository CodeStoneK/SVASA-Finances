"use client";

import { YearEndReport } from "./components/YearEndReport";
import { AcknowledgementReport } from "./components/AcknowledgementReport";
import { useState } from "react";

export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState<"yearend" | "acknowledgement">("yearend");

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/70 backdrop-blur-sm border border-saffron-200/50 rounded-3xl p-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-temple-800">Reports</h1>
          <p className="text-temple-500 mt-1">Generate year-end summaries and acknowledgement letters</p>
        </div>

        <div className="flex items-center gap-4">
          <label htmlFor="year-select" className="text-sm font-semibold text-temple-700">
            Reporting Year:
          </label>
          <div className="relative">
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none pl-6 pr-12 py-3 bg-white border-2 border-saffron-200 rounded-xl text-lg font-bold text-temple-800 focus:border-saffron-400 focus:ring-4 focus:ring-saffron-200/50 transition-all shadow-sm outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-saffron-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b-2 border-saffron-100">
        <button
          onClick={() => setActiveTab("yearend")}
          className={`pb-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[2px] ${
            activeTab === "yearend"
              ? "text-saffron-600 border-saffron-600"
              : "text-temple-400 border-transparent hover:text-temple-600"
          }`}
        >
          Year-End Summary
        </button>
        <button
          onClick={() => setActiveTab("acknowledgement")}
          className={`pb-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[2px] ${
            activeTab === "acknowledgement"
              ? "text-saffron-600 border-saffron-600"
              : "text-temple-400 border-transparent hover:text-temple-600"
          }`}
        >
          Special Acknowledgements
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[50vh]">
        {activeTab === "yearend" && <YearEndReport year={selectedYear} />}
        {activeTab === "acknowledgement" && <AcknowledgementReport year={selectedYear} />}
      </div>
    </div>
  );
}
