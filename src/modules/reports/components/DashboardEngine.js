/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DashboardEngine.jsx  (v3 — per-schedule custom views, no predefined templates)
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes from v2:
 *   1. No longer reads/writes localStorage directly — parent owns persistence
 *   2. Accepts `customViews` and `onCustomViewsChange` props
 *   3. Template views (config?.views) are NOT rendered — only custom views
 *   4. Empty state guides user to create their first panel
 *   5. viewsLoading prop — shows skeleton while backend views fetch
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  Suspense,
  memo,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, Pencil, Trash2, LayoutDashboard } from "lucide-react";
import { resolveComponent } from "./kpiRegistry";
import {
  resolveSingleValue,
  resolveTrendSeries,
  resolveMapValue,
  resolveTableRows,
} from "./dataExtractors";
import CustomDashboardModal from "./customDashboardModal";
import ViewManagerModal from "./ViewManagerModal";

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
          Click <strong className="text-indigo-500">+ Custom Panel</strong> to add your first chart or stat card to this view.
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
 *   customViews        [{ id, label, panels[] }]  — owned + persisted by parent
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
  // ── modals ────────────────────────────────────────────────────────────────
  const [showPanelModal, setShowPanelModal] = useState(false);
  const [showViewManager, setShowViewManager] = useState(false);
  const [editingPanel, setEditingPanel] = useState(null);

  // ── view tab state ────────────────────────────────────────────────────────
  const [activeViewId, setActiveViewId] = useState(customViews[0]?.id ?? null);

  // Sync active view when customViews changes (e.g. schedule switch)
  useEffect(() => {
    if (!customViews.find((v) => v.id === activeViewId)) {
      setActiveViewId(customViews[0]?.id ?? null);
    }
  }, [customViews, activeViewId]);

  const activeView = customViews.find((v) => v.id === activeViewId) ?? customViews[0] ?? null;

  // ── save panel from modal ─────────────────────────────────────────────────
  const savePanel = useCallback(
    ({ viewId, viewLabel, panel, isEdit, originalPanelId }) => {
      const exists = customViews.find((v) => v.id === viewId);
      let updated;
      if (exists) {
        updated = customViews.map((v) => {
          if (v.id !== viewId) return v;
          if (isEdit && originalPanelId) {
            return { ...v, panels: v.panels.map((p) => p.id === originalPanelId ? panel : p) };
          }
          return { ...v, panels: [...v.panels, panel] };
        });
      } else {
        updated = [...customViews, { id: viewId, label: viewLabel, panels: [panel] }];
        setActiveViewId(viewId);
      }
      onCustomViewsChange?.(updated);
    },
    [customViews, onCustomViewsChange],
  );

  // ── save whole view from a template (multiple panels at once) ─────────────
  const saveTemplateView = useCallback(
    (view) => {
      const updated = [...customViews, view];
      setActiveViewId(view.id);
      onCustomViewsChange?.(updated);
    },
    [customViews, onCustomViewsChange],
  );

  // ── delete panel ──────────────────────────────────────────────────────────
  const deletePanel = useCallback(
    (viewId, panelId) => {
      const updated = customViews.map((v) =>
        v.id === viewId
          ? { ...v, panels: v.panels.filter((p) => p.id !== panelId) }
          : v,
      );
      onCustomViewsChange?.(updated);
    },
    [customViews, onCustomViewsChange],
  );

  const existingViewsForModal = customViews.map((v) => ({ id: v.id, label: v.label }));

  if (error) {
    return (
      <div className="p-8 text-center text-rose-500 text-sm">
        Failed to load dashboard data: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Tab bar + actions ─────────────────────────────────────────────── */}
      <div
        id="kpis-container"
        data-html2canvas-ignore="true"
        className="flex items-center justify-between flex-wrap gap-2"
      >
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 flex-wrap overflow-x-auto max-w-full">
          {viewsLoading ? (
            <span className="px-4 py-1.5 text-sm text-slate-400 flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-slate-300 border-t-indigo-400 animate-spin" />
              Loading views…
            </span>
          ) : customViews.length === 0 ? (
            <span className="px-4 py-1.5 text-sm text-slate-400 italic">No views yet</span>
          ) : (
            customViews.map((view) => (
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
            ))
          )}
        </div>

        <div className="flex items-center gap-2">
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
            <span className="text-base leading-none">＋</span>{" "}
            <span className="whitespace-nowrap">Custom Panel</span>
          </button>
        </div>
      </div>

      {/* ── Panel grid ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          id="charts-container"
          key={viewsLoading ? "views-loading" : (activeViewId ?? "empty")}
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
          ) : !activeView || activeView.panels?.length === 0 ? (
            <EmptyCanvas onAddPanel={() => setShowPanelModal(true)} />
          ) : (
            <div
              className="mt-2 grid gap-4"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
            >
              {(activeView.panels ?? []).map((panel) => (
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
            editingPanel={editingPanel}
            onClose={() => { setShowPanelModal(false); setEditingPanel(null); }}
            onSave={savePanel}
            onSaveTemplate={saveTemplateView}
          />
        )}
      </AnimatePresence>

      {/* ── View manager modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showViewManager && (
          <ViewManagerModal
            views={customViews}
            onSave={(updatedViews) => {
              onCustomViewsChange?.(updatedViews);
              if (!updatedViews.find((v) => v.id === activeViewId)) {
                setActiveViewId(updatedViews[0]?.id ?? null);
              }
            }}
            onClose={() => setShowViewManager(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}