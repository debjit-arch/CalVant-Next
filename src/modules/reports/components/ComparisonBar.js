/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ComparisonBar.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Toggle + date pickers for the comparison window.
 * Default: today − 1 year  →  today
 *
 * Props:
 *   value     { enabled, from, to }
 *   onChange  (newValue) => void
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitCompareArrows, Calendar } from "lucide-react";

function defaultFrom() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "6m", days: 183 },
  { label: "1y", days: 365 },
];

function daysAgoStr(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function ComparisonBar({ value, onChange }) {
  const enabled = value?.enabled ?? false;
  const from = value?.from ?? defaultFrom();
  const to = value?.to ?? todayStr();

  const toggle = () => {
    onChange({
      enabled: !enabled,
      from: value?.from ?? defaultFrom(),
      to: value?.to ?? todayStr(),
    });
  };

  const setFrom = (v) => onChange({ ...value, from: v });
  const setTo = (v) => onChange({ ...value, to: v });

  const applyPreset = (days) => {
    onChange({ enabled: true, from: daysAgoStr(days), to: todayStr() });
  };

  // detect which preset is currently active (if any)
  const activePreset =
    PRESETS.find((p) => from === daysAgoStr(p.days) && to === todayStr())
      ?.label ?? null;

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

      {/* date pickers (only when enabled) */}
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
              {/* quick presets */}
              <div className="flex items-center gap-1 flex-wrap">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p.days)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all
          ${
            activePreset === p.label
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
              <button
                onClick={() =>
                  onChange({
                    enabled: true,
                    from: defaultFrom(),
                    to: todayStr(),
                  })
                }
                className="text-xs text-violet-500 hover:text-violet-700 font-medium px-2 py-1
                  rounded-lg hover:bg-violet-50 transition-all"
              >
                Reset to 1 year
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
