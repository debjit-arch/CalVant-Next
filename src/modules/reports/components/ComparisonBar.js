/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ComparisonBar.jsx  (v2 — named week-based presets)
 * ─────────────────────────────────────────────────────────────────────────────
 * Toggle + date pickers for the comparison window.
 *
 * Presets (all anchored on "yesterday" as the window end date):
 *   • Previous Week        → yesterday-6  .. yesterday
 *   • Same Week Last Month → (yesterday-6 .. yesterday) shifted back 1 month
 *   • Same Week Last Year  → (yesterday-6 .. yesterday) shifted back 1 year
 *
 * Default (when first enabled, no presets picked): Previous Week.
 *
 * Props:
 *   value     { enabled, from, to }
 *   onChange  (newValue) => void
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompareArrows, Calendar } from "lucide-react";

// ─── date helpers ─────────────────────────────────────────────────────────────
function toISO(d) {
  return d.toISOString().slice(0, 10);
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

function addMonths(d, n) {
  const copy = new Date(d);
  copy.setMonth(copy.getMonth() + n);
  return copy;
}

function addYears(d, n) {
  const copy = new Date(d);
  copy.setFullYear(copy.getFullYear() + n);
  return copy;
}

// Previous Week: yesterday-6 .. yesterday
function previousWeekRange() {
  const end = yesterday();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return { from: toISO(start), to: toISO(end) };
}

// Same Week Last Month: previous-week range, shifted back one month
function sameWeekLastMonthRange() {
  const end = addMonths(yesterday(), -1);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return { from: toISO(start), to: toISO(end) };
}

// Same Week Last Year: previous-week range, shifted back one year
function sameWeekLastYearRange() {
  const end = addYears(yesterday(), -1);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return { from: toISO(start), to: toISO(end) };
}

const PRESETS = [
  { key: "prev_week", label: "Previous Week", getRange: previousWeekRange },
  { key: "same_week_last_month", label: "Same Week Last Month", getRange: sameWeekLastMonthRange },
  { key: "same_week_last_year", label: "Same Week Last Year", getRange: sameWeekLastYearRange },
];

function defaultRange() {
  return previousWeekRange();
}

export default function ComparisonBar({ value, onChange }) {
  const enabled = value?.enabled ?? false;
  const from = value?.from ?? defaultRange().from;
  const to = value?.to ?? defaultRange().to;

  const toggle = () => {
    if (enabled) {
      onChange({ ...value, enabled: false });
      return;
    }
    const range = value?.from && value?.to ? { from: value.from, to: value.to } : defaultRange();
    onChange({ enabled: true, ...range });
  };

  const setFrom = (v) => onChange({ ...value, from: v });
  const setTo = (v) => onChange({ ...value, to: v });

  const applyPreset = (preset) => {
    const range = preset.getRange();
    onChange({ enabled: true, ...range });
  };

  // detect which preset is currently active (if any)
  const activePresetKey = useMemo(() => {
    const found = PRESETS.find((p) => {
      const r = p.getRange();
      return r.from === from && r.to === to;
    });
    return found?.key ?? null;
  }, [from, to]);

  const rangeLabel = useMemo(() => {
    try {
      const f = new Date(from).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const t = new Date(to).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      return `${f} – ${t}`;
    } catch {
      return "";
    }
  }, [from, to]);

  return (
    <div className="flex flex-col gap-0">
      {/* toggle row */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
            border transition-all duration-200
            ${
              enabled
                ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
            }`}
        >
          <GitCompareArrows size={12} />
          Compare
          {enabled && (
            <span className="ml-1 bg-white/20 rounded-md px-1.5 py-0.5 text-[10px]">
              {rangeLabel}
            </span>
          )}
        </button>
      </div>

      {/* presets + date pickers (only when enabled) */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100 flex-wrap">
              <Calendar size={12} className="text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-500 font-medium">
                Comparison window
              </span>
              {/* named presets */}
              <div className="flex items-center gap-1 flex-wrap">
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => applyPreset(p)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border transition-all
          ${
            activePresetKey === p.key
              ? "bg-violet-600 text-white border-violet-600"
              : "bg-white text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600"
          }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-slate-400">From</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white
                    text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300
                    focus:border-violet-400 transition-all"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-slate-400">To</label>
                <input
                  type="date"
                  value={to}
                  min={from}
                  onChange={(e) => setTo(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white
                    text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300
                    focus:border-violet-400 transition-all"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}