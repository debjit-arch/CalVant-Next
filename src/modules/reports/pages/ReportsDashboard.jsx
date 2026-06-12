import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Wifi,
  WifiOff,
  RefreshCw,
  Calendar,
  Download,
  FileJson,
  FileSpreadsheet,
  Settings2,
  HelpCircle,
  GitCompareArrows,
  FileText,
  Pencil,
  Plus,
  ClipboardList,
} from "lucide-react";
import Joyride, { STATUS } from "react-joyride";

import DashboardEngine from "../components/DashboardEngine";
import { useDashboardData } from "../../../hooks/useDashboardData";
import { useDashboardExport } from "../../../hooks/useDashboardExport";
import ComparisonBar from "../components/ComparisonBar";
import FilterBar from "../components/FilterBar";
import ReportConfigModal from "../components/ReportConfigModal";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const INTERVALS = [
  { key: "7d",     label: "7 Days"  },
  { key: "14d",    label: "14 Days" },
  { key: "90d",    label: "90 Days" },
  { key: "custom", label: "Custom"  },
];

const BASE_URL = "https://api.calvant.com/reports-service/api/reports";

const INTERVAL_TYPE_TO_KEY = {
  DAILY:         "7d",
  WEEKLY:        "7d",
  MONTHLY:       "90d",
  QUARTERLY:     "90d",
  YEARLY:        "custom",
  HOURLY:        "7d",
  CUSTOM_DAYS:   "7d",
  CUSTOM_MONTHS: "90d",
  CUSTOM_YEARS:  "custom",
};

// ─── PER-SCHEDULE CUSTOM VIEWS  (backend — report_views collection) ──────────
async function fetchScheduleViews(scheduleId, token) {
  if (!scheduleId) return [];
  try {
    const res = await fetch(`${BASE_URL}/config/${scheduleId}/views`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

async function saveScheduleViewsRemote(scheduleId, organization, views, token) {
  if (!scheduleId) return;
  try {
    await fetch(
      `${BASE_URL}/config/${scheduleId}/views?organization=${encodeURIComponent(organization)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(views),
      },
    );
  } catch {
    // best-effort; UI already has the optimistic update
  }
}

// ─── ORG / TOKEN HELPERS ──────────────────────────────────────────────────────
function getDefaultOrg() {
  try {
    return (
      sessionStorage.getItem("orgId") ||
      JSON.parse(sessionStorage.getItem("user") || "{}").organization ||
      JSON.parse(sessionStorage.getItem("user") || "{}").organizationId ||
      ""
    );
  } catch { return ""; }
}

function getToken() {
  try { return sessionStorage.getItem("token") || ""; }
  catch { return ""; }
}

// ─── SIDEBAR SCHEDULE ITEM ────────────────────────────────────────────────────
function ScheduleItem({ cfg, isActive, onClick, onEdit }) {
  return (
    <motion.div
      whileHover={{ x: 2 }}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer group transition-all border ${
        isActive
          ? "bg-white shadow-sm border-indigo-100"
          : "border-transparent hover:bg-white/60 hover:border-slate-100"
      }`}
    >
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 ${cfg.active ? "bg-emerald-400" : "bg-slate-300"}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold truncate ${isActive ? "text-slate-800" : "text-slate-600"}`}>
          {cfg.reportName}
        </p>
        {cfg.dataSources?.length > 0 && (
          <p className="text-[10px] text-slate-400 truncate mt-0.5">
            {cfg.dataSources.join(", ")}
          </p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 rounded-md hover:bg-slate-100"
        title="Edit schedule"
      >
        <Pencil size={10} className="text-slate-400 hover:text-indigo-500" />
      </button>
    </motion.div>
  );
}

// ─── EXPORT DROPDOWN ─────────────────────────────────────────────────────────
function ExportDropdown({ onConfig, onSnapshot, onCSV, onComparison, onPDF, hasComparison }) {
  const [open, setOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    { label: "Dashboard Config", sub: "JSON schema · layout + KPIs",    icon: <Settings2 size={13} className="text-indigo-500" />,  bg: "bg-indigo-50", onClick: onConfig   },
    { label: "Data Snapshot",    sub: "JSON · resolved KPI values",      icon: <FileJson size={13} className="text-emerald-500" />,  bg: "bg-emerald-50", onClick: onSnapshot },
    { label: "Raw Data CSV",     sub: "Active sources only",             icon: <FileSpreadsheet size={13} className="text-amber-500" />, bg: "bg-amber-50", onClick: onCSV },
    ...(hasComparison ? [{ label: "Comparison CSV", sub: "Primary vs comparison period", icon: <GitCompareArrows size={13} className="text-violet-500" />, bg: "bg-violet-50", onClick: onComparison }] : []),
    { label: "Download PDF",     sub: "Visual screenshot",              icon: <FileText size={13} className="text-rose-500" />,     bg: "bg-rose-50",    onClick: onPDF      },
  ];

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-600 transition-colors"
      >
        <Download size={13} /> Export
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={hasMounted ? { opacity: 0, y: -6, scale: 0.97 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
          >
            <div className="p-1.5 flex flex-col gap-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1.5">Export As</p>
              {items.map((item) => (
                <button key={item.label} onClick={() => { item.onClick(); setOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>{item.icon}</div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── EMPTY STATE (no schedules at all) ───────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-12 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-50 flex items-center justify-center shadow-inner">
        <ClipboardList size={32} className="text-indigo-400" />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-700 mb-1">No report schedules yet</h2>
        <p className="text-sm text-slate-400 max-w-xs">
          Create a schedule to start building custom dashboards with your compliance data.
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={onNew}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
      >
        <Plus size={15} /> New schedule
      </motion.button>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ReportsDashboard() {
  const [organization] = useState(getDefaultOrg);

  // ── active schedule ───────────────────────────────────────────────────────
  const [activeScheduleId, setActiveScheduleId] = useState(null);

  // ── per-schedule custom views (owned here, persisted to backend) ─────────
  const [customViews, setCustomViews] = useState([]);
  const [viewsLoading, setViewsLoading] = useState(false);

  const handleCustomViewsChange = useCallback((views) => {
    setCustomViews(views);
    saveScheduleViewsRemote(activeScheduleId, organization, views, getToken());
  }, [activeScheduleId, organization]);

  // ── date window filter ────────────────────────────────────────────────────
  const [interval, setIntervalKey] = useState("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo]     = useState("");

  const resetDashboardState = useCallback(() => {
    setActiveScheduleId(null);
    setCustomViews([]);
    setViewsLoading(false);
    setIntervalKey("7d");
    setCustomFrom("");
    setCustomTo("");
  }, []);

  const handleScheduleClick = useCallback(
    (cfg) => {
      if (activeScheduleId === cfg.id) { resetDashboardState(); return; }

      setActiveScheduleId(cfg.id);
      // Load this schedule's persisted custom views from the backend
      setCustomViews([]);
      setViewsLoading(true);
      fetchScheduleViews(cfg.id, getToken()).then((views) => {
        setCustomViews(views);
        setViewsLoading(false);
      });

      // Set interval from schedule config
      const mappedInterval = INTERVAL_TYPE_TO_KEY[cfg.intervalType] ?? "7d";
      setIntervalKey(mappedInterval);
      if (cfg.intervalType === "YEARLY" || cfg.intervalType === "CUSTOM_YEARS") {
        const from = new Date();
        from.setFullYear(from.getFullYear() - (cfg.intervalValue ?? 1));
        setCustomFrom(from.toISOString().slice(0, 10));
        setCustomTo(new Date().toISOString().slice(0, 10));
      } else {
        setCustomFrom("");
        setCustomTo("");
      }
    },
    [activeScheduleId, resetDashboardState],
  );

  // ── comparison filter ─────────────────────────────────────────────────────
  const [comparisonFilters, setComparisonFilters] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return { enabled: false, from: d.toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) };
  });

  // ── dimension filter ──────────────────────────────────────────────────────
  const [dimensionFilters, setDimensionFilters] = useState({ department: [], client: [], branch: [] });

  // ── report config modal ───────────────────────────────────────────────────
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig,   setEditingConfig]   = useState(null);
  const [reportConfigs,   setReportConfigs]   = useState([]);
  const [availableSources, setAvailableSources] = useState([]);
  const [configsLoaded,   setConfigsLoaded]   = useState(false);

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  const [user] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("user") || "{}"); }
    catch { return {}; }
  });
  const userRoles = useMemo(() => {
    if (!user) return [];
    return Array.isArray(user.role) ? user.role : user.role ? [user.role] : [];
  }, [user]);
  const isRoot = userRoles.includes("root");

  // ── Joyride ───────────────────────────────────────────────────────────────
  const [run, setRun] = useState(false);
  const steps = [
    { target: "#dashboard-header",    content: "Welcome to your Reports Dashboard." },
    { target: "#sidebar-navigation",  content: "Saved report schedules appear here. Click one to open it." },
    { target: "#kpis-container",      content: "Switch views and add custom panels here." },
    { target: "#charts-container",    content: "Your custom charts and stat cards render here." },
    { target: "#comparison-bar",      content: "Compare the current period against any past date range." },
    { target: "#filter-bar",          content: "Filter by department, client, or branch." },
  ];

  const exportAreaRef = useRef(null);

  // ── Synthetic config for data hook + export (no template views needed) ────
  // We still need a config object so useDashboardData knows what org/endpoint to use.
  // We pass a minimal config; the engine ignores config.views now.
  const activeSchedule = useMemo(
    () => reportConfigs.find((c) => c.id === activeScheduleId) ?? null,
    [reportConfigs, activeScheduleId],
  );

  const syntheticConfig = useMemo(() => {
    if (!activeSchedule) return null;
    return {
      id: activeSchedule.id,
      label: activeSchedule.reportName,
      dataSources: activeSchedule.dataSources ?? [],
      dataModule: null,
      views: [], // DashboardEngine v3 ignores this
    };
  }, [activeSchedule]);

  const filters = useMemo(
    () => ({ interval, customFrom, customTo }),
    [interval, customFrom, customTo],
  );

  // ── data hook ─────────────────────────────────────────────────────────────
  const {
    results, comparisonResults, dimensionOptions,
    loading, error, refetch, lastFetched, online,
  } = useDashboardData(syntheticConfig, organization, filters, comparisonFilters, dimensionFilters);

  // ── export hook ───────────────────────────────────────────────────────────
  const { exportConfig, exportSnapshot, exportCSV, exportComparison, exportPDF } =
    useDashboardExport({ config: syntheticConfig, results, comparisonResults });

  // ── fetch schedule configs from backend ───────────────────────────────────
  const fetchConfigs = useCallback(async () => {
    if (!organization) return;
    try {
      const token = getToken();
      const res = await fetch(
        `${BASE_URL}/config?organization=${encodeURIComponent(organization)}`,
        { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } },
      );
      if (!res.ok) return;
      const json = await res.json();
      const raw = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      const configs = raw.map((c) => ({ ...c, id: c.id ?? c._id }));
      setReportConfigs(configs);
    } catch {}
  }, [organization]);

  const fetchAvailableSources = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/sources`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error("no sources");
      const json = await res.json();
      const sources = Array.isArray(json.data) ? json.data : [];
      if (sources.length > 0) setAvailableSources(sources);
      else throw new Error("empty");
    } catch {
      setAvailableSources(["risks", "audit", "tasks", "dpia", "documents", "aiia"]);
    }
  }, []);

  useEffect(() => {
    if (!configsLoaded && organization) {
      setConfigsLoaded(true);
      fetchConfigs();
      fetchAvailableSources();
    }
  }, [configsLoaded, organization, fetchConfigs, fetchAvailableSources]);

  // ── config modal handlers ─────────────────────────────────────────────────
  const openCreateConfig = () => { setEditingConfig(null); setShowConfigModal(true); };
  const openEditConfig   = (cfg) => { setEditingConfig(cfg); setShowConfigModal(true); };

  const handleConfigSaved = (saved) => {
    setReportConfigs((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id || c.reportName === saved.reportName);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved];
    });
    fetchConfigs();
  };

  const handleConfigDeleted = useCallback(
    (deletedId) => {
      setReportConfigs((prev) => prev.filter((c) => c.id !== deletedId));
      if (activeScheduleId === deletedId) resetDashboardState();
    },
    [activeScheduleId, resetDashboardState],
  );

  // ── custom range label ────────────────────────────────────────────────────
  const customRangeLabel = useMemo(() => {
    if (!customFrom) return "Custom";
    const from = new Date(customFrom).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    if (!customTo) return `From ${from}`;
    const to = new Date(customTo).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    return `${from} – ${to}`;
  }, [customFrom, customTo]);

  const activeDimCount =
    (dimensionFilters.department?.length ?? 0) +
    (dimensionFilters.client?.length ?? 0) +
    (dimensionFilters.branch?.length ?? 0);

  const hasActiveSchedule = !!activeScheduleId && !!activeSchedule;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/20 flex"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      <Joyride
        steps={steps} run={run} continuous showSkipButton scrollToFirstStep
        styles={{ options: { primaryColor: "#3b82f6", width: 300 } }}
        callback={(data) => { if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) setRun(false); }}
      />

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside
        id="sidebar-navigation"
        className="w-56 flex-shrink-0 bg-white/60 backdrop-blur-md border-r border-slate-100/60 flex flex-col gap-2 p-3 sticky top-0 h-screen overflow-y-auto"
      >
        <div className="flex items-center justify-between px-1 mb-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">My Reports</p>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={openCreateConfig}
            className="w-5 h-5 rounded-md bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center transition-colors"
            title="New schedule"
          >
            <Plus size={11} className="text-indigo-500" />
          </motion.button>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">
          {reportConfigs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 px-2 text-center">
              <ClipboardList size={24} className="text-slate-300" />
              <p className="text-[11px] text-slate-400 leading-snug">
                No schedules yet.{" "}
                <button onClick={openCreateConfig} className="text-indigo-500 font-semibold hover:underline">
                  Create one
                </button>
              </p>
            </div>
          ) : (
            reportConfigs.map((cfg) => (
              <ScheduleItem
                key={cfg.id}
                cfg={cfg}
                isActive={activeScheduleId === cfg.id}
                onClick={() => handleScheduleClick(cfg)}
                onEdit={() => openEditConfig(cfg)}
              />
            ))
          )}
        </nav>

        {reportConfigs.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={openCreateConfig}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-all"
            >
              <span className="text-sm leading-none">＋</span> New schedule
            </button>
          </div>
        )}
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── HEADER ───────────────────────────────────────────────────── */}
        <header
          id="dashboard-header"
          className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100/60 px-6 py-4"
        >
          {/* Row 1 */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center shadow-md flex-shrink-0">
                <BarChart3 size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-800 leading-tight">
                  {activeSchedule ? activeSchedule.reportName : "Reports"}
                </h1>
                <p className="text-xs text-slate-500">
                  {activeSchedule
                    ? activeSchedule.dataSources?.join(", ") || "No sources configured"
                    : "Select a schedule from the sidebar"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${online ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                {online ? <><Wifi size={11} /> Live</> : <><WifiOff size={11} /> Offline</>}
              </span>

              {lastFetched && (
                <span className="text-xs text-slate-400 hidden sm:block">Synced {lastFetched.toLocaleTimeString()}</span>
              )}

              <motion.button
                onClick={refetch}
                disabled={loading || !hasActiveSchedule}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 disabled:opacity-40 flex items-center justify-center"
              >
                <RefreshCw size={14} className="text-slate-500" style={loading ? { animation: "spin 1s linear infinite" } : {}} />
              </motion.button>

              {hasActiveSchedule && (
                <ExportDropdown
                  onConfig={exportConfig} onSnapshot={exportSnapshot}
                  onCSV={exportCSV} onComparison={exportComparison}
                  onPDF={() => exportPDF(exportAreaRef)}
                  hasComparison={comparisonFilters.enabled}
                />
              )}

              {/* Interval selector */}
              <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
                {INTERVALS.map(({ key, label }) => (
                  <button
                    key={key} onClick={() => setIntervalKey(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${interval === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {key === "custom" && <Calendar size={10} />}
                    {key === "custom" && interval === "custom" ? customRangeLabel : label}
                  </button>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={openCreateConfig}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-600 transition-colors"
              >
                <Settings2 size={13} /> Schedule
              </motion.button>

              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isRoot ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
                {isRoot ? "Root" : userRoles[0] ? userRoles[0].replace("_", " ") : "User"}
              </span>
              <span className="text-sm font-semibold text-slate-600">{user?.name || "User"}</span>

              <motion.button
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-1.5"
                onClick={() => { setRun(false); setTimeout(() => setRun(true), 100); }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                <HelpCircle size={14} /> Guide
              </motion.button>
            </div>
          </div>

          {/* Row 2: Custom date range */}
          <AnimatePresence>
            {interval === "custom" && (
              <motion.div
                initial={hasMounted ? { opacity: 0, height: 0 } : false}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 flex-wrap">
                  <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-slate-500 font-medium">From</label>
                    <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-slate-500 font-medium">To</label>
                    <input type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all" />
                  </div>
                  {customFrom && customTo && (
                    <motion.button
                      initial={hasMounted ? { opacity: 0, scale: 0.9 } : false}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => { setCustomFrom(""); setCustomTo(""); setIntervalKey("7d"); }}
                      className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
                    >
                      Clear
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Row 3: Comparison + Filter */}
          {hasActiveSchedule && (
            <div className="flex items-start gap-4 mt-3 pt-3 border-t border-slate-100 flex-wrap">
              <div id="comparison-bar" className="flex-1 min-w-[260px]">
                <ComparisonBar value={comparisonFilters} onChange={setComparisonFilters} />
              </div>
              <div id="filter-bar" className="flex-shrink-0">
                <FilterBar dimensionOptions={dimensionOptions} value={dimensionFilters} onChange={setDimensionFilters} />
              </div>
            </div>
          )}
        </header>

        {/* ── MAIN CANVAS ──────────────────────────────────────────────── */}
        <main className="flex-1 p-6 overflow-y-auto flex flex-col">
          {!hasActiveSchedule ? (
            <EmptyState onNew={openCreateConfig} />
          ) : (
            <div ref={exportAreaRef} className="pb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeScheduleId}
                  initial={hasMounted ? { opacity: 0, y: 12 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <DashboardEngine
                    customViews={customViews}
                    onCustomViewsChange={handleCustomViewsChange}
                    results={results}
                    comparisonResults={comparisonResults}
                    loading={loading}
                    error={error}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </main>

        <footer className="bg-white/80 backdrop-blur-md border-t border-slate-100/60 px-6 py-4">
          <p className="text-xs text-slate-400 text-center">
            © {new Date().getFullYear()} CalVant · Reports Dashboard ·{" "}
            {reportConfigs.length} schedule{reportConfigs.length !== 1 ? "s" : ""} configured
            {activeDimCount > 0 && (
              <span className="ml-2 text-indigo-500 font-semibold">
                · {activeDimCount} filter{activeDimCount !== 1 ? "s" : ""} active
              </span>
            )}
          </p>
        </footer>
      </div>

      {/* ── REPORT CONFIG MODAL ───────────────────────────────────────── */}
      <AnimatePresence>
        {showConfigModal && (
          <ReportConfigModal
            config={editingConfig}
            organization={organization}
            userId={user?.id || user?.userId || ""}
            availableSources={availableSources.length > 0 ? availableSources : ["risks", "audit", "tasks", "dpia", "documents", "aiia"]}
            onSave={handleConfigSaved}
            onDelete={handleConfigDeleted}
            onClose={() => { setShowConfigModal(false); setEditingConfig(null); }}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}