import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  AlertTriangle,
  ClipboardList,
  CheckSquare,
  ShieldCheck,
  FileText,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Calendar,
  BarChart3,
  ChevronRight,
  Download,
  FileJson,
  FileSpreadsheet,
  Settings2,
  HelpCircle,
  GitCompareArrows,
  SlidersHorizontal,
  Pencil,
} from "lucide-react";
import Joyride, { STATUS } from "react-joyride";

import DashboardEngine from "../components/DashboardEngine";
import {
  DASHBOARD_TEMPLATES,
  TEMPLATE_ORDER,
} from "../components/dashboardSchema";
import { useDashboardData } from "../../../hooks/useDashboardData";
import { useDashboardExport } from "../../../hooks/useDashboardExport";
import ComparisonBar from "../components/ComparisonBar";
import FilterBar from "../components/FilterBar";
import ReportConfigModal from "../components/ReportConfigModal";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const INTERVALS = [
  { key: "7d", label: "7 Days" },
  { key: "14d", label: "14 Days" },
  { key: "90d", label: "90 Days" },
  { key: "custom", label: "Custom" },
];

const SIDEBAR_ICONS = {
  LayoutDashboard,
  AlertTriangle,
  ClipboardList,
  CheckSquare,
  ShieldCheck,
  FileText,
  Activity,
  BarChart3,
  Settings2,
};

const BASE_URL = "https://api.calvant.com/reports-service/api/reports";

// ─── ORG / TOKEN HELPERS ──────────────────────────────────────────────────────
function getDefaultOrg() {
  try {
    return (
      sessionStorage.getItem("orgId") ||
      JSON.parse(sessionStorage.getItem("user") || "{}").organization ||
      JSON.parse(sessionStorage.getItem("user") || "{}").organizationId ||
      ""
    );
  } catch {
    return "";
  }
}

function getToken() {
  try {
    return sessionStorage.getItem("token") || "";
  } catch {
    return "";
  }
}

// ─── SIDEBAR ITEM ─────────────────────────────────────────────────────────────
function SidebarItem({ template, isActive, onClick }) {
  const Icon = SIDEBAR_ICONS[template.icon] ?? LayoutDashboard;
  return (
    <motion.button
      whileHover={{ x: 2 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
        isActive
          ? "bg-white shadow-sm text-slate-800"
          : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
          isActive
            ? `bg-gradient-to-br ${template.gradient} shadow-md`
            : "bg-slate-100 group-hover:bg-slate-200"
        }`}
      >
        <Icon
          size={14}
          className={isActive ? "text-white" : "text-slate-500"}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-semibold truncate ${isActive ? "text-slate-800" : "text-slate-600"}`}
        >
          {template.label}
        </p>
      </div>
      {isActive && (
        <ChevronRight size={12} className="text-slate-400 flex-shrink-0" />
      )}
    </motion.button>
  );
}

// ─── EXPORT DROPDOWN ─────────────────────────────────────────────────────────
function ExportDropdown({
  onConfig,
  onSnapshot,
  onCSV,
  onComparison,
  onPDF,
  hasComparison,
}) {
  const [open, setOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-600 transition-colors"
      >
        <Download size={13} />
        Export
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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1.5">
                Export As
              </p>

              <button
                onClick={() => {
                  onConfig();
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Settings2 size={13} className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Dashboard Config
                  </p>
                  <p className="text-[10px] text-slate-400">
                    JSON schema · layout + KPIs
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  onSnapshot();
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <FileJson size={13} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Data Snapshot
                  </p>
                  <p className="text-[10px] text-slate-400">
                    JSON · resolved KPI values
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  onCSV();
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet size={13} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Raw Data CSV
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Active sources only
                  </p>
                </div>
              </button>

              {hasComparison && (
                <button
                  onClick={() => {
                    onComparison();
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <GitCompareArrows size={13} className="text-violet-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      Comparison CSV
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Primary vs comparison period
                    </p>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  onPDF();
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <FileText size={13} className="text-rose-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Download PDF
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Visual screenshot
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Maps a dataSource name → dashboard template id
const SOURCE_TO_TEMPLATE = {
  risks: "risks",
  audit: "audit",
  tasks: "tasks",
  dpia: "dpia",
  documents: "documents",
  aiia: "aiia",
};

// Maps intervalType → interval key used by the filter
const INTERVAL_TYPE_TO_KEY = {
  DAILY: "7d",
  WEEKLY: "7d",
  MONTHLY: "90d",
  QUARTERLY: "90d",
  YEARLY: "custom",
  HOURLY: "7d",
  CUSTOM_DAYS: "7d",
  CUSTOM_MONTHS: "90d",
  CUSTOM_YEARS: "custom",
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ReportsDashboard() {
  const [organization] = useState(getDefaultOrg);
  const [activeDashboardId, setActiveDashboardId] = useState(TEMPLATE_ORDER[0]);
  const [activeScheduleId, setActiveScheduleId] = useState(null);

  // ── date window filter ────────────────────────────────────────────────────
  const [interval, setIntervalKey] = useState("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const resetDashboardState = useCallback(() => {
    setActiveScheduleId(null);
    setActiveDashboardId(TEMPLATE_ORDER[0]);
    setIntervalKey("7d");
    setCustomFrom("");
    setCustomTo("");
  }, []);

  const handleScheduleClick = useCallback(
    (cfg) => {
      // toggle off if already selected — reset to default
      if (activeScheduleId === cfg.id) {
        resetDashboardState();
        return;
      }

      setActiveScheduleId(cfg.id);

      // multiple sources → executive overview
      if (cfg.dataSources?.length > 1) {
        setActiveDashboardId("executive");
      } else {
        const primarySource = cfg.dataSources?.find(
          (s) => SOURCE_TO_TEMPLATE[s],
        );
        if (primarySource)
          setActiveDashboardId(SOURCE_TO_TEMPLATE[primarySource]);
      }

      // interval
      const mappedInterval = INTERVAL_TYPE_TO_KEY[cfg.intervalType] ?? "7d";
      setIntervalKey(mappedInterval);

      if (
        cfg.intervalType === "YEARLY" ||
        cfg.intervalType === "CUSTOM_YEARS"
      ) {
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
    return {
      enabled: false,
      from: d.toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
    };
  });

  // ── dimension filter ──────────────────────────────────────────────────────
  const [dimensionFilters, setDimensionFilters] = useState({
    department: [],
    client: [],
    branch: [],
  });

  // ── report config modal ───────────────────────────────────────────────────
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null); // null = create mode
  const [reportConfigs, setReportConfigs] = useState([]);
  const [availableSources, setAvailableSources] = useState([]);
  const [configsLoaded, setConfigsLoaded] = useState(false);

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const [user] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });
  const userRoles = useMemo(() => {
    if (!user) return [];
    return Array.isArray(user.role) ? user.role : user.role ? [user.role] : [];
  }, [user]);
  const isRoot = userRoles.includes("root");

  const [run, setRun] = useState(false);
  const steps = [
    {
      target: "#dashboard-header",
      content:
        "Welcome to your Reports Dashboard. Access visual reports across compliance modules.",
    },
    {
      target: "#sidebar-navigation",
      content: "Switch between different report templates using this sidebar.",
    },
    {
      target: "#kpis-container",
      content: "Key performance indicators for the active module.",
    },
    {
      target: "#charts-container",
      content: "Charts and tables visualizing compliance data.",
    },
    {
      target: "#comparison-bar",
      content: "Compare the current period against any past date range.",
    },
    {
      target: "#filter-bar",
      content: "Filter by department, client, or branch.",
    },
  ];

  const exportAreaRef = useRef(null);

  // ── active config ─────────────────────────────────────────────────────────
  const activeConfig = useMemo(
    () =>
      DASHBOARD_TEMPLATES[activeDashboardId] ??
      DASHBOARD_TEMPLATES[TEMPLATE_ORDER[0]],
    [activeDashboardId],
  );

  const filters = useMemo(
    () => ({ interval, customFrom, customTo }),
    [interval, customFrom, customTo],
  );

  // ── data hook (5-arg signature) ───────────────────────────────────────────
  const {
    results,
    comparisonResults,
    dimensionOptions,
    loading,
    error,
    refetch,
    lastFetched,
    online,
  } = useDashboardData(
    activeConfig,
    organization,
    filters,
    comparisonFilters,
    dimensionFilters,
  );

  // ── export hook ───────────────────────────────────────────────────────────
  const {
    exportConfig,
    exportSnapshot,
    exportCSV,
    exportComparison,
    exportPDF,
  } = useDashboardExport({ config: activeConfig, results, comparisonResults });

  // ── fetch report configs for the schedule modal ───────────────────────────
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
      const configs = Array.isArray(json?.data)
        ? json.data // ← change is here
        : Array.isArray(json)
          ? json
          : [];
      setReportConfigs(configs);
    } catch {}
  }, [organization]);

  const fetchAvailableSources = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/sources`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error("no sources endpoint");
      const json = await res.json();
      const sources = Array.isArray(json.data) ? json.data : [];
      if (sources.length > 0) setAvailableSources(sources);
      else throw new Error("empty");
    } catch {
      // endpoint not yet implemented — use known sources
      setAvailableSources([
        "risks",
        "audit",
        "tasks",
        "dpia",
        "documents",
        "aiia",
      ]);
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
  const openCreateConfig = () => {
    setEditingConfig(null);
    setShowConfigModal(true);
  };

  const openEditConfig = (cfg) => {
    setEditingConfig(cfg);
    setShowConfigModal(true);
  };

  const handleConfigSaved = (saved) => {
    setReportConfigs((prev) => {
      // match by id first, then by reportName (delete+recreate changes the id)
      const idx = prev.findIndex(
        (c) => c.id === saved.id || c.reportName === saved.reportName,
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    // re-fetch to get the canonical list from backend
    fetchConfigs();
  };
  const handleConfigDeleted = useCallback(
    (deletedId) => {
      setReportConfigs((prev) => prev.filter((c) => c.id !== deletedId));
      // if the deleted config was driving the current view, reset everything
      if (activeScheduleId === deletedId) {
        resetDashboardState();
      }
    },
    [activeScheduleId, resetDashboardState],
  );

  // ── custom range label ────────────────────────────────────────────────────
  const customRangeLabel = useMemo(() => {
    if (!customFrom) return "Custom";
    const from = new Date(customFrom).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    if (!customTo) return `From ${from}`;
    const to = new Date(customTo).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    return `${from} – ${to}`;
  }, [customFrom, customTo]);

  // ── dimension filter active count ─────────────────────────────────────────
  const activeDimCount =
    (dimensionFilters.department?.length ?? 0) +
    (dimensionFilters.client?.length ?? 0) +
    (dimensionFilters.branch?.length ?? 0);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/20 flex"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      <Joyride
        steps={steps}
        run={run}
        continuous
        showSkipButton
        scrollToFirstStep
        styles={{ options: { primaryColor: "#3b82f6", width: 300 } }}
        callback={(data) => {
          if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status))
            setRun(false);
        }}
      />

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside
        id="sidebar-navigation"
        className="w-56 flex-shrink-0 bg-white/60 backdrop-blur-md border-r border-slate-100/60 flex flex-col gap-2 p-3 sticky top-0 h-screen overflow-y-auto"
      >
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1">
          Dashboards
        </p>
        <nav className="flex flex-col gap-0.5">
          {TEMPLATE_ORDER.map((id) => (
            <SidebarItem
              key={id}
              template={DASHBOARD_TEMPLATES[id]}
              isActive={activeDashboardId === id}
              onClick={() => setActiveDashboardId(id)}
            />
          ))}
        </nav>

        {/* Report schedules section */}
        <div className="mt-auto pt-3 border-t border-slate-100 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1">
            Schedules
          </p>
          {reportConfigs.slice(0, 4).map((cfg) => (
            <div
              key={cfg.id}
              onClick={() => handleScheduleClick(cfg)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors border
      ${
        activeScheduleId === cfg.id
          ? "bg-indigo-50 border-indigo-200"
          : "border-transparent hover:bg-indigo-50"
      }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.active ? "bg-emerald-400" : "bg-slate-300"}`}
              />
              <span
                className={`text-xs flex-1 truncate transition-colors
      ${
        activeScheduleId === cfg.id
          ? "text-indigo-700 font-semibold"
          : "text-slate-600 group-hover:text-indigo-600"
      }`}
              >
                {cfg.reportName}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditConfig(cfg);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                title="Edit schedule"
              >
                <Pencil
                  size={10}
                  className="text-slate-400 hover:text-indigo-500"
                />
              </button>
            </div>
          ))}
          <button
            onClick={openCreateConfig}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-semibold
              text-indigo-600 hover:bg-indigo-50 transition-all"
          >
            <span className="text-sm leading-none">＋</span>
            New schedule
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── HEADER ───────────────────────────────────────────────────── */}
        <header
          id="dashboard-header"
          className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100/60 px-6 py-4"
        >
          {/* Row 1: title + controls */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeConfig.gradient} flex items-center justify-center shadow-md flex-shrink-0`}
              >
                {React.createElement(
                  SIDEBAR_ICONS[activeConfig.icon] ?? BarChart3,
                  { size: 18, className: "text-white" },
                )}
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-800 leading-tight">
                  {activeConfig.label}
                </h1>
                <p className="text-xs text-slate-500">
                  {activeConfig.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Online status */}
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${online ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
              >
                {online ? (
                  <>
                    <Wifi size={11} /> Live
                  </>
                ) : (
                  <>
                    <WifiOff size={11} /> Offline
                  </>
                )}
              </span>

              {lastFetched && (
                <span className="text-xs text-slate-400 hidden sm:block">
                  Synced {lastFetched.toLocaleTimeString()}
                </span>
              )}

              <motion.button
                onClick={refetch}
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 disabled:opacity-60 flex items-center justify-center"
              >
                <RefreshCw
                  size={14}
                  className="text-slate-500"
                  style={
                    loading ? { animation: "spin 1s linear infinite" } : {}
                  }
                />
              </motion.button>

              <ExportDropdown
                onConfig={exportConfig}
                onSnapshot={exportSnapshot}
                onCSV={exportCSV}
                onComparison={exportComparison}
                onPDF={() => exportPDF(exportAreaRef)}
                hasComparison={comparisonFilters.enabled}
              />

              {/* Interval selector */}
              <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
                {INTERVALS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setIntervalKey(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                      interval === key
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {key === "custom" && <Calendar size={10} />}
                    {key === "custom" && interval === "custom"
                      ? customRangeLabel
                      : label}
                  </button>
                ))}
              </div>

              {/* Edit schedule button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={openCreateConfig}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200
                  border border-slate-200 text-xs font-semibold text-slate-600 transition-colors"
                title="Manage report schedules"
              >
                <Settings2 size={13} />
                Schedule
              </motion.button>

              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full ${isRoot ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}
              >
                {isRoot
                  ? "Root"
                  : userRoles[0]
                    ? userRoles[0].replace("_", " ")
                    : "User"}
              </span>
              <span className="text-sm font-semibold text-slate-600">
                {user?.name || "User"}
              </span>

              <motion.button
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-1.5"
                onClick={() => {
                  setRun(false);
                  setTimeout(() => setRun(true), 100);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <HelpCircle size={14} />
                Guide
              </motion.button>
            </div>
          </div>

          {/* Row 2: Custom date range (when interval = custom) */}
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
                  <Calendar
                    size={13}
                    className="text-slate-400 flex-shrink-0"
                  />
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-slate-500 font-medium">
                      From
                    </label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-slate-500 font-medium">
                      To
                    </label>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      min={customFrom}
                      className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                    />
                  </div>
                  {customFrom && customTo && (
                    <motion.button
                      initial={hasMounted ? { opacity: 0, scale: 0.9 } : false}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => {
                        setCustomFrom("");
                        setCustomTo("");
                        setIntervalKey("7d");
                      }}
                      className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
                    >
                      Clear
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Row 3: Comparison bar + Filter bar */}
          <div className="flex items-start gap-4 mt-3 pt-3 border-t border-slate-100 flex-wrap">
            {/* Comparison */}
            <div id="comparison-bar" className="flex-1 min-w-[260px]">
              <ComparisonBar
                value={comparisonFilters}
                onChange={setComparisonFilters}
              />
            </div>

            {/* Filter */}
            <div id="filter-bar" className="flex-shrink-0">
              <FilterBar
                dimensionOptions={dimensionOptions}
                value={dimensionFilters}
                onChange={setDimensionFilters}
              />
            </div>
          </div>
        </header>

        {/* ── MAIN CANVAS ──────────────────────────────────────────────── */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div ref={exportAreaRef} className="pb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeDashboardId}
                initial={hasMounted ? { opacity: 0, y: 12 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DashboardEngine
                  config={activeConfig}
                  results={results}
                  comparisonResults={comparisonResults}
                  loading={loading}
                  error={error}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <footer className="bg-white/80 backdrop-blur-md border-t border-slate-100/60 px-6 py-4">
          <p className="text-xs text-slate-400 text-center">
            © {new Date().getFullYear()} CalVant · Reports Dashboard ·{" "}
            {Object.keys(DASHBOARD_TEMPLATES).length} modules configured
            {activeDimCount > 0 && (
              <span className="ml-2 text-indigo-500 font-semibold">
                · {activeDimCount} filter{activeDimCount !== 1 ? "s" : ""}{" "}
                active
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
            availableSources={
              availableSources.length > 0
                ? availableSources
                : Object.keys(
                    activeConfig.dataModule
                      ? { [activeConfig.dataModule]: 1 }
                      : {
                          risks: 1,
                          audit: 1,
                          tasks: 1,
                          dpia: 1,
                          documents: 1,
                          aiia: 1,
                        },
                  )
            }
            onSave={handleConfigSaved}
            onDelete={handleConfigDeleted}
            onClose={() => {
              setShowConfigModal(false);
              setEditingConfig(null);
            }}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
