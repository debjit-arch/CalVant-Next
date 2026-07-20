//WorkingModel
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEffectiveOrg } from "@/hooks/useEffectiveOrg";
import { motion, AnimatePresence } from "framer-motion";
import Joyride, { STATUS } from "react-joyride";
import {
  Shield,
  ClipboardList,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  RefreshCw,
  BookOpen,
  UserCheck2,
  HelpCircle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import tprmService from "../services/tprmService";
import VendorSection from "./VendorSection";
import TPRMQuestionsModal from "../components/TPRMQuestionModal";
import ConductTPRMModal from "../components/ConductTPRMModal";
import TPRMReportModal from "../components/TPRMReportModal";
import HelpDocModal from "@/components/shared/HelpDocModal";

const TPRMSection = () => {
  const router = useRouter();
  const chartsContainerRef = useRef(null);

  const {
    user,
    mounted,
    isRoot,
    isPrivilegedRole,
    isViewingManagedOrg,
    effectiveOrgId,
    effectiveOrgIds,
    selectedChildOrg,
  } = useEffectiveOrg();
  const org = effectiveOrgId;
  const userName = user?.name || "Admin";
  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role || ""];
  const isAdmin = isPrivilegedRole || userRoles.some((r) => {
    const s = (typeof r === 'string' ? r : (r && (r.name || r.roleName)) || '').toLowerCase().replace(/[\s_-]/g,'');
    return s === 'admin';
  });

  const [modal, setModal] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []); // "questions" | "conduct" | "report"
  const [run, setRun] = useState(false);
  const [showHelpDoc, setShowHelpDoc] = useState(false);

const TPRM_HELP_CONTENT = `
# **calvant** 

Digital Compliance Management 

## **Vendor Module** 

### **End-User Guide** 

Version 1.0  |  July 2026 

© 2026 CalVant. All rights reserved. 

#### **Table of Contents** 

###### **1. Introduction** 

###### **2. Accessing the Vendor Module** 

###### **3. Key Terminology** 

###### **4. Manual Navigation** 

4.1 TPRM Dashboard 4 

4.2 Creating a New Vendor Assessment 

4.2.1 Step 1 — Assessment Details 

4.2.2 Step 2 — Select Questions 

4.3 Tracking Sent Assessments 

4.4 Vendor Assessment Portal 

###### **5. Status & Quality Reference** 

###### **6. Tips, Best Practices & Troubleshooting** 

#### **1. Introduction** 

The Vendor Module in CalVant helps you assess, monitor, and manage the risk posed by third-party vendors as part of your Third Party Risk Management (TPRM) program. It lets you build vendor assessments from a structured quesDon bank, send them to vendors, and track each response from submission through to approval. 

#### **2. Accessing the Vendor Module** 

1. Click the Vendor icon in the sidebar to land on your Third Party Risk Management Dashboard 

2. Your logged-in user name and role appear in the top-right of the dashboard header. 

3. Vendors have their own view and access their own assigned assessments through the Vendor Assessment Portal (SecDon 4.4) using their vendor login. 

#### **3. Key Terminology** 

A short list of terms that are specific to CalVant's policy workflow rather than self-explanatory from the screen itself 

|**Field**|**Descrip5on**|
|---|---|
|**TPRM**|Third Party Risk Management — the process of assessing and monitoring risk<br>posed by vendors and other third parDes.|
|**Vendor**|The third-party organizaDon being assessed. A vendor must have TPRM module<br>access before an assessment can be assigned to it.|
|**Vendor Portal**|The vendor-facing view where an assigned vendor completes and submits an<br>assessment.|
|**Status Guide**|The reference panel in the Vendor Portal explaining what each assessment status<br>means from the vendor's perspecDve.|



##### **4. Manual Naviga5on** 

The TPRM Dashboard is your home base for third-party risk management. It gives you an at-a-glance summary of every vendor assessment in your organizaDon, along with quick acDons to manage quesDons, 



<!-- Start of picture text -->
Q., Third Party Risk Management Root John © ® Guide<br>Root Dashboard - O total assessments<br>0 0 0 Assessment Status<br>TOTAL SENT SUBMITTED<br>Y)<br>APPROVED REJECTED<br>Quick Actions<br>n | P| @ Assessment Trends<br>Assessments by month 0 total<br>TPRM Questions Plan TPRM Vendor Report<br>View & manage question Create & send View scores & approve<br>bank assessments vendors<br><!-- End of picture text -->

###### Conduct TPRM 

Create new assessment 

###### 1) Assessment Details Select Questions 

Assessment Title * 

- e.g. Q1 2026 Vendor Security Assessment 

- & Assign to Vendor * 



<!-- Start of picture text -->
Select vendor... Vv<br>No vendors found with TPRM module access.<br>Due Date *<br>dd/mm/yyyy im<br><!-- End of picture text -->

- f Due Date * 



<!-- Start of picture text -->
Next: Select Questions ><br><!-- End of picture text -->





<!-- Start of picture text -->
mm<br><!-- End of picture text -->

###### Conduct TPRM Create new assessment 

© Back to List o x 



<!-- Start of picture text -->
Assessment Details<br>Q Search questions... O select all )| 0/56 selected<br>SECTION t ; o7<br>Information Security Governance<br>SECTION 2<br>Data Protection;  & Privacy; on7 Vv<br>SEEN 3 Op<br>Security Controls<br>SECTION 4 o/a Vv<br>Incident Management<br>Title Vendor Due Date Questions<br>A Debjait Tech 31-07-2026 0 selected<br>€ Back YJ Submit<br><!-- End of picture text -->



<!-- Start of picture text -->
Conduct TPRM + New Assessment o x<br>0 assessments<br>Due Received Completed<br>No assessments yet<br>Click "New Assessment" to create one<br><!-- End of picture text -->



<!-- Start of picture text -->
0 0 0 Assessment Status<br>TOTAL ad PENDING © SUBMITTED<br>0 0 No assessments yet<br>Y<br>APPROVED © | REJECTED<br>Assessments assigned to you will appear here<br>Assessments Sent Submitted Under_review Approved<br>Status Guide<br>@ Pending Answer<br>Admin has sent you a questionnaire to fill<br>No assessments found @ Submitted<br>You have no assessments assigned yet You submitted — admin is reviewing<br>@ Approved<br>Admin has approved your submission<br>@ Rejected<br>Admin has rejected — check comments<br><!-- End of picture text -->

_Figure 5 — Vendor Assessment Portal_ 

**1.** Summary Dles — Total, Pending, SubmiOed, Approved, and Rejected counts for the logged-in vendor. 

**2.** Assessment Status — shows “No assessments yet” unDl an assessment is assigned to the vendor. 

**3.** Assessments panel — filter by All, Sent, SubmiOed, Under_review, or Approved to track progress. 

**4.** Status Guide — explains each status in plain language so the vendor knows what acDon, if any, is required. 

#### **5. Status & Quality Reference** 

###### **TPRM Assessment Status (Admin View)** 

|**Status**|**Meaning**|
|---|---|
|**Sent**|The assessment has been sent to the vendor and is awaiDng a response.|
|**SubmiMed**|The vendor has submiOed the assessment; it is awaiDng admin review.|
|**Approved**|The submission has been reviewed and approved.|
|**Rejected**|The submission has been reviewed and rejected.|



###### **Vendor Portal Status Guide** 

|**Status**|**Meaning**|
|---|---|
|**Pending Answer**|The admin has sent the vendor a quesDonnaire to fll out.|
|**SubmiMed**|The vendor has submiOed the assessment; the admin is reviewing it.|
|**Approved**|The admin has approved the vendor's submission.|
|**Rejected**|The admin has rejected the submission; the vendor should check the comments.|



#### **6. Tips, Best Practices** 

1. Grant a vendor TPRM module access before planning an assessment; otherwise the Assign to Vendor field will show “No vendors found with TPRM module access”. 

2. Use Select All at the secDon level to send a standard, framework-aligned quesDon set, then remove secDons that don't apply to a specific vendor's engagement. 

3. Set realisDc Due Dates in Assessment Details so vendors have adequate Dme to respond before escalaDon is needed. 

4. Review the Vendor Report regularly to idenDfy vendors nearing rejecDon or requiring follow-up. 

5. Share the Status Guide with new vendors so they understand what Pending Answer, SubmiOed, Approved, 

and Rejected mean for their next acDon. 

**T i p :** K e e p t h e q u e s D o 

n b 

a n k 

c 

u 

r r e n t b y r e v i e 

w i n g T P ~~R~~ 
`;

  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [allQ, setAllQ] = useState([]);

  const steps = [
    {
      target: "#tprm-header",
      content: "Welcome to your Third Party Risk Management (TPRM) dashboard.",
    },
    {
      target: "#stats-grid",
      content: "Overview of assessments by their status (sent, submitted, approved, rejected).",
    },
    {
      target: "#action-cards",
      content: "Manage TPRM questions, plan assessments, or view vendor reports.",
    },
    {
      target: "#charts-container",
      content: "Visualize assessment distribution and trends analysis.",
    },
  ];

  useEffect(() => {
    if (mounted && !user) router.push("/");
  }, [mounted, user, router]);

  // Fix ResizeObserver
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      clearTimeout(window.tprmResizeTimeout);
      window.tprmResizeTimeout = setTimeout(
        () => window.dispatchEvent(new Event("resize")),
        150,
      );
    });
    if (chartsContainerRef.current) ro.observe(chartsContainerRef.current);
    return () => {
      if (chartsContainerRef.current) ro.unobserve(chartsContainerRef.current);
      clearTimeout(window.tprmResizeTimeout);
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!org) return;
    setLoading(true);
    try {
      const [statsData, questionnaires] = await Promise.all([
        tprmService.getStats(org),
        tprmService.getQuestionnaires(org),
      ]);
      setStats(statsData);
      setAllQ(Array.isArray(questionnaires) ? questionnaires : []);
    } finally {
      setLoading(false);
    }
  }, [org]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!mounted || !user) return null;

  // ── Vendor view for non-admins ──────────────────────────
  if (!isAdmin) return <VendorSection />;

  // ── Chart data ──────────────────────────────────────────
  const pieData = [
    { name: "Draft", value: stats.draft, color: "#94a3b8" },
    { name: "Sent", value: stats.sent, color: "#3b82f6" },
    { name: "Submitted", value: stats.submitted, color: "#f59e0b" },
    { name: "Approved", value: stats.approved, color: "#10b981" },
    { name: "Rejected", value: stats.rejected, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  // Monthly trend from questionnaires
  const monthlyData = allQ.reduce((acc, q) => {
    if (!q.createdAt) return acc;
    try {
      const month = new Date(q.createdAt).toLocaleDateString("en-US", {
        month: "short",
      });
      acc[month] = (acc[month] || 0) + 1;
    } catch { }
    return acc;
  }, {});

  const barData = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ].map((m) => ({ name: m, value: monthlyData[m] || 0 }));

  const statCards = [
    {
      label: "Total",
      value: stats.total,
      Icon: BarChart3,
      color: "from-blue-400 to-blue-500",
    },
    {
      label: "Sent",
      value: stats.sent,
      Icon: Send,
      color: "from-sky-400 to-sky-500",
    },
    {
      label: "Submitted",
      value: stats.submitted,
      Icon: Clock,
      color: "from-amber-400 to-amber-500",
    },
    {
      label: "Approved",
      value: stats.approved,
      Icon: CheckCircle2,
      color: "from-emerald-400 to-emerald-500",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      Icon: XCircle,
      color: "from-red-400 to-red-500",
    },
  ];

  const adminActions = [
    {
      key: "questions",
      Icon: BookOpen,
      title: "TPRM Questions",
      subtitle: "View & manage question bank",
      color: "from-blue-400 to-blue-600",
      onClick: () => setModal("questions"),
    },
    {
      key: "conduct",
      Icon: ClipboardList,
      title: "Plan TPRM",
      subtitle: "Create & send assessments",
      color: "from-violet-400 to-violet-600",
      onClick: () => setModal("conduct"),
    },
    {
      key: "report",
      Icon: BarChart3,
      title: "Vendor Report",
      subtitle: "View scores & approve vendors",
      color: "from-emerald-400 to-emerald-600",
      onClick: () => setModal("report"),
    },
  ];

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg">
          <p className="font-semibold text-slate-800 text-sm">{d.name}</p>
          <p className="text-2xl font-bold text-slate-900">{d.value}</p>
          <p className="text-xs text-slate-500">
            {stats.total ? ((d.value / stats.total) * 100).toFixed(1) : 0}% of
            total
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg">
          <p className="font-semibold text-slate-800 text-sm">
            {payload[0].payload.name}
          </p>
          <p className="text-xl font-bold text-slate-900">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  // ── Render ──────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex flex-col overflow-hidden"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-28">
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

        {/* ── HEADER ── */}
        <motion.header
          id="tprm-header"
          className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl shadow-md mb-4 p-6 !text-left"
          style={{
            textAlign: "left",
            width: "100%",
            justifyContent: "flex-start",
            alignItems: "flex-start",
          }}
          initial={hasMounted ? { opacity: 0, y: -15 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between w-full">
            <div
              className="flex items-center gap-4 flex-1"
              style={{
                justifyContent: "flex-start",
                textAlign: "left",
                alignItems: "flex-start",
              }}
            >
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <UserCheck2 className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              <div style={{ textAlign: "left" }}>
                <h1 className="text-2xl font-semibold text-slate-800 leading-tight">
                  Third Party Risk Management
                </h1>
                <p className="text-base text-slate-600 mt-1">
                  Root Dashboard ·{" "}
                  <span className="font-bold text-2xl text-slate-900">
                    {stats.total}
                  </span>{" "}
                  total assessments
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
                Root
              </span>
              <span className="text-sm font-semibold text-slate-600">
                {userName}
              </span>
              <motion.button
                onClick={loadData}
                title="Refresh"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw size={15} className="text-slate-500" />
              </motion.button>

              <motion.button
                onClick={() => setShowHelpDoc(true)}
                title="Help Documentation"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <BookOpen size={15} className="text-slate-500" />
              </motion.button>

              <motion.button
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
                onClick={() => {
                  setRun(false);
                  setTimeout(() => setRun(true), 100);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <HelpCircle size={18} />
                <span>Guide</span>
              </motion.button>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* ── LEFT ── */}
          <div className="space-y-8">
            {/* Stat Cards */}
            <motion.section
              id="stats-grid"
              className="grid grid-cols-2 sm:grid-cols-3 gap-4"
              initial={hasMounted ? { opacity: 0, y: 15 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {statCards.map(({ label, value, Icon, color }, i) => (
                <motion.div
                  key={label}
                  className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center gap-3 h-20 hover:bg-white"
                  initial={hasMounted ? { opacity: 0, y: 20 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setModal("conduct")}
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-md flex-shrink-0`}
                  >
                    <Icon size={20} className="text-white drop-shadow-sm" />
                  </div>
                  <div>
                    <span className="text-2xl font-semibold text-slate-800 block leading-tight group-hover:text-slate-900">
                      {loading ? "—" : value}
                    </span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {label}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.section>

            {/* Quick Actions */}
            <motion.section
              id="action-cards"
              initial={hasMounted ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AnimatePresence>
                  {adminActions.map(
                    ({ key, Icon, title, subtitle, color, onClick }, i) => (
                      <motion.div
                        key={key}
                        className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer"
                        initial={hasMounted ? { opacity: 0, scale: 0.93 } : false}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={onClick}
                      >
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md mb-4`}
                        >
                          <Icon
                            size={22}
                            className="text-white drop-shadow-sm"
                          />
                        </div>
                        <p className="text-sm font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                          {title}
                        </p>
                        <p className="text-xs text-slate-500">{subtitle}</p>
                      </motion.div>
                    ),
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          </div>

          {/* ── RIGHT: CHARTS ── */}
          <div id="charts-container" ref={chartsContainerRef} className="space-y-1">
            {/* Pie Chart */}
            <motion.div
              className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-64 flex flex-col"
              initial={hasMounted ? { opacity: 0, scale: 0.95 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.01 }}
            >
              <h3 className="text-base font-semibold text-slate-800 mb-4">
                Assessment Status
              </h3>
              <div className="flex-1 flex items-center justify-center min-h-0">
                {stats.total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={75}
                        paddingAngle={3}
                        stroke="white"
                        strokeWidth={3}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <text
                        x="50%"
                        y="43%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fill: "#64748b",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Total
                      </text>
                      <text
                        x="50%"
                        y="55%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fill: "#1e293b",
                          fontSize: 22,
                          fontWeight: 800,
                        }}
                      >
                        {stats.total}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <Shield
                      size={40}
                      className="text-slate-300 mb-3"
                      strokeWidth={1.5}
                    />
                    <p className="text-base font-semibold text-slate-400 mb-1">
                      No Assessments Yet
                    </p>
                    <p className="text-sm text-slate-400">
                      Create your first TPRM assessment
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Bar Chart */}
            <motion.div
              className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-72"
              initial={hasMounted ? { opacity: 0, scale: 0.95 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="mb-3">
                <h3 className="text-base font-semibold text-slate-800 mb-1">
                  Assessment Trends
                </h3>
                <p className="text-xs text-slate-500">
                  Assessments by month{" "}
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                    {barData.reduce((s, d) => s + d.value, 0)} total
                  </span>
                </p>
              </div>
              {barData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart
                    data={barData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="#f8fafc"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                    />
                    <YAxis hide />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="value" radius={[5, 5, 0, 0]} barSize={24}>
                      {barData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            [
                              "#3b82f6",
                              "#60a5fa",
                              "#93c5fd",
                              "#bfdbfe",
                              "#dbeafe",
                              "#eff6ff",
                              "#e0f2fe",
                              "#bae6fd",
                              "#7dd3fc",
                              "#38bdf8",
                              "#0ea5e9",
                              "#0284c7",
                            ][i % 12]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <BarChart3
                    size={40}
                    className="text-slate-300 mb-3"
                    strokeWidth={1.5}
                  />
                  <p className="text-base font-semibold text-slate-400 mb-1">
                    No Trend Data
                  </p>
                  <p className="text-sm text-slate-400">
                    Assessments need date fields for trends
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <HelpDocModal
        open={showHelpDoc}
        onClose={() => setShowHelpDoc(false)}
        title="TPRM Help"
        content={TPRM_HELP_CONTENT}
      />

      {/* FOOTER */}
      <footer className="bg-white/90 backdrop-blur-md border-t border-slate-100/50 shadow-lg px-8 py-5 sticky bottom-0 z-50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-slate-500 font-medium">
            © {new Date().getFullYear()} CalVant. All rights reserved.
          </p>
        </div>
      </footer>

      {/* MODALS */}
      {modal === "questions" && (
        <TPRMQuestionsModal
          user={user}
          organization={org}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "conduct" && (
        <ConductTPRMModal
          user={user}
          organization={org}
          onClose={() => setModal(null)}
          onSaved={loadData}
        />
      )}
      {modal === "report" && (
        <TPRMReportModal
          user={user}
          organization={org}
          onClose={() => setModal(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
};

export default TPRMSection;
