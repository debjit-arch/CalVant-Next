"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Users,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  LogOut,
  CheckCircle2,
  Circle,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  HelpCircle,
  X,
} from "lucide-react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import Joyride from "react-joyride";
import { motion, AnimatePresence } from "framer-motion";
import { useEffectiveOrg } from "@/hooks/useEffectiveOrg";
import { captureActivity, ACTIONS } from "@/services/activities";
import {
  listPersons,
  listOffboardingCases,
  listTickets,
  listTraining,
  listBackgroundChecksForPerson,
} from "../services/peopleApi";
import { canWrite } from "../utils/peopleFormat";
import PersonFormModal from "../components/PersonFormModal";

const PEOPLE_HELP_CONTENT = `
## 1. Introduction

The People Module in CalVant covers the compliance side of each employee's lifecycle — screening before day one, policy sign-off during employment, training, disciplinary and security-event records, and access removal on exit.

## 2. Accessing the People Module

Use the left-hand navigation sidebar to open People. This lands you on the People Dashboard — the home base for the module, matching the layout you already know from Risk and Policies.

## 3. Key Terminology

| Term | Meaning |
|---|---|
| Lifecycle status | Where a person is right now — Onboarding, Active, Offboarding, or Terminated. |
| Screening (BGV) | Background verification, run with a connected vendor or recorded manually by HR. |
| Employment Documents | T&C of Employment, NDA, and Post-termination acknowledgements — one screen, three entry points. |
| Tickets | Disciplinary breaches and reported security events, synced from the connected ticketing system where available. |
| Offboarding case | The linked-account review and deactivation workflow tracked for a departing employee. |

## 4. Manual Navigation

### 4.1 People Dashboard

At-a-glance counts across the workforce, with one quick action into the Directory.

1. **Summary tiles** — total people, lifecycle status, screening cleared, open tickets, and pending trainings.
2. **Workforce Status** — a donut chart showing the lifecycle distribution.
3. **New Joiners** — a bar chart of joiners per month for the selected year.
4. **Quick Actions** — **Create Directory** opens the add-person form right here on the dashboard; **View Directory** takes you to the full one-view table below.

Use the refresh icon to reload dashboard data, or the Guide button for an in-app walkthrough.

### 4.2 People Directory — the one view

Everything about a person lives in a single screen now, the same **one view** pattern the MLD screen uses:

- The **Directory table** lists everyone, with Screening, Documents, Learning, Tickets and Offboarding status all shown as columns — no separate tab to visit for any of them.
- Clicking a row opens that person's **detail drawer**, which brings together Screening (BGV), Policy acceptance (T&C/NDA/Post-termination), Learning, Tickets, and Offboarding in one place, each with its own actions (Initiate, Refresh, Update, Start offboarding, Manage).
`;

function useUserRoles() {
  const [roles, setRoles] = useState([]);
  useEffect(() => {
    try {
      const token =
        (typeof window !== "undefined" &&
          (sessionStorage.getItem("token") || localStorage.getItem("token"))) ||
        "";
      if (!token) return;
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      const raw = payload.roles || payload.role || [];
      setRoles((Array.isArray(raw) ? raw : [raw]).filter(Boolean).map((r) => String(r).toLowerCase()));
    } catch {
      setRoles([]);
    }
  }, []);
  return roles;
}

const PIE_COLORS = {
  Active: "#10b981",
  Onboarding: "#0ea5e9",
  Offboarding: "#f59e0b",
  Terminated: "#94a3b8",
};

const PeopleDashboard = () => {
  const router = useRouter();
  const chartsContainerRef = useRef(null);
  const { user, isPrivilegedRole } = useEffectiveOrg();
  const roles = useUserRoles();
  const userRoles = roles.length ? roles : (Array.isArray(user?.role) ? user.role : [user?.role || ""]);

  const canEdit = canWrite(userRoles);

  const [run, setRun] = useState(false);
  const [showHelpDoc, setShowHelpDoc] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

  const [persons, setPersons] = useState([]);
  const [offboardingCases, setOffboardingCases] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [training, setTraining] = useState([]);
  const [screeningChecks, setScreeningChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [p, o, dTickets, eTickets, t] = await Promise.all([
      listPersons().catch(() => []),
      listOffboardingCases().catch(() => []),
      listTickets("DISCIPLINARY").catch(() => []),
      listTickets("SECURITY_EVENT").catch(() => []),
      listTraining().catch(() => []),
    ]);
    const personList = Array.isArray(p) ? p : [];
    setPersons(personList);
    setOffboardingCases(Array.isArray(o) ? o : []);
    setTickets([...(Array.isArray(dTickets) ? dTickets : []), ...(Array.isArray(eTickets) ? eTickets : [])]);
    setTraining(Array.isArray(t) ? t : []);
    // Screening (BGV) is folded into the one Directory view now, but the
    // dashboard still surfaces its count — same "list persons, fetch each
    // one's latest check" approach the old Screening tab used.
    const checks = await Promise.all(
      personList.map((person) => listBackgroundChecksForPerson(person.id).catch(() => [])),
    );
    setScreeningChecks(
      checks.map((c) => (c || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] || null),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    captureActivity({ action: ACTIONS.PAGE_LOAD, item: "People · Viewed Dashboard", url: "/people" });
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(window.resizeTimeout);
      window.resizeTimeout = setTimeout(() => window.dispatchEvent(new Event("resize")), 150);
    });
    if (chartsContainerRef.current) resizeObserver.observe(chartsContainerRef.current);
    return () => {
      if (chartsContainerRef.current) resizeObserver.unobserve(chartsContainerRef.current);
      clearTimeout(window.resizeTimeout);
    };
  }, []);

  const peopleStats = useMemo(() => {
    const acc = { total: persons.length, active: 0, onboarding: 0, offboarding: 0, terminated: 0 };
    persons.forEach((p) => {
      const status = (p.lifecycleStatus || "").toUpperCase();
      if (status === "ACTIVE") acc.active++;
      else if (status === "ONBOARDING") acc.onboarding++;
      else if (status === "OFFBOARDING") acc.offboarding++;
      else if (status === "TERMINATED") acc.terminated++;
    });
    return acc;
  }, [persons]);

  const offboardingOpen = useMemo(
    () => offboardingCases.filter((c) => (c.stage || "").toUpperCase() !== "COMPLETE").length,
    [offboardingCases],
  );

  const openTickets = useMemo(
    () => tickets.filter((t) => (t.status || "").toUpperCase() === "OPEN").length,
    [tickets],
  );

  const trainingPending = useMemo(
    () => training.filter((t) => (t.status || "").toUpperCase() !== "COMPLETED").length,
    [training],
  );

  // Screening (BGV) counts for the dashboard tile — cleared vs. still pending/
  // not-started, out of everyone in the directory.
  const screeningStats = useMemo(() => {
    const cleared = screeningChecks.filter((c) => (c?.status || "").toUpperCase() === "CLEARED").length;
    const pending = persons.length - cleared;
    return { cleared, pending };
  }, [screeningChecks, persons]);

  const pieData = useMemo(
    () =>
      [
        { name: "Active", value: peopleStats.active, desc: "Currently employed" },
        { name: "Onboarding", value: peopleStats.onboarding, desc: "In their first cycle" },
        { name: "Offboarding", value: peopleStats.offboarding, desc: "Exiting" },
        { name: "Terminated", value: peopleStats.terminated, desc: "No longer active" },
      ].filter((d) => d.value > 0),
    [peopleStats],
  );

  const availableYears = useMemo(
    () => [
      ...new Set(
        persons
          .map((p) => (p.joiningDate ? new Date(p.joiningDate).getFullYear() : null))
          .filter(Boolean),
      ),
    ],
    [persons],
  );

  const monthlyJoinersData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
      (name) => ({ name, value: 0 }),
    );
    persons.forEach((p) => {
      if (!p.joiningDate) return;
      const date = new Date(p.joiningDate);
      if (date.getFullYear() === selectedYear) months[date.getMonth()].value += 1;
    });
    return months;
  }, [persons, selectedYear]);

  const steps = [
    { target: "#dashboard-header", content: "Welcome to your People dashboard." },
    { target: "#stats-grid", content: "Quick workforce metrics at a glance." },
    { target: "#charts-container", content: "Lifecycle distribution and new-joiner trends." },
    { target: "#action-cards", content: "Quick access to every People-module screen." },
  ];

  const statCards = [
    { Icon: Users, value: peopleStats.total, label: "Users", color: "from-blue-400 to-blue-500", path: "/people/directory" },
    { Icon: CheckCircle2, value: peopleStats.active, label: "Active", color: "from-emerald-400 to-emerald-500", path: "/people/directory?status=ACTIVE" },
    { Icon: Circle, value: peopleStats.onboarding, label: "Onboarding", color: "from-sky-400 to-sky-500", path: "/people/directory?status=ONBOARDING" },
    { Icon: ShieldCheck, value: screeningStats.cleared, label: "Screening Cleared", color: "from-teal-400 to-teal-500", path: "/people/directory" },
    { Icon: LogOut, value: offboardingOpen, label: "Offboarding", color: "from-orange-400 to-orange-500", path: "/people/directory?status=OFFBOARDING" },
    { Icon: AlertTriangle, value: openTickets, label: "Open Tickets", color: "from-red-400 to-red-500", path: "/people/directory" },
    { Icon: GraduationCap, value: trainingPending, label: "Trainings Pending", color: "from-purple-400 to-purple-500", path: "/people/directory" },
  ];

  // One view for everyone — Directory now carries screening, documents and
  // ticket detail per person via its row + drawer, so Quick Actions fan out
  // into just two entry points: create a record, or open the full view.
  const actionCards = [
    ...(canEdit
      ? [
          {
            id: "create",
            icon: UserPlus,
            title: "Create Directory",
            subtitle: "Add a new person to the directory",
            action: () => setShowCreate(true),
            color: "from-blue-400 to-blue-500",
            primary: false,
          },
        ]
      : []),
    {
      id: "view",
      icon: Users,
      title: "View Directory",
      subtitle: "Screening, documents, tickets, learning & offboarding — all in one view",
      path: "/people/directory",
      color: "from-violet-400 to-violet-500",
      primary: true,
    },
  ];

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg">
          <div className="font-semibold text-slate-800 text-sm mb-1">{data.name}</div>
          <div className="text-xl font-bold text-slate-900 mb-1">{data.value}</div>
          <div className="text-xs text-slate-600">{data.desc}</div>
          <div className="text-xs text-slate-500 mt-1">
            {((data.value / (peopleStats.total || 1)) * 100).toFixed(1)}% of total
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg">
          <div className="font-semibold text-slate-800 text-sm mb-1">{data.name}</div>
          <div className="text-xl font-bold text-slate-900 mb-1">{data.value}</div>
          <div className="text-xs text-slate-500">New Joiners</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex flex-col overflow-hidden">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2 lg:py-6 pb-20 lg:pb-26 overflow-hidden">
        <Joyride
          steps={steps.map((s) => ({ ...s, disableBeacon: true }))}
          run={run}
          continuous
          showSkipButton
          scrollToFirstStep
          scrollOffset={200}
          styles={{
            options: { primaryColor: "#7c3aed", width: 300, overlayColor: "rgba(0, 0, 0, 0.5)" },
            spotlight: {
              borderRadius: "12px",
              boxShadow: "0 0 0 3px #ffffff, 0 0 0 6px #7c3aed, 0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            },
          }}
        />

        {/* Header */}
        <motion.header
          id="dashboard-header"
          className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl shadow-md mb-2 lg:mb-2 p-4 lg:p-5"
          initial={hasMounted ? { opacity: 0, y: -15 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between w-full flex-wrap gap-3">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-slate-800">People Dashboard</h1>
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-slate-900">{peopleStats.total}</span> people tracked
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isPrivilegedRole ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
                {isPrivilegedRole ? "Root" : (userRoles[0] ? String(userRoles[0]).replace("_", " ") : "User")}
              </span>
              <span className="text-sm font-semibold text-slate-600 hidden sm:inline">{user?.name || "User"}</span>
              <motion.button
                onClick={loadAll}
                title="Refresh"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw size={15} className="text-slate-500" />
              </motion.button>
              <motion.button
                onClick={() => {
                  captureActivity({ action: ACTIONS.CLICK, item: "People · Open Help Doc", url: "/people" });
                  setShowHelpDoc(true);
                }}
                title="Help Documentation"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <BookOpen size={15} className="text-slate-500" />
              </motion.button>
              <motion.button
                className="px-4 py-2 bg-white text-violet-600 border border-violet-200 hover:bg-violet-50 rounded-full shadow-[0_2px_10px_rgba(124,58,237,0.15)] transition-all duration-200 flex items-center gap-2 text-sm font-bold"
                onClick={() => {
                  captureActivity({ action: ACTIONS.CLICK, item: "People · Open Guide", url: "/people" });
                  setRun(false);
                  setTimeout(() => setRun(true), 100);
                }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <HelpCircle size={16} />
                <span>Tutorial</span>
              </motion.button>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-10 w-full min-w-0">
          {/* Left: Stats + Actions */}
          <div className="space-y-8 lg:space-y-10 w-full min-w-0">
            <motion.section
              id="stats-grid"
              className="grid grid-cols-2 md:grid-cols-3 gap-4 items-stretch"
              initial={hasMounted ? { opacity: 0, y: 15 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {statCards.map(({ Icon, value, label, color, path }, i) => (
                <motion.div
                  key={label}
                  className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center gap-3 h-full min-h-[84px] hover:bg-white"
                  onClick={() => {
                    captureActivity({ action: ACTIONS.CLICK, item: `People · Stat Card - ${label}`, url: "/people" });
                    router.push(path);
                  }}
                  initial={hasMounted ? { opacity: 0, y: 20 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-md flex-shrink-0`}>
                    <Icon size={16} className="lg:size-18 text-white drop-shadow-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-lg lg:text-xl font-semibold text-slate-800 block leading-tight group-hover:text-slate-900">
                      {loading ? "—" : value}
                    </span>
                    <span className="text-[11px] lg:text-xs font-semibold text-slate-600 uppercase tracking-wide leading-snug block pb-0.5">
                      {label}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.section>

            <motion.section
              id="action-cards"
              className="space-y-1"
              initial={hasMounted ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-lg lg:text-xl font-semibold text-slate-800 mb-6 px-1">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence>
                  {actionCards.map(({ id, icon: Icon, title, subtitle, path, action, color, primary }, index) => (
                    <motion.div
                      key={id}
                      className={`group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-4 h-full flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer ${primary ? "ring-2 ring-violet-200/50 bg-gradient-to-br " + color : ""}`}
                      initial={hasMounted ? { opacity: 0, scale: 0.9 } : false}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4, delay: 0.4 + index * 0.06 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        captureActivity({ action: ACTIONS.CLICK, item: `People · Action Card - ${title}`, url: "/people" });
                        if (action) action();
                        else router.push(path);
                      }}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-md flex-shrink-0 ${primary ? "bg-white/20 backdrop-blur-sm" : `bg-gradient-to-br ${color}`}`}>
                        <Icon size={20} className="text-white drop-shadow-sm" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="text-sm lg:text-base font-semibold text-center text-slate-800 leading-tight mb-1 px-1 truncate group-hover:text-violet-600 transition-colors duration-200">
                          {title}
                        </h4>
                        <p className="text-xs font-bold text-center text-slate-600 px-1 truncate">{subtitle}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          </div>

          {/* Right: Charts */}
          <div ref={chartsContainerRef} id="charts-container" className="space-y-4 lg:space-y-3 w-full min-w-0">
            <motion.div
              className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-6 lg:p-7 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-400 h-80 flex flex-col w-full min-w-0"
              initial={hasMounted ? { opacity: 0, scale: 0.95 } : false}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="mb-1 px-1 flex-shrink-0">
                <h3 className="text-base lg:text-lg font-semibold text-slate-800">Workforce Status</h3>
                <p className="text-xs text-slate-500 font-medium">Lifecycle distribution</p>
              </div>
              <div className="flex-1 flex items-center justify-center min-h-0 w-full min-w-0">
                {peopleStats.total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={2}
                        stroke="white"
                        strokeWidth={3}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-sm text-slate-400">{loading ? "Loading…" : "No people yet."}</div>
                )}
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-2 flex-shrink-0">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[d.name] || "#94a3b8" }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-6 lg:p-7 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-400 h-80 flex flex-col w-full min-w-0"
              initial={hasMounted ? { opacity: 0, scale: 0.95 } : false}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="mb-1 px-1 flex-shrink-0 flex items-center justify-between">
                <div>
                  <h3 className="text-base lg:text-lg font-semibold text-slate-800">New Joiners</h3>
                  <p className="text-xs text-slate-500 font-medium">By month, {selectedYear}</p>
                </div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  style={{
                    fontSize: "12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    background: "white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    cursor: "pointer",
                  }}
                >
                  {availableYears.length > 0 ? (
                    availableYears.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))
                  ) : (
                    <option value={selectedYear}>{selectedYear}</option>
                  )}
                </select>
              </div>

              <div style={{ width: "100%", height: "100%", minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <BarChart data={monthlyJoinersData} margin={{ top: 15, right: 15, left: -5, bottom: 10 }}>
                    <defs>
                      <linearGradient id="peopleGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#c4b5fd" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="value" fill="url(#peopleGradient)" radius={[6, 6, 0, 0]} barSize={24} animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Create Directory — same single-view form modal used inside the Directory itself */}
      {showCreate && (
        <PersonFormModal
          onClose={() => setShowCreate(false)}
          onSaved={(created) => {
            captureActivity({ action: ACTIONS.CLICK, item: `People · Created ${created?.name || "person"}`, url: "/people" });
            setShowCreate(false);
            setPersons((prev) => [created, ...prev]);
            router.push("/people/directory");
          }}
        />
      )}

      {/* Help Documentation Modal */}
      <AnimatePresence>
        {showHelpDoc && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHelpDoc(false)}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-violet-500" />
                  <h3 className="text-base font-semibold text-slate-800">People Module Help</h3>
                </div>
                <button
                  onClick={() => setShowHelpDoc(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <X size={16} className="text-slate-500" />
                </button>
              </div>

              <div className="overflow-y-auto px-6 py-5 prose-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-slate-900 mb-2 mt-4" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-base font-semibold text-slate-800 mt-5 mb-2" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-sm font-semibold text-slate-800 mt-4 mb-1.5" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-semibold text-slate-800" {...props} />,
                    p: ({ node, ...props }) => <p className="text-sm text-slate-600 mb-3 leading-relaxed" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1.5 mb-3" {...props} />,
                    li: ({ node, ...props }) => <li className="text-sm text-slate-700" {...props} />,
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto mb-4">
                        <table className="min-w-full text-sm border border-slate-200 rounded-lg" {...props} />
                      </div>
                    ),
                    thead: ({ node, ...props }) => <thead className="bg-slate-50" {...props} />,
                    th: ({ node, ...props }) => <th className="text-left font-semibold text-slate-700 px-3 py-2 border-b border-slate-200" {...props} />,
                    td: ({ node, ...props }) => <td className="px-3 py-2 border-b border-slate-100 text-slate-600 align-top" {...props} />,
                    hr: () => <hr className="my-4 border-slate-100" />,
                  }}
                >
                  {PEOPLE_HELP_CONTENT}
                </ReactMarkdown>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-md border-t border-slate-100/50 shadow-lg px-6 py-4 lg:px-8 lg:py-5 sticky bottom-0 z-50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm lg:text-base text-slate-600 font-medium">
            © {new Date().getFullYear()} CalVant. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PeopleDashboard;
