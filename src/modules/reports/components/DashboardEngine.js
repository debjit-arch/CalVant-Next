/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DashboardEngine.jsx  (v4 — single mixed view, no tabs)
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes from v3:
 *   1. Removed tab bar / multi-view switching entirely. A schedule now has
 *      exactly one view containing a free mix of panels from any segment
 *      (risks, audit, tasks, dpia, documents, aiia all in the same canvas).
 *   2. `customViews` prop is still an array (storage-shape compatible with the
 *      existing report_views backend collection) but is only ever treated as
 *      length 0 or 1. We read/write customViews[0] exclusively.
 *   3. Removed ViewManagerModal entirely — there's nothing to manage with a
 *      single, un-renameable view.
 *   4. savePanel / saveTemplateView always target the single view, creating
 *      it on first panel/template if it doesn't exist yet.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  Suspense,
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard } from "lucide-react";
import { resolveComponent } from "./kpiRegistry";
import {
  resolveSingleValue,
  resolveTrendSeries,
  resolveMapValue,
  resolveTableRows,
} from "./dataExtractors";
import CustomDashboardModal from "./customDashboardModal";

const SINGLE_VIEW_ID = "main";
const SINGLE_VIEW_LABEL = "Dashboard";

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
  kpiConfig,
  results,
  comparisonResults,
  loading,
}) {
  const Component = useMemo(
    () => resolveComponent(kpiConfig.componentType),
    [kpiConfig.componentType],
  );

  const result = useMemo(() => {
    if (!results?.length) return null;
    const reportId = kpiConfig.reportId;
    if (!reportId) return results[0] ?? null;
    return results.find((r) => r?.reportId === reportId) ?? results[0] ?? null;
  }, [results, kpiConfig.reportId]);

  const compResult = useMemo(
    () => comparisonResults?.[0] ?? null,
    [comparisonResults],
  );

  const resolvedData = useMemo(() => {
    if (!result) return null;
    try { return resolveKpiData(kpiConfig, result); }
    catch { return null; }
  }, [result, kpiConfig]);

  const comparisonData = useMemo(() => {
    if (!compResult) return null;
    try { return resolveKpiData(kpiConfig, compResult); }
    catch { return null; }
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

// ─── SkeletonCard ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="h-48 rounded-2xl bg-slate-50 animate-pulse flex flex-col gap-3 p-5">
      <div className="h-3 w-1/3 bg-slate-200 rounded-full" />
      <div className="flex-1 bg-slate-100 rounded-xl" />
    </div>
  );
}

// ─── EmptyCanvas ──────────────────────────────────────────────────────────────
function EmptyCanvas({ onAddPanel }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center shadow-inner">
        <LayoutDashboard size={26} className="text-indigo-300" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-600 mb-1">No panels yet</p>
        <p className="text-xs text-slate-400 max-w-xs">
          Click <strong className="text-indigo-500">+ Custom Panel</strong> to add your first chart or stat card — mix and match tiles from any segment.
        </p>
      </div>
      <button
        onClick={onAddPanel}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white
          text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
      >
        <span className="text-sm leading-none">＋</span> Add first panel
      </button>
    </div>
  );
}

// ─── DashboardEngine ──────────────────────────────────────────────────────────
/**
 * Props:
 *   customViews        [{ id, label, panels[] }]  — owned + persisted by parent.
 *                       Only customViews[0] is ever read or written; the array
 *                       wrapper is kept purely for storage-shape compatibility.
 *   onCustomViewsChange (views) => void            — parent saves to backend
 *   results            — from useDashboardData
 *   comparisonResults  — from useDashboardData
 *   loading            — bool (data fetching)
 *   viewsLoading       — bool (custom views fetching from backend)
 *   error              — string | null
 */
export default function DashboardEngine({
  customViews = [],
  onCustomViewsChange,
  results,
  comparisonResults = [],
  loading,
  viewsLoading = false,
  error,
}) {
  // ── modal ─────────────────────────────────────────────────────────────────
  const [showPanelModal, setShowPanelModal] = useState(false);
  const [editingPanel, setEditingPanel] = useState(null);

  // ── the single view (or null if nothing has been added yet) ───────────────
  const view = customViews[0] ?? null;

  // ── save panel from modal (always targets the single view) ────────────────
  const savePanel = useCallback(
    ({ panel, isEdit, originalPanelId }) => {
      let updatedView;
      if (view) {
        updatedView = isEdit && originalPanelId
          ? { ...view, panels: view.panels.map((p) => (p.id === originalPanelId ? panel : p)) }
          : { ...view, panels: [...view.panels, panel] };
      } else {
        updatedView = { id: SINGLE_VIEW_ID, label: SINGLE_VIEW_LABEL, panels: [panel] };
      }
      onCustomViewsChange?.([updatedView]);
    },
    [view, onCustomViewsChange],
  );

  // ── append a template's panels into the single view ────────────────────────
  const appendTemplatePanels = useCallback(
    (panels) => {
      const updatedView = view
        ? { ...view, panels: [...view.panels, ...panels] }
        : { id: SINGLE_VIEW_ID, label: SINGLE_VIEW_LABEL, panels };
      onCustomViewsChange?.([updatedView]);
    },
    [view, onCustomViewsChange],
  );

  // ── delete panel ──────────────────────────────────────────────────────────
  const deletePanel = useCallback(
    (panelId) => {
      if (!view) return;
      const updatedView = { ...view, panels: view.panels.filter((p) => p.id !== panelId) };
      onCustomViewsChange?.([updatedView]);
    },
    [view, onCustomViewsChange],
  );

  if (error) {
    return (
      <div className="p-8 text-center text-rose-500 text-sm">
        Failed to load dashboard data: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── actions ──────────────────────────────────────────────────────── */}
      <div
        id="kpis-container"
        data-html2canvas-ignore="true"
        className="flex items-center justify-end gap-2"
      >
        <button
          onClick={() => { setEditingPanel(null); setShowPanelModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600
            text-white text-sm font-semibold hover:bg-indigo-700
            active:scale-95 transition-all shadow-sm"
        >
          <span className="text-base leading-none">＋</span>{" "}
          <span className="whitespace-nowrap">Custom Panel</span>
        </button>
      </div>

      {/* ── Panel grid ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          id="charts-container"
          key={viewsLoading ? "views-loading" : "main"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {viewsLoading ? (
            /* skeleton while backend views are fetching */
            <div className="mt-2 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {[1, 2].map((i) => (
                <div key={i} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 flex flex-col gap-3 animate-pulse">
                  <div className="h-3 w-1/3 bg-slate-100 rounded-full" />
                  <div className="h-32 bg-slate-50 rounded-xl" />
                  <div className="h-2 w-1/2 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : !view || view.panels?.length === 0 ? (
            <EmptyCanvas onAddPanel={() => setShowPanelModal(true)} />
          ) : (
            <div
              className="mt-2 grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
            >
              {(view.panels ?? []).map((panel) => (
                <div
                  key={panel.id}
                  className="relative rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden group"
                >
                  {/* edit / delete controls */}
                  <div
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100
                    transition-opacity flex items-center gap-1"
                  >
                    <button
                      onClick={() => {
                        setEditingPanel({ panel });
                        setShowPanelModal(true);
                      }}
                      title="Edit panel"
                      className="w-6 h-6 rounded-full bg-slate-100 text-slate-500
                        hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center
                        transition-colors"
                    >
                      <span className="text-[11px] leading-none">✎</span>
                    </button>
                    <button
                      onClick={() => deletePanel(panel.id)}
                      title="Remove panel"
                      className="w-6 h-6 rounded-full bg-slate-100 text-slate-500
                        hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center
                        transition-colors"
                    >
                      <span className="text-[11px] leading-none">🗑</span>
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
            editingPanel={editingPanel}
            onClose={() => { setShowPanelModal(false); setEditingPanel(null); }}
            onSave={savePanel}
            onAppendTemplate={appendTemplatePanels}
          />
        )}
      </AnimatePresence>
    </div>
  );
}