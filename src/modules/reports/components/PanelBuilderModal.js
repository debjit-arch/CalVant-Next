/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PanelBuilderModal.jsx  (v3 — category → visualization → configure → review)
 * ─────────────────────────────────────────────────────────────────────────────
 * Steps (new panel):
 * 0  Category        (KPI / Charts)
 * 1  Visualization   (Stat Card / Score Gauge / Target Meter
 * OR Line / Bar / Donut) — with mini preview
 * 2  Data config     (module, metric, duration, comparison, benchmarks)
 * 3  Review & save
 *
 * Template gallery, role-based suggestions, and all related dead code have
 * been removed completely. The modal always opens on Step 0 — Choose Category.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, GitCompareArrows } from "lucide-react";
import { AVAILABLE_EXTRACTORS } from "./dashboardSchema";

// ─── constants ────────────────────────────────────────────────────────────────

const PANEL_CATEGORIES = [
  { id: "kpi",   label: "KPI",    icon: "🔢", description: "Single-value visualizations" },
  { id: "chart", label: "Charts", icon: "📊", description: "Trend & analytical charts"    },
];

const COMPONENT_TYPES = [
  {
    category: "KPI",
    items: [
      { type: "StatCard",    label: "Stat Card",    icon: "🔢", hint: "Single number with trend indicator" },
      { type: "ScoreGauge",  label: "Score Gauge",  icon: "🎯", hint: "Circular gauge for 0–100 scores"    },
      { type: "TargetMeter", label: "Target Meter", icon: "📏", hint: "Progress bar toward a target value" },
    ],
  },
  {
    category: "Chart",
    items: [
      { type: "TrendLineChart",   label: "Line Chart", icon: "📈", hint: "Multi-series line with optional benchmarks" },
      { type: "TrendBarChart",    label: "Bar Chart",  icon: "📊", hint: "Grouped bars — great for comparisons"      },
      { type: "DonutStatusChart", label: "Donut",      icon: "🍩", hint: "Status / category breakdown"              },
    ],
  },
];

const TREND_TYPES = new Set(["TrendLineChart", "TrendBarChart"]);
const MAP_TYPES   = new Set(["DonutStatusChart", "DepartmentBreakdown"]);

const SERIES_COLORS = ["#6366f1","#ef4444","#10b981","#f59e0b","#3b82f6","#a855f7","#06b6d4","#f97316"];

const DURATION_PRESETS = [
  { key: "7d",     label: "7 Days"  },
  { key: "14d",    label: "14 Days" },
  { key: "90d",    label: "90 Days" },
  { key: "custom", label: "Custom"  },
];

// Mirrors DashboardEngine's panelSignature — two panels are "the same panel"
// if they're the same component type showing the same underlying data
// field(s), regardless of generated id/title.
function panelSignature(panel) {
  const props = panel.props ?? {};
  if (Array.isArray(props.series) && props.series.length) {
    const extractors = props.series.map((s) => s.extractor).filter(Boolean).sort().join("|");
    return `${panel.componentType}::${extractors}`;
  }
  return `${panel.componentType}::${props.extractor ?? ""}`;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StepDots({ current, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current  ? "bg-indigo-500 w-4" :
            i === current ? "bg-indigo-400 w-6" :
            "bg-slate-200 w-4"
          }`}
        />
      ))}
    </div>
  );
}

function FieldLabel({ children, hint }) {
  return (
    <div className="mb-1.5">
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{children}</span>
      {hint && <span className="ml-2 text-[11px] text-slate-400 normal-case font-normal">{hint}</span>}
    </div>
  );
}

function ExtractorSelect({ value, onChange, scalarOnly = false, placeholder = "Select a data field…" }) {
  const MAP_EXTRACTORS = new Set([
    "risks.byStatus","risks.byDepartment","audit.byStatus","audit.byDepartment",
    "tasks.byStatus","tasks.byDepartment","dpia.byStatus","dpia.byDepartment",
  ]);

  const filtered = scalarOnly
    ? AVAILABLE_EXTRACTORS.filter((e) => !MAP_EXTRACTORS.has(e.extractor))
    : AVAILABLE_EXTRACTORS;

  const groups = useMemo(() => {
    const map = {};
    for (const e of filtered) {
      const mod = e.extractor.split(".")[0];
      const key = mod.charAt(0).toUpperCase() + mod.slice(1);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return map;
  }, [filtered]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-sm text-slate-700
        focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all
        cursor-pointer appearance-none
        bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 fill%3D%22none%22 viewBox%3D%220 0 20 20%22%3E%3Cpath stroke%3D%22%236b7280%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22 stroke-width%3D%221.5%22 d%3D%22m6 8 4 4 4-4%22%2F%3E%3C%2Fsvg%3E')]
        bg-[position:right_0.5rem_center] bg-[size:1.25rem] pr-8"
    >
      <option value="" disabled>{placeholder}</option>
      {Object.entries(groups).map(([mod, items]) => (
        <optgroup key={mod} label={`── ${mod}`}>
          {items.map((e) => (
            <option key={e.extractor} value={e.extractor}>{e.label}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function SeriesRow({ series, index, onChange, onRemove, canRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 space-y-2"
    >
      <div className="flex gap-2 items-center">
        <input
          value={series.label}
          onChange={(e) => onChange(index, "label", e.target.value)}
          placeholder="Series label"
          className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
        <div className="relative flex items-center gap-1">
          <div className="w-6 h-6 rounded-md border-2 border-white shadow-sm cursor-pointer" style={{ backgroundColor: series.color }} />
          <input
            type="color" value={series.color}
            onChange={(e) => onChange(index, "color", e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </div>
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="w-6 h-6 rounded-full bg-rose-100 text-rose-500 hover:bg-rose-200 flex items-center justify-center text-sm font-bold"
          >
            ×
          </button>
        )}
      </div>
      <ExtractorSelect
        value={series.extractor}
        onChange={(v) => {
          onChange(index, "extractor", v);
          if (!series.key || series.key.startsWith("series")) onChange(index, "key", v.replace(/\./g, "_"));
          const found = AVAILABLE_EXTRACTORS.find((e) => e.extractor === v);
          const defaultLabel = `Series ${index + 1}`;
          if (found && (!series.label || series.label === defaultLabel || series.label === series.extractor)) {
            onChange(index, "label", found.label);
          }
        }}
        placeholder="Select data field…"
      />
    </motion.div>
  );
}

function BenchmarkRow({ bm, index, onChange, onRemove }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={bm.value}
        onChange={(e) => onChange(index, "value", Number(e.target.value))}
        placeholder="Value"
        className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 text-center bg-white"
      />
      <input
        value={bm.label}
        onChange={(e) => onChange(index, "label", e.target.value)}
        placeholder="Label (e.g. Target)"
        className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
      />
      <div className="relative w-7 h-7 flex-shrink-0">
        <div className="w-full h-full rounded-md border-2 border-white shadow-sm" style={{ backgroundColor: bm.color }} />
        <input type="color" value={bm.color} onChange={(e) => onChange(index, "color", e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
      </div>
      <button onClick={() => onRemove(index)} className="text-slate-400 hover:text-rose-500 transition-colors">
        <Minus size={13} />
      </button>
    </div>
  );
}

// ─── Comparison section ───────────────────────────────────────────────────────
function ComparisonSection({ comparison, onChange }) {
  const { enabled, from, to } = comparison;

  // Default "previous year" when first enabled
  const enable = () => {
    const d = new Date();
    const prevYear = new Date(d);
    prevYear.setFullYear(d.getFullYear() - 1);
    onChange({
      enabled: true,
      from: prevYear.toISOString().slice(0, 10),
      to: d.toISOString().slice(0, 10),
    });
  };

  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => enabled ? onChange({ ...comparison, enabled: false }) : enable()}
        className={`w-full flex items-center justify-between px-3.5 py-3 transition-colors ${
          enabled ? "bg-violet-50 border-b border-violet-100" : "bg-slate-50 hover:bg-slate-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <GitCompareArrows size={13} className={enabled ? "text-violet-600" : "text-slate-400"} />
          <span className={`text-[11px] font-bold uppercase tracking-widest ${enabled ? "text-violet-700" : "text-slate-500"}`}>
            Comparison period
          </span>
        </div>
        {/* Toggle pill */}
        <div className={`relative w-8 h-4 rounded-full transition-colors ${enabled ? "bg-violet-500" : "bg-slate-200"}`}>
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${enabled ? "left-4" : "left-0.5"}`} />
        </div>
      </button>

      {/* Date pickers (visible when enabled) */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 py-3 space-y-2 bg-violet-50/40">
              <p className="text-[10px] text-slate-400">
                Show this panel's data alongside a second date window for side-by-side comparison.
              </p>
              <div className="flex gap-2 flex-wrap">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">From</label>
                  <input
                    type="date" value={from}
                    onChange={(e) => onChange({ ...comparison, from: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">To</label>
                  <input
                    type="date" value={to} min={from}
                    onChange={(e) => onChange({ ...comparison, to: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReviewRow({ label, value, mono }) {
  // 1. If it's a null or undefined, render a placeholder
  if (value == null) return null;

  // 2. If it's an object, try to extract a string value, 
  //    otherwise, print the type or a warning to the screen instead of crashing
  let displayValue = value;
  if (typeof value === 'object') {
     // If it's an array, join it; if it's an object, try specific keys
     if (Array.isArray(value)) displayValue = value.join(', ');
     else displayValue = value.title || value.label || value.extractor || JSON.stringify(value);
  }

  // Final safety check: if we somehow still have an object, 
  // return a stringified version so React doesn't throw.
  if (typeof displayValue === 'object') displayValue = "Error: Invalid object passed";

  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0">
        {label}
      </span>
      <span className={`text-xs text-slate-700 text-right ${mono ? "font-mono" : "font-medium"}`}>
        {String(displayValue)}
      </span>
    </div>
  );
}

// Lightweight, non-library preview shown on each visualization card in Step 1.
// These are static placeholders — not live charts. Built with SVG/CSS rather
// than Unicode glyphs so they render identically across browsers and fonts
// (the old "▇▃▆▅" / "◜82%◝" glyphs rendered as uniform blocks on some systems).
function VisualizationPreview({ type }) {
  switch (type) {
    case "StatCard":
      return (
        <div className="text-center">
          <div className="text-base font-bold text-slate-700 leading-none">12,458</div>
          <div className="text-[10px] font-semibold text-emerald-500 mt-1">↑ 12%</div>
        </div>
      );

    case "ScoreGauge":
      return (
        <div
          className="relative w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "conic-gradient(#6366f1 0deg 295deg, #e2e8f0 295deg 360deg)" }}
        >
          <div className="absolute inset-[3px] rounded-full bg-white flex items-center justify-center">
            <span className="text-[9px] font-bold text-slate-700">82%</span>
          </div>
        </div>
      );

    case "TargetMeter":
      return (
        <div className="w-12 h-2 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: "65%" }} />
        </div>
      );

    case "TrendLineChart":
      return (
        <svg viewBox="0 0 40 20" className="w-10 h-6">
          <polyline
            points="2,16 12,7 22,13 38,3"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "TrendBarChart":
      return (
        <svg viewBox="0 0 40 20" className="w-10 h-6">
          <rect x="2"  y="8"  width="6" height="12" rx="1.5" fill="#6366f1" />
          <rect x="12" y="3"  width="6" height="17" rx="1.5" fill="#6366f1" />
          <rect x="22" y="10" width="6" height="10" rx="1.5" fill="#6366f1" />
          <rect x="32" y="6"  width="6" height="14" rx="1.5" fill="#6366f1" />
        </svg>
      );

    case "DonutStatusChart":
      return (
        <div
          className="relative w-9 h-9 rounded-full"
          style={{ background: "conic-gradient(#6366f1 0deg 150deg, #a855f7 150deg 230deg, #e2e8f0 230deg 360deg)" }}
        >
          <div className="absolute inset-[7px] rounded-full bg-white" />
        </div>
      );

    default:
      return <span className="text-xl">📦</span>;
  }
}

// ─── main modal ───────────────────────────────────────────────────────────────
export default function PanelBuilderModal({ editingPanel = null, existingPanels = [], onClose, onSave }) {
  const isEdit = !!editingPanel;
  const ep = editingPanel?.panel ?? null;

  // Derive the initial category from the existing panel's component type when editing.
  const initialCategory = useMemo(() => {
    if (!ep?.componentType) return "";
    const found = COMPONENT_TYPES.find((c) => c.items.some((i) => i.type === ep.componentType));
    return found?.category === "KPI" ? "kpi" : found?.category === "Chart" ? "chart" : "";
  }, [ep]);

  const [category, setCategory] = useState(initialCategory);
  const [step, setStep] = useState(0);
  const [chartType, setChartType] = useState(ep?.componentType ?? "");

  // Trend series
  const [series, setSeries] = useState(() => {
    if (ep?.props?.series?.length) return ep.props.series;
    return [{ key: "series1", label: "Series 1", extractor: "", color: SERIES_COLORS[0] }];
  });

  // Single / donut / gauge / target
  const [singleExtractor, setSingleExtractor] = useState(ep?.props?.extractor ?? "");
  const [targetValue,     setTargetValue]     = useState(ep?.props?.target ?? "");

  // Duration: Initialize correctly based on the new interval format or fall back to old props format
  const [durationPreset, setDurationPreset] = useState(ep?.interval?.key ?? ep?.props?.duration?.type ?? "7d");
  const [durationFrom,   setDurationFrom]   = useState(ep?.interval?.customFrom ?? ep?.props?.duration?.from ?? "");
  const [durationTo,     setDurationTo]     = useState(ep?.interval?.customTo ?? ep?.props?.duration?.to ?? "");

  // Benchmarks for trend charts
  const [benchmarks, setBenchmarks] = useState(() => ep?.props?.benchmarks ?? []);

  // ── Comparison (per-panel) ────────────────────────────────────────────────
  const [comparison, setComparison] = useState(() => {
    if (ep?.comparison) return ep.comparison;
    const d = new Date();
    const prev = new Date(d);
    prev.setFullYear(d.getFullYear() - 1);
    return {
      enabled: false,
      from: prev.toISOString().slice(0, 10),
      to: d.toISOString().slice(0, 10),
    };
  });

  const isTrend  = TREND_TYPES.has(chartType);
  const isMap    = MAP_TYPES.has(chartType);
  const isTarget = chartType === "TargetMeter";

  // Visualization options available for the currently selected category.
  const visualizationItems = useMemo(() => {
    if (category === "kpi")   return COMPONENT_TYPES.find((c) => c.category === "KPI")?.items ?? [];
    if (category === "chart") return COMPONENT_TYPES.find((c) => c.category === "Chart")?.items ?? [];
    return [];
  }, [category]);

  const addSeries = () =>
    setSeries((prev) => [
      ...prev,
      { key: `series${prev.length + 1}`, label: `Series ${prev.length + 1}`, extractor: "", color: SERIES_COLORS[prev.length % SERIES_COLORS.length] },
    ]);

  const updateSeries  = (i, field, value) => setSeries((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  const removeSeries  = (i) => setSeries((prev) => prev.filter((_, idx) => idx !== i));
  const addBenchmark  = () => setBenchmarks((prev) => [...prev, { value: 0, label: "Target", color: "#ef4444" }]);
  const updateBenchmark = (i, field, value) => setBenchmarks((prev) => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b));
  const removeBenchmark = (i) => setBenchmarks((prev) => prev.filter((_, idx) => idx !== i));

  // Validation
  const step0Valid = category !== "";
  const step1Valid = chartType !== "";
  const step2Valid = isTrend ? series.some((s) => s.extractor) : singleExtractor !== "";

  const totalSteps = 4;

  const [duplicateError, setDuplicateError] = useState(null);

  const handleSave = () => {
    const panelId = isEdit ? ep.id : `panel_${Date.now()}`;
    const derivedTitle = isTrend
      ? (series.find((s) => s.extractor)?.label ?? chartType)
      : (AVAILABLE_EXTRACTORS.find((e) => e.extractor === singleExtractor)?.label ?? singleExtractor);

    // Keep duration on props for backwards compatibility if any old code relies on it
    const duration =
      durationPreset === "custom"
        ? { type: "custom", from: durationFrom, to: durationTo }
        : { type: durationPreset };

    const props = isTrend
      ? {
          series: series.filter((s) => s.extractor && s.key),
          duration,
          ...(benchmarks.length ? { benchmarks } : {}),
        }
      : isTarget
      ? { extractor: singleExtractor, target: targetValue ? Number(targetValue) : undefined }
      : { extractor: singleExtractor };

    // Construct the top-level interval object DashboardEngine expects
    const interval = {
      key: durationPreset,
      customFrom: durationPreset === "custom" ? durationFrom : "",
      customTo: durationPreset === "custom" ? durationTo : ""
    };

    const panel = {
      id: panelId,
      componentType: chartType,
      title: derivedTitle,
      props,
      interval, // <--- Correctly passing the interval object directly to the panel
      // Store comparison config on the panel itself
      ...(comparison.enabled ? { comparison } : {}),
    };

    // Block adding (not editing) a panel that already exists on the
    // dashboard with the same component type + data field — this is the
    // same restriction templates previously used, applied to the manual builder too.
    if (!isEdit) {
      const sig = panelSignature(panel);
      const isDuplicate = existingPanels.some((p) => panelSignature(p) === sig);
      if (isDuplicate) {
        setDuplicateError("A panel showing this exact data already exists on this dashboard.");
        return;
      }
    }

    onSave({ panel, isEdit, originalPanelId: ep?.id });
    onClose();
  };

  const categoryLabel = (id) => PANEL_CATEGORIES.find((c) => c.id === id)?.label ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                {isEdit ? "Edit Component" : "Add Component"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {step === 0 && "Choose a category"}
                {step === 1 && "Choose a visualization"}
                {step === 2 && "Configure data, duration & comparison"}
                {step === 3 && "Review and add to dashboard"}
              </p>
            </div>
            <button onClick={onClose} className="p-1 text-slate-300 hover:text-slate-500">
              <X size={16} />
            </button>
          </div>
          <StepDots current={step} total={totalSteps} />
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[62vh] overflow-y-auto space-y-4">
          <AnimatePresence mode="wait">

            {/* Step 0: Choose Category */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }} className="space-y-3">
                <FieldLabel>Choose what you'd like to add</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  {PANEL_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setCategory(cat.id);
                        // Changing category invalidates a previously chosen visualization
                        // from the other category.
                        setChartType((prev) => {
                          const stillValid = COMPONENT_TYPES
                            .find((c) => (cat.id === "kpi" ? c.category === "KPI" : c.category === "Chart"))
                            ?.items.some((i) => i.type === prev);
                          return stillValid ? prev : "";
                        });
                      }}
                      className={`flex flex-col items-center gap-1.5 px-3.5 py-4 rounded-xl border-2 transition-all text-center ${
                        category === cat.id
                          ? "border-indigo-400 bg-indigo-50"
                          : "border-slate-150 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      <span className="text-2xl leading-none">{cat.icon}</span>
                      <span className="text-sm font-semibold text-slate-700">{cat.label}</span>
                      <span className="text-[11px] text-slate-400">{cat.description}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: Choose Visualization */}
            {step === 1 && (
              <motion.div key="step1-viz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }} className="space-y-2">
                <FieldLabel hint={category === "kpi" ? "single-value formats" : "trend & breakdown formats"}>
                  {categoryLabel(category)} visualizations
                </FieldLabel>
                <div className="grid grid-cols-1 gap-2.5">
                  {visualizationItems.map((c) => (
                    <button
                      key={c.type}
                      onClick={() => setChartType(c.type)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border-2 transition-all text-left ${
                        chartType === c.type
                          ? "border-indigo-400 bg-indigo-50"
                          : "border-slate-150 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      <div className="w-16 h-12 rounded-lg bg-white border border-slate-100 flex items-center justify-center flex-shrink-0">
                        <VisualizationPreview type={c.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700">{c.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{c.hint}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Data config */}
            {step === 2 && (
              <motion.div key="step2-config" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }} className="space-y-5">

                {/* Trend: series */}
                {isTrend && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <FieldLabel hint="one line or bar per series">Data Series</FieldLabel>
                      <button onClick={addSeries} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                        <Plus size={12} /> Add
                      </button>
                    </div>
                    <AnimatePresence>
                      {series.map((s, i) => (
                        <div key={i} className="mb-2">
                          <SeriesRow series={s} index={i} onChange={updateSeries} onRemove={removeSeries} canRemove={series.length > 1} />
                        </div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Single / donut / gauge */}
                {!isTrend && (
                  <div>
                    <FieldLabel hint={isMap ? "object map like risks.byStatus" : "scalar e.g. risks.total"}>
                      Data field
                    </FieldLabel>
                    <ExtractorSelect value={singleExtractor} onChange={setSingleExtractor} scalarOnly={!isMap} />
                  </div>
                )}

                {/* Target value (TargetMeter only) */}
                {isTarget && (
                  <div>
                    <FieldLabel hint="the 100% / goal value">Target value</FieldLabel>
                    <input
                      type="number" min="0" value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 transition-all"
                    />
                  </div>
                )}

                {/* Duration (lookback window) for trend charts */}
                {isTrend && (
                  <div>
                    <FieldLabel hint="lookback window for the x-axis">Duration</FieldLabel>
                    <div className="flex gap-2 flex-wrap">
                      {DURATION_PRESETS.map((d) => (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => setDurationPreset(d.key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                            durationPreset === d.key
                              ? "border-indigo-400 bg-indigo-50 text-indigo-600"
                              : "border-slate-150 bg-slate-50 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                    <AnimatePresence>
                      {durationPreset === "custom" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="flex gap-2 flex-wrap mt-2.5">
                            <div className="flex-1 min-w-[120px]">
                              <label className="block text-[10px] font-semibold text-slate-400 mb-1">From</label>
                              <input
                                type="date" value={durationFrom}
                                onChange={(e) => setDurationFrom(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              />
                            </div>
                            <div className="flex-1 min-w-[120px]">
                              <label className="block text-[10px] font-semibold text-slate-400 mb-1">To</label>
                              <input
                                type="date" value={durationTo} min={durationFrom}
                                onChange={(e) => setDurationTo(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Benchmarks for trend charts */}
                {isTrend && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <FieldLabel hint="reference lines on the chart">Benchmark points</FieldLabel>
                      <button onClick={addBenchmark} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                        <Plus size={12} /> Add
                      </button>
                    </div>
                    {benchmarks.length === 0 ? (
                      <p className="text-[11px] text-slate-400">No benchmarks yet — add reference lines to mark targets or thresholds.</p>
                    ) : (
                      <div className="space-y-2">
                        {benchmarks.map((bm, i) => (
                          <BenchmarkRow key={i} bm={bm} index={i} onChange={updateBenchmark} onRemove={removeBenchmark} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Comparison period (all panel types) ── */}
                <ComparisonSection comparison={comparison} onChange={setComparison} />

              </motion.div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <motion.div key="step3-review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }} className="space-y-3">
                <div className="rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100">
                  <ReviewRow label="Category" value={categoryLabel(category)} />
                  <ReviewRow label="Visualization" value={visualizationItems.find((v) => v.type === chartType)?.label ?? chartType} />
                  
                <div className="px-4 py-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Configuration</p>
                  <div className="text-xs text-slate-700 font-medium">
                    {isTrend ? (
                      series.map((s, i) => (
                        <div key={i} className="mb-1">
                          {String(s.label || "Series")} 
                          <span className="font-mono text-slate-400 ml-1">({String(s.extractor || "No Field")})</span>
                        </div>
                      ))
                    ) : (
                      <div>Field: <span className="font-mono">{String(singleExtractor || "None")}</span></div>
                    )}
                  </div>
                </div>

                  {/* Comparison Section */}
                  {comparison.enabled && (
                    <div className="px-4 py-3 flex items-center gap-2">
                      <GitCompareArrows size={11} className="text-violet-500 flex-shrink-0" />
                      <span className="text-[11px] text-slate-500">
                        Comparison: {comparison.from} to {comparison.to}
                      </span>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-slate-400 text-center">
                  {isEdit ? "Your changes will be saved." : "This panel will be added to your dashboard."}
                </p>
                
                {duplicateError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-600 text-center">
                    {duplicateError}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              setDuplicateError(null);
              if (step === 0) onClose();
              else setStep(step - 1);
            }}
            className="text-sm text-slate-500 hover:text-slate-700 font-medium px-2 py-1"
          >
            {step === 0 ? "Cancel" : "← Back"}
          </button>

          {step < 3 ? (
            <button
              onClick={() => { setDuplicateError(null); setStep(step + 1); }}
              disabled={
                (step === 0 && !step0Valid) ||
                (step === 1 && !step1Valid) ||
                (step === 2 && !step2Valid)
              }
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold
                hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed
                active:scale-95 transition-all shadow-sm"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold
                hover:bg-emerald-700 active:scale-95 transition-all shadow-sm flex items-center gap-2"
            >
              ✓ {isEdit ? "Save Changes" : "Add Component"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}