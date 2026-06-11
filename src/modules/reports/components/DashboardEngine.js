/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DashboardEngine.jsx  (v2)
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes from v1:
 *   1. localStorage shape: calvant_custom_views  [{ id, label, panels[] }]
 *      (old calvant_custom_panels flat list is migrated automatically on mount)
 *   2. Custom views: full CRUD via ViewManagerModal
 *   3. Custom panels: edit (reopens modal pre-filled) + delete per-panel
 *   4. Comparison data passed from parent → KpiWrapper → StatCard delta
 *   5. "Custom Panel" button opens updated modal with view placement step
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  Suspense, memo, useCallback, useMemo, useState, useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, Pencil, Trash2 } from "lucide-react";
import { resolveComponent } from "./kpiRegistry";
import {
  resolveSingleValue, resolveTrendSeries, resolveMapValue, resolveTableRows,
} from "./dataExtractors";
import CustomDashboardModal from "./customDashboardModal";
import ViewManagerModal from "./ViewManagerModal";

// ─── storage keys ─────────────────────────────────────────────────────────────
const VIEWS_KEY   = "calvant_custom_views";
const LEGACY_KEY  = "calvant_custom_panels"; // migrated on first load

// ─── migration ────────────────────────────────────────────────────────────────
function loadCustomViews() {
  try {
    const stored = localStorage.getItem(VIEWS_KEY);
    if (stored) return JSON.parse(stored);

    // migrate legacy flat list
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const panels = JSON.parse(legacy);
      if (panels.length > 0) {
        const migrated = [{ id: "custom_view_migrated", label: "Custom", panels }];
        localStorage.setItem(VIEWS_KEY, JSON.stringify(migrated));
        localStorage.removeItem(LEGACY_KEY);
        return migrated;
      }
    }
  } catch {}
  return [];
}

function saveCustomViews(views) {
  localStorage.setItem(VIEWS_KEY, JSON.stringify(views));
}

// ─── data resolution ──────────────────────────────────────────────────────────
function resolveKpiData(kpiConfig, result) {
  const { componentType, props = {} } = kpiConfig;
  switch (componentType) {
    case "StatCard":
    case "ScoreGauge": {
      const extractor = props.extractor ?? kpiConfig.extractor ?? "";
      return resolveSingleValue(result, extractor);
    }
    case "TrendLineChart":
    case "TrendAreaChart":
    case "TrendBarChart": {
      const series = props.series ?? [];
      return resolveTrendSeries(result, series, props.labelExtractor);
    }
    case "DonutStatusChart": {
      const extractor = props.extractor ?? kpiConfig.extractor ?? "";
      if (props.staticSlices) return { slices: props.staticSlices };
      return resolveMapValue(result, extractor);
    }
    case "DepartmentBreakdown": {
      const extractor = props.extractor ?? kpiConfig.extractor ?? "";
      return resolveMapValue(result, extractor);
    }
    case "TableWidget": {
      const extractor = props.extractor ?? kpiConfig.extractor ?? "";
      return resolveTableRows(result, extractor);
    }
    default:
      return {};
  }
}

// ─── KpiWrapper ───────────────────────────────────────────────────────────────
const KpiWrapper = memo(function KpiWrapper({
  kpiConfig, results, comparisonResults, loading,
}) {
  const Component = useMemo(
    () => resolveComponent(kpiConfig.componentType),
    [kpiConfig.componentType]
  );

  const result = useMemo(() => {
    if (!results?.length) return null;
    const reportId = kpiConfig.reportId;
    if (!reportId) return results[0] ?? null;
    return results.find((r) => r?.reportId === reportId) ?? results[0] ?? null;
  }, [results, kpiConfig.reportId]);

  const compResult = useMemo(
    () => comparisonResults?.[0] ?? null,
    [comparisonResults]
  );

  const resolvedData = useMemo(() => {
    if (!result) return null;
    try { return resolveKpiData(kpiConfig, result); } catch { return null; }
  }, [result, kpiConfig]);

  // Compute comparison delta for StatCard
  const comparisonData = useMemo(() => {
    if (!compResult) return null;
    try { return resolveKpiData(kpiConfig, compResult); } catch { return null; }
  }, [compResult, kpiConfig]);

  return (
    <Suspense fallback={<SkeletonCard />}>
      <Component
        kpiConfig={kpiConfig}
        resolvedData={resolvedData}
        comparisonData={comparisonData}
        loading={loading || !result}
      />
    </Suspense>
  );
});

// ─── PanelGrid (standard templates) ──────────────────────────────────────────
function PanelGrid({ panels, results, comparisonResults, loading, columns = 3 }) {
  const gridCols = `repeat(${columns}, minmax(0, 1fr))`;
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: gridCols }}>
      {panels.map((panel) => {
        const kpiList = panel.kpis?.length ? panel.kpis : [panel];
        const colSpan = Math.min(panel.colSpan ?? 1, columns);
        return (
          <div
            key={panel.id}
            className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden"
            style={{ gridColumn: `span ${colSpan}` }}
          >
            {kpiList.map((kpiConfig) => (
              <KpiWrapper
                key={kpiConfig.id}
                kpiConfig={kpiConfig}
                results={results}
                comparisonResults={comparisonResults}
                loading={loading}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="h-48 rounded-2xl bg-slate-50 animate-pulse flex flex-col gap-3 p-5">
      <div className="h-3 w-1/3 bg-slate-200 rounded-full" />
      <div className="flex-1 bg-slate-100 rounded-xl" />
    </div>
  );
}

// ─── DashboardEngine ──────────────────────────────────────────────────────────
export default function DashboardEngine({
  config,
  results,
  comparisonResults = [],
  loading,
  error,
}) {
  // ── custom views (persisted) ──────────────────────────────────────────────
  const [customViews, setCustomViews] = useState(loadCustomViews);

  const persistViews = useCallback((views) => {
    setCustomViews(views);
    saveCustomViews(views);
  }, []);

  // ── modals ────────────────────────────────────────────────────────────────
  const [showPanelModal, setShowPanelModal] = useState(false);
  const [showViewManager, setShowViewManager] = useState(false);
  const [editingPanel, setEditingPanel] = useState(null); // panel to pre-fill

  // ── save panel from modal ─────────────────────────────────────────────────
  const savePanel = useCallback(({ viewId, viewLabel, panel }) => {
    setCustomViews((prev) => {
      const exists = prev.find((v) => v.id === viewId);
      let updated;
      if (exists) {
        updated = prev.map((v) =>
          v.id === viewId ? { ...v, panels: [...v.panels, panel] } : v
        );
      } else {
        updated = [...prev, { id: viewId, label: viewLabel, panels: [panel] }];
      }
      saveCustomViews(updated);
      return updated;
    });
  }, []);

  // ── delete panel from custom view ─────────────────────────────────────────
  const deletePanel = useCallback((viewId, panelId) => {
    setCustomViews((prev) => {
      const updated = prev.map((v) =>
        v.id === viewId
          ? { ...v, panels: v.panels.filter((p) => p.id !== panelId) }
          : v
      );
      saveCustomViews(updated);
      return updated;
    });
  }, []);

  // ── view tab state ────────────────────────────────────────────────────────
  const templateViews = config?.views ?? [];

  const allViews = useMemo(() => {
    if (customViews.length === 0) return templateViews;
    return [...templateViews, ...customViews];
  }, [templateViews, customViews]);

  const [activeViewId, setActiveViewId] = useState(allViews[0]?.id ?? null);

  const activeView = allViews.find((v) => v.id === activeViewId) ?? allViews[0];
  const isCustomView = customViews.some((v) => v.id === activeView?.id);

  if (error) {
    return (
      <div className="p-8 text-center text-rose-500 text-sm">
        Failed to load dashboard data: {error}
      </div>
    );
  }

  // ── existing custom views list for modal step 0 ───────────────────────────
  const existingViewsForModal = customViews.map((v) => ({ id: v.id, label: v.label }));

  return (
    <div className="flex flex-col gap-4">
      {/* ── Tab bar + actions ─────────────────────────────────────────────── */}
      <div
        id="kpis-container"
        data-html2canvas-ignore="true"
        className="flex items-center justify-between flex-wrap gap-2"
      >
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
          {allViews.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveViewId(view.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                ${activeViewId === view.id
                  ? "bg-white shadow text-slate-800"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {view.label ?? view.id}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* manage views (only shown when ≥1 custom view exists) */}
          {customViews.length > 0 && (
            <button
              onClick={() => setShowViewManager(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100
                text-slate-500 text-sm font-semibold hover:bg-slate-200
                active:scale-95 transition-all border border-slate-200"
              title="Manage views"
            >
              <Settings2 size={14} />
              Views
            </button>
          )}

          <button
            onClick={() => { setEditingPanel(null); setShowPanelModal(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600
              text-white text-sm font-semibold hover:bg-indigo-700
              active:scale-95 transition-all shadow-sm"
          >
            <span className="text-base leading-none">＋</span> Custom Panel
          </button>
        </div>
      </div>

      {/* ── Panel grid ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          id="charts-container"
          key={activeViewId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {/* template view */}
          {activeView && !isCustomView && (
            <PanelGrid
              panels={activeView.panels ?? []}
              results={results}
              comparisonResults={comparisonResults}
              loading={loading}
              columns={activeView.layout?.columns ?? 3}
            />
          )}

          {/* custom view — editable panels */}
          {isCustomView && (
            <div
              className="mt-2 grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
            >
              {activeView.panels?.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
                  <p className="text-sm text-slate-400 italic">No panels in this view yet.</p>
                  <button
                    onClick={() => setShowPanelModal(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold
                      hover:bg-indigo-700 transition-colors"
                  >
                    + Add first panel
                  </button>
                </div>
              )}

              {(activeView.panels ?? []).map((panel) => (
                <div
                  key={panel.id}
                  className="relative rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden group"
                >
                  {/* edit / delete controls */}
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100
                    transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingPanel({ panel, viewId: activeView.id });
                        setShowPanelModal(true);
                      }}
                      title="Edit panel"
                      className="w-6 h-6 rounded-full bg-slate-100 text-slate-500
                        hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center
                        transition-colors"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => deletePanel(activeView.id, panel.id)}
                      title="Remove panel"
                      className="w-6 h-6 rounded-full bg-slate-100 text-slate-500
                        hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center
                        transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>

                  <KpiWrapper
                    kpiConfig={panel}
                    results={results}
                    comparisonResults={comparisonResults}
                    loading={loading}
                  />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Custom panel modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPanelModal && (
          <CustomDashboardModal
            existingViews={existingViewsForModal}
            onClose={() => { setShowPanelModal(false); setEditingPanel(null); }}
            onSave={savePanel}
          />
        )}
      </AnimatePresence>

      {/* ── View manager modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showViewManager && (
          <ViewManagerModal
            views={customViews}
            onSave={(updatedViews) => {
              persistViews(updatedViews);
              // if active view was deleted, switch to first available
              if (!updatedViews.find((v) => v.id === activeViewId)) {
                setActiveViewId(allViews[0]?.id ?? null);
              }
            }}
            onClose={() => setShowViewManager(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}