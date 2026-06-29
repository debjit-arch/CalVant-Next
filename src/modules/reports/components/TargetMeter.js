/**
 * ─────────────────────────────────────────────────────────────────────────────
 * WIDGET: TargetMeter
 * ─────────────────────────────────────────────────────────────────────────────
 * Horizontal progress bar showing current value vs a user-defined target.
 *
 * Props from KpiWrapper:
 *   kpiConfig.title          – label
 *   kpiConfig.props.target   – the 100% goal value
 *   kpiConfig.props.extractor
 *   kpiConfig.color          – Tailwind colour token
 *
 *   resolvedData.value       – current value
 *   comparisonData.value     – previous period value (optional)
 *   loading                  – boolean
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";

const BAR_COLORS = {
  rose:    { bar: "bg-gradient-to-r from-rose-400  to-rose-600",    text: "text-rose-600"    },
  orange:  { bar: "bg-gradient-to-r from-orange-400 to-orange-600", text: "text-orange-600"  },
  amber:   { bar: "bg-gradient-to-r from-amber-400 to-amber-600",   text: "text-amber-600"   },
  emerald: { bar: "bg-gradient-to-r from-emerald-400 to-emerald-600",text: "text-emerald-600"},
  blue:    { bar: "bg-gradient-to-r from-blue-400  to-blue-600",    text: "text-blue-600"    },
  indigo:  { bar: "bg-gradient-to-r from-indigo-400 to-indigo-600", text: "text-indigo-600"  },
  violet:  { bar: "bg-gradient-to-r from-violet-400 to-violet-600", text: "text-violet-600"  },
  slate:   { bar: "bg-gradient-to-r from-slate-400 to-slate-600",   text: "text-slate-600"   },
};

const TargetMeter = memo(function TargetMeter({ kpiConfig, resolvedData, comparisonData, loading }) {
  const { title, color = "indigo", props = {} } = kpiConfig;
  const { target } = props;
  const { value } = resolvedData ?? {};
  const compValue = comparisonData?.value ?? null;

  const pct = useMemo(() => {
    if (value == null || !target) return 0;
    return Math.min(100, Math.max(0, Math.round((Number(value) / Number(target)) * 100)));
  }, [value, target]);

  const compPct = useMemo(() => {
    if (compValue == null || !target) return null;
    return Math.min(100, Math.max(0, Math.round((Number(compValue) / Number(target)) * 100)));
  }, [compValue, target]);

  const { bar: barClass, text: textClass } = BAR_COLORS[color] ?? BAR_COLORS.indigo;

  // Colour the label by proximity to target
  const statusColor =
    pct >= 100 ? "text-emerald-600 bg-emerald-50" :
    pct >= 75  ? "text-indigo-600 bg-indigo-50"   :
    pct >= 50  ? "text-amber-600 bg-amber-50"      :
                 "text-rose-600 bg-rose-50";

  return (
    <motion.div
      whileHover={{ scale: 1.015, translateY: -1 }}
      transition={{ duration: 0.2 }}
      className="h-full bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-4 shadow-sm hover:shadow-md flex flex-col gap-3 transition-shadow"
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${barClass.replace("bg-gradient-to-r ", "")} flex items-center justify-center shadow-sm flex-shrink-0`}>
            <Target size={14} className="text-white" />
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">{title}</span>
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
          {pct}%
        </span>
      </div>

      {/* Values */}
      {loading ? (
        <div className="h-5 w-24 bg-slate-100 rounded animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${textClass}`}>{value ?? "—"}</span>
          {target && (
            <span className="text-sm text-slate-400 font-medium">/ {target}</span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: loading ? "0%" : `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className={`h-full rounded-full ${barClass}`}
          />
        </div>
        {compPct !== null && !loading && (
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${compPct}%` }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                className="h-full rounded-full bg-slate-300"
              />
            </div>
            <span className="text-[10px] text-slate-400 flex-shrink-0">prev {compPct}%</span>
          </div>
        )}
      </div>

      {/* Foot labels */}
      {!loading && target && (
        <div className="flex items-center justify-between text-[10px] text-slate-400 -mt-1">
          <span>0</span>
          <span className={`font-semibold ${textClass}`}>Target: {target}</span>
        </div>
      )}
    </motion.div>
  );
});

export default TargetMeter;