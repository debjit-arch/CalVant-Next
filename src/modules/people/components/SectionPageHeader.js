"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";

/**
 * SectionPageHeader — the standardized "we came from the dashboard" header
 * used by every People sub-page (Directory, Screening, Documents, Tickets,
 * Learning, Offboarding), mirroring the header pattern already used by the
 * Risk and Documentation (Policies) modules' dashboards and sub-screens.
 *
 * Keeping this in one place is the point: every People screen gets the same
 * back button, icon treatment, title/description layout, and optional
 * right-side slot (segmented tabs, refresh button, a primary action) instead
 * of each screen inventing its own header markup.
 */
export default function SectionPageHeader({
  icon: Icon,
  iconGradient = "from-violet-500 to-violet-600",
  title,
  description,
  backHref = "/people",
  backLabel = "Back to Dashboard",
  onRefresh,
  right,
  children,
}) {
  const router = useRouter();

  return (
    <div className="mb-2">
      <motion.button
        onClick={() => router.push(backHref)}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        // Same blue gradient "Back to Dashboard" button as the Action Plan (Task) page.
        className="mb-3 inline-flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-semibold text-white rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(37,99,235,0.35)] transition-all"
      >
        <ArrowLeft size={14} />
        {backLabel}
      </motion.button>

      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl shadow-md p-4 lg:p-5"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            {Icon && (
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-r ${iconGradient} flex items-center justify-center shadow-lg flex-shrink-0`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-slate-800 truncate">{title}</h1>
              {description && (
                <p className="text-sm text-slate-500 mt-0.5 max-w-2xl">{description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Refresh"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 flex items-center justify-center"
              >
                <RefreshCw size={15} className="text-slate-500" />
              </button>
            )}
            {right}
          </div>
        </div>

        {children && <div className="mt-4">{children}</div>}
      </motion.header>
    </div>
  );
}

/**
 * SegmentedTabs — small pill tab switcher used by pages that host more than
 * one "entry point" through one underlying screen (Employment Documents:
 * Terms / NDA / Post-termination, Tickets: Disciplinary / Event report) —
 * the same "one screen, several entry points" idea the MLD screen uses for
 * Master List / Upload / View.
 */
export function SegmentedTabs({ tabs, active, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 bg-slate-100 rounded-xl p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-all ${
            active === t.key
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
