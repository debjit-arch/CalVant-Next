//C:\Users\ak192\Downloads\CV_Beta_v1.0.0-Calvant_migration-2\CV_Beta_v1.0.0-Calvant_migration-2\src\modules\dpia\pages\DpiaDashboard.js

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEffectiveOrg } from "@/hooks/useEffectiveOrg";
import { getAllAssessments } from "../services/dpiaApi";
import { captureActivity, ACTIONS } from "../../../services/activities";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import Joyride, { STATUS } from "react-joyride";
import {
  ShieldCheck,
  ClipboardList,
  BarChart3,
  RefreshCw,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  UserCheck,
  Layers,
  Search,
  HelpCircle,
  BookOpen
} from "lucide-react";

// ── Modal imports ─────────────────────────────────────────────────────────────
import AssignDpiaModal from "../components/AssignDpiaModal";
import ManageDpiaAssignmentsModal from "../components/ManageDpiaAssignmentsModal";
import ViewMyDpiasModal from "../components/ViewMyDpiaModal";
import ReviewDpiaFindingsModal from "../components/ReviewDpiaFindingsModal";
import {
  getAllUsers,
  getDepartments,
} from "../../departments/services/userService";
import HelpDocModal from "@/components/shared/HelpDocModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getMonthLabel(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short" });
  } catch {
    return null;
  }
}

// ─── Custom Tooltips ──────────────────────────────────────────────────────────
function PieTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        minWidth: 150,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          color: "#1e293b",
          fontSize: 13,
          marginBottom: 2,
        }}
      >
        {d.name}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#1e293b",
          marginBottom: 2,
        }}
      >
        {d.value}
      </div>
      <div style={{ fontSize: 11, color: "#64748b" }}>
        {((d.value / (total || 1)) * 100).toFixed(1)}% of total
      </div>
    </div>
  );
}

function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
      }}
    >
      <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>
        {d.name}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>
        {d.value}
      </div>
      <div style={{ fontSize: 11, color: "#64748b" }}>assessments</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const {
    user,
    mounted,
    isRoot: hookIsRoot,
    isPrivilegedRole,
    isViewingManagedOrg,
    effectiveOrgId,
    effectiveOrgIds,
    selectedChildOrg,
  } = useEffectiveOrg();
  const isRoot = isPrivilegedRole;
  const organizationId = effectiveOrgId;
  const router = useRouter();
  const chartsContainerRef = useRef(null);
  const pageLoggedRef = useRef(false);
  const [departments, setDepartments] = useState([]);
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  // ── Role detection ────────────────────────────────────────────────────────
  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role || ""];
  const isRiskOwner =
    userRoles.includes("risk_owner") || userRoles.includes("risk_manager");

  const [dpias, setDpias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [riskOwners, setRiskOwners] = useState([]);
  const [run, setRun] = useState(false);

  const [showHelpDoc, setShowHelpDoc] = useState(false);

const DPIA_HELP_CONTENT = `
# **calvant** 

###### Digital Compliance Management 

## **Impact Assessments Module** 

### **End-User Guide** 

_A step-by-step guide to identifying, assessing, treating, and tracking various types of risks in CalVant (DPIA, AIIA, Risk Assessment, etc)_ 

Version 1.0  |  July 2026 

© 2026 CalVant. All rights reserved. 

##### **Table of Contents** 

###### **1. Introduc4on** 

###### **2. Accessing the Impact Assessment Module** 

###### **3. Key Terminology** 

###### **4. Manual Naviga4on** 

4.1 DPIA Dashboard 

4.2 Planning a DPIA 

4.3 Comple:ng a DPIA 

4.4 Viewing DPIA Assessments 

- 4.5 Managing DPIA Assignments 

- 4.6 AI Impact Assessment (AIIA) Dashboard 

- 4.7 Planning an AI Impact Assessment 

4.8 Comple:ng & Managing an AIIA 

4.9 My Assignments 

###### **5. Status & Quality Reference** 

###### **6. Tips, Best Prac4ces & Troubleshoo4ng** 

###### **7. Addi4onal Inf** 

#### **Introduction** 

The Impact Assessment Module in CalVant helps you iden:fy, evaluate, and document the privacy and AI governance risks associated with your organiza:on's data processing ac:vi:es and AI systems. It supports several  linked assessment types — Risk Assessments, Data Protec:on Impact Assessments and AI Impact Assessments  — aligned to frameworks such as GDPR, DPDPA, KSA PDPL, CCPA, ISO 27701, ISO 42001, EU AI Act, etc. 

#### **2. Accessing the Impact Assessment Module** 

1. Click the DPIA icon in the sidebar to land on your DPIA Dashboard, the risk icon to land on your Risk Dashboard or the AIIA icon to land on your AI Impact Assessment Dashboard. 

#### **3. Key Terminology** 

A short list of terms that are specific to CalVant's policy workflow rather than self-explanatory from the screen itself: 

|**Term**|**Defni4on**|
|---|---|
||Data Protec:on Impact Assessment — a structured review of how personal|
|**DPIA**|data is collected, used, and protected, used to iden:fy privacy risk before<br>high-risk processing begins.|
||AI Impact Assessment — a structured review of an AI system's business|
|**AIIA**|objec:ve, intended use, and foreseeable misuse, used to iden:fy AI<br>governance risk before deployment.|



##### **4. Manual Naviga4on** 

###### **4.1 DPIA Dashboard** 

The DPIA Dashboard is your home base for privacy impact assessments. It gives you an at-a-glance summary of every DPIA in your organiza:on, along with quick ac:ons to browse, plan, and manage them. 



<!-- Start of picture text -->
DPIA Dashboard Root John<br>3 0 © 0 ©) 0 Assessment Status<br>TOTAL SUBMITTED IN PROGRESS<br>PENDING<br>Quick Actions<br>@ Assessment Trends<br>View. DPIAs Plan DPIA Assessments by month 0 total<br>Browse all assessments Assign to a risk owner<br>S<br>Manage DPIA<br>View & edit assignments<br><!-- End of picture text -->



<!-- Start of picture text -->
Step 1 — Select Assessment<br><!-- End of picture text -->



<!-- Start of picture text -->
Q Search assessments...<br>re) DRAFT<br>69E-DPIA-2026-002<br>DRAFT<br>69E-DPIA-2026-001<br><!-- End of picture text -->

Next: Set Details > 



<!-- Start of picture text -->
Plan DPIA<br><!-- End of picture text -->

€ Back to List x 

Step 2 — Set Details 

Select Assessment 

So) 69E-DPIA-2026-003DRAFT 

Department * 

Select department... 



<!-- Start of picture text -->
& Assign To (Risk Owner) *<br><!-- End of picture text -->

###### Harvey Spectre 



<!-- Start of picture text -->
Vv<br>Vv<br><!-- End of picture text -->

(3 Due Date * 

###### dd/mm/yyyy 



<!-- Start of picture text -->
A<br><!-- End of picture text -->

Notes / Instructions 

Any context or instructions for the risk owner... 



<!-- Start of picture text -->
Assign DPIA<br><!-- End of picture text -->





<!-- Start of picture text -->
<€ Dashboard<br>New DPIA Assessment<br>ID: 6a572d6367f82d36c95e858c<br>Data Protection Compliance — DPIA Assessment<br>Pll Inventory 2 Personal Data Elements 3 DPIA Questionnaire<br>Data subjects & collection Data element checklist Compliance & obligations<br>Stage 1of3<br>Pll Inventory Assessment<br>Gain visibility into personal data collected — data subjects, elements, purposes, storage, recipients, cross-border transfers, retention<br>requirements, and deletion procedures.<br>| © Who is the anticipated Data Subject? (Select all that apply)<br>(CD a.Current employee (CD b. Former Employee (CD c. Customer's Employee<br>(D d. Customer's Customer CD e. Business Contact (C) f. Users<br>OC g. Other<br>| e In what geographies orjurisdictions do the individuals reside? (Select all that apply)<br>OC) a.Europe OC b. Russia OU c. Latin America (D d. Middle East/ Africa 0 e. China<br>0) f. Asia Pacific 0D g.United States (Dh. Canada ©) i. California (DF j. Other<br><!-- End of picture text -->



<!-- Start of picture text -->
==<br>-<br>SB AllDPIAassessments Assessmentsfor your organization -O shown<br>fo}TOTAL ASSESSMENTS 2 | fo}SUBMITTED fo}IN PROGRESS | © | fo}HIGH RISK<br>Filter: Submitted (0) In Progress (0) High Risk (0)<br>DPIA Assessments O shown<br>No assessments found<br>Try a different filter or create a new assessment.<br><!-- End of picture text -->

###### Manage DPIA Assignments 

x 

19 assignments 

###### 1) Assignments List Edit Assignment 

Q_ Search by project, assignee, status... 

###### COMPLETED 

693-DPIA-2026-001 Z Assigned to: 69955e31e9c9efb38a262e94 Due: 20-03-2026 

###### ASSIGNED 

693-DPIA-2026-006 Z Assigned to: 69955e31e9c9efb38a262e94 Due: 20-03-2026 

###### ASSIGNED 

693-DPIA-2026-007 a Assigned to: 69940aaa660ec82452ab4485 Due: 20-03-2026 



<!-- Start of picture text -->
Al Impactp Assessment Root John © ® Guide:<br>Root Dashboard<br>B Oo Oo aoO Oo Assessment Status<br>TOTAL APPROVED COMPLETED<br>0 0%<br>AVG<br>COMPLETE<br>Quick Actions<br>Assessment Trends<br>Monthly distribution<br>View Assessments Plan Assessment<br>Browse all AIl[A assessments Create a new Al assessment<br>Manage AllA<br>Edit or delete assessments<br><!-- End of picture text -->



<!-- Start of picture text -->
Plan Al Assessment x<br>Fill in the details to create a new assessment<br>Al System Name *<br>e.g., Custon Ipp Chatt<br>Department *<br>Select Department... vy<br>Assessment Date<br>15/07/2026 o<br>© Business Objective, Intended Use, and Foreseeable Misuse will be completed<br>by the assigned Risk Owner before they begin the assessment.<br>Cancel<br><!-- End of picture text -->

x 

###### Manage Al Assessments 



<!-- Start of picture text -->
€ Back to List. Edit: CalVant<br>Step 1 of 2 — Assessment Details<br><!-- End of picture text -->



<!-- Start of picture text -->
Al System Name *<br><!-- End of picture text -->



<!-- Start of picture text -->
CalVant<br><!-- End of picture text -->

Department * 



<!-- Start of picture text -->
IT Infrastructure<br><!-- End of picture text -->



<!-- Start of picture text -->
vy<br><!-- End of picture text -->

###### Business Objective * 



<!-- Start of picture text -->
To gain profit<br><!-- End of picture text -->

Intended Use * 



<!-- Start of picture text -->
To Check Compliance<br><!-- End of picture text -->





<!-- Start of picture text -->
Foreseeable Misuse<br>Al System Owner Email *<br>johndoe@consultantsfactory.com<br>Assessment Date<br>20/04/2026 o<br>Status<br>DRAFT —_<br>Next: Assign Risk Owners —><br><!-- End of picture text -->



<!-- Start of picture text -->
My Assignments G Refresh<br>Al assessments assigned to you for review and completion<br>© 2 Pending @ 0 Completed 2 Total<br>Pending Action 2) Completed<br>E) CalVant20/04/2026 © Action Required<br>To gain profit<br>= Testing © Action Required<br>03/07/2026<br><!-- End of picture text -->



<!-- Start of picture text -->
My Assignments G Refresh<br>Al assessments assigned to you for review and completion<br>© 2 Pending G 0 Completed 2 Total<br>Pending Action 2) Completed<br>No completed assignments<br>Completed assessments will appear here once you finish all checklist items<br><!-- End of picture text -->

#### **5. Status & Quality Reference** 

#### **DPIA status** 

|**Status**|**Meaning**|
|---|---|
|**Dra]**|The DPIA has been created but not yet assigned to a Risk Owner.|
|**Assigned**|The DPIA has been sent to a Risk Owner and is awai:ng comple:on.|
|**Completed**|The Risk Owner has fnished all checklist items.|
|**Submi^ed**|The completed DPIA has been submi^ed for compliance review.|
|**In Progress**|The Risk Owner has started but not yet fnished the ques:onnaire.|
|**High Risk**|The assessment's responses indicate a high-risk processing ac:vity requiring closer<br>review.|



#### **AIIA Status** 

|**Status**|**Meaning**|
|---|---|
|**Dra]**|The assessment has been created; Business Objec:ve, Intended Use, and<br>Foreseeable Misuse are not yet complete.|
|**Pending / Ac4on Required**|Awai:ng the assigned Risk Owner's input in My Assignments.|
|**Completed**|The Risk Owner has completed the assessment.|
|**Approved**|The assessment has been reviewed and approved.|



#### **6. Tips, Best Practices** 

###### **DPIA Frameworks** 

1. Trigger a DPIA whenever a new or changed processing activity involves large-scale, sensitive, or cross-border personal data, so privacy risk is assessed before processing begins — aligned to obligations under GDPR, DPDPA, KSA PDPL, and similar frameworks. 

2. Complete the PII Inventory stage accurately; the data subjects and geographies selected there determine which jurisdiction-specific obligations apply later in the questionnaire. 

3. Revisit a completed DPIA whenever the underlying processing activity changes materially — new data elements, a new purpose, or a new jurisdiction. 

###### **AAIA Frameworks** 

1. Trigger an AIIA whenever a new AI system is proposed or materially changed, so its business objective, intended use, and foreseeable misuse are documented before deployment — aligned to frameworks such as ISO 42001 and the EU AI Act. 

2. Keep Foreseeable Misuse specific and scenario-based; vague entries weaken the Risk Owner's ability to plan mitigating controls. 

3. Revisit an approved AIIA whenever the AI system is retrained, retuned, or repurposed for a new business objective. 

#### **7. Additional Information** 

1.  Set realistic Due Dates when planning a DPIA or AIIA, so assignments are completed before the associated processing activity or AI system goes live. 

2. Review My Assignments regularly if you are a Risk Owner, so pending DPIAs and AIIAs don't lapse past their due date. 
`;

  const steps = [
    {
      target: "#dashboard-header",
      content: "Welcome to your DPIA dashboard. Manage data protection impact assessments efficiently.",
    },
    {
      target: "#stats-grid",
      content: "A quick summary of assessments categorized by status.",
    },
    {
      target: "#action-cards",
      content: "Plan new assessments, manage assignments, or review submitted audits.",
    },
    {
      target: "#charts-container",
      content: "Visual status metrics and monthly DPIA trends.",
    },
  ];

  useEffect(() => {
    if (!organizationId) return;

    getAllUsers()
      .then((users) => {
        const owners = (users || []).filter(
          (u) =>
            Array.isArray(u.role) &&
            u.role.some((r) => r.toLowerCase() === "risk_owner"),
        );
        setRiskOwners(owners);
      })
      .catch((err) => console.error("Failed to load users", err));

    getDepartments()
      .then((data) => {
        const filtered = (data || []).filter(
          (d) =>
            String(d.organizationId || d.organization) ===
            String(organizationId),
        );
        setDepartments(filtered);
      })
      .catch((err) => console.error("Failed to load departments", err));
  }, [organizationId]);

  const loadData = useCallback(() => {
    if (!organizationId) return;

    setError(null);
    setLoadingStats(true);
    setLoading(true);

    getAllAssessments(organizationId)
      .then((data) => {
        setDpias(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message || err?.message || "Failed to load",
        );
      })
      .finally(() => {
        setLoadingStats(false);
        setLoading(false);
      });
  }, [organizationId]);

  // Load data only after the user is confirmed present to avoid unauthenticated requests
  useEffect(() => {
    if (!mounted || !user || !organizationId) return;

    // Load dashboard data
    loadData();

    // Log page load only once
    if (!pageLoggedRef.current) {
      pageLoggedRef.current = true;

      captureActivity({
        action: ACTIONS.PAGE_LOAD,
        item: "DPIA Dashboard",
        url: window.location.pathname,
      });
    }
  }, [mounted, user, organizationId, loadData]);
  // Fix recharts in flex containers
  useEffect(() => {
    const roTimer = { current: null };
    const ro = new ResizeObserver(() => {
      clearTimeout(roTimer.current);
      roTimer.current = setTimeout(
        () => window.dispatchEvent(new Event("resize")),
        150,
      );
    });
    const el = chartsContainerRef.current;
    if (el) ro.observe(el);
    return () => {
      clearTimeout(roTimer.current);
      if (el) ro.unobserve(el);
      ro.disconnect();
    };
  }, []);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total = dpias.length;
  const submitted = dpias.filter((d) => d.status === "SUBMITTED").length;
  const inProgress = dpias.filter((d) => d.status === "IN_PROGRESS").length;
  const pending = dpias.filter((d) => d.status === "PENDING").length;
  const highRisk = dpias.filter((d) => d.overallRiskLevel === "HIGH").length;

  // ── Pie data ──────────────────────────────────────────────────────────────
  const pieData = [
    { name: "Submitted", value: submitted, color: "#10b981" },
    { name: "In Progress", value: inProgress, color: "#6366f1" },
    { name: "Pending", value: pending, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  // ── Bar data ──────────────────────────────────────────────────────────────
  const monthlyMap = dpias.reduce((acc, d) => {
    const m = getMonthLabel(d.createdDate);
    if (m) acc[m] = (acc[m] || 0) + 1;
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
  ].map((m) => ({ name: m, value: monthlyMap[m] || 0 }));
  const BAR_COLORS = [
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
  ];

  // ── Stat cards ────────────────────────────────────────────────────────────
  const statCards = [
    {
      label: "Total",
      value: total,
      Icon: FileText,
      color: "from-blue-400 to-blue-500",
    },
    {
      label: "Submitted",
      value: submitted,
      Icon: CheckCircle2,
      color: "from-emerald-400 to-emerald-500",
    },
    {
      label: "In Progress",
      value: inProgress,
      Icon: Clock,
      color: "from-violet-400 to-violet-500",
    },
    {
      label: "Pending",
      value: pending,
      Icon: FileText,
      color: "from-amber-400 to-amber-500",
    },
  ];

  // ── Quick actions ─────────────────────────────────────────────────────────
  const rootActions = [
    {
      key: "view",
      Icon: Eye,
      title: "View DPIAs",
      subtitle: "Browse all assessments",
      color: "from-emerald-400 to-emerald-600",
      onClick: () => {
        captureActivity({
          action: ACTIONS.CLICK,
          item: "DPIA · Opened: View DPIAs",
          url: window.pathname,
        });
        router.push("/dpia/assessments");
      },
    },
    {
      key: "assign",
      Icon: UserCheck,
      title: "Plan DPIA",
      subtitle: "Assign to a risk owner",
      color: "from-violet-400 to-violet-600",
      onClick: () => {
        captureActivity({
          action: ACTIONS.CLICK,
          item: "DPIA · Opened: Plan DPIA Modal",
          url: window.pathname,
        });
        setModal("assign");
      },
    },
    {
      key: "manage",
      Icon: Layers,
      title: "Manage DPIA",
      subtitle: "View & edit assignments",
      color: "from-purple-400 to-purple-600",
      onClick: () => {
        captureActivity({
          action: ACTIONS.CLICK,
          item: "DPIA · Opened: Manage DPIA Modal",
          url: window.pathname,
        });
        setModal("manage");
      },
    },
  ];

  const riskOwnerActions = [
    {
      key: "myDpias",
      Icon: ShieldCheck,
      title: "Conduct DPIA",
      subtitle: "View your assigned assessments",
      color: "from-violet-400 to-violet-600",
      onClick: () => {
        captureActivity({
          action: ACTIONS.CLICK,
          item: "DPIA · Opened: Conduct DPIA Modal",
          url: window.pathname,
        });
        setModal("myDpias");
      },
    },
    {
      key: "view",
      Icon: Eye,
      title: "Review DPIAs",
      subtitle: "Browse all assessments",
      color: "from-emerald-400 to-emerald-600",
      onClick: () => router.push("/dpia/assessments"),
    },
  ];

  const defaultActions = [
    {
      key: "new",
      Icon: Plus,
      title: "New Assessment",
      subtitle: "Start a new DPIA",
      color: "from-blue-400 to-blue-600",
      onClick: () => router.push("/dpia/new"),
    },
    {
      key: "view",
      Icon: Eye,
      title: "View Assessments",
      subtitle: "Browse all assessments",
      color: "from-emerald-400 to-emerald-600",
      onClick: () => router.push("/dpia/assessments"),
    },
    {
      key: "compliance",
      Icon: ShieldCheck,
      title: "Compliance",
      subtitle: "Review submitted findings",
      color: "from-violet-400 to-violet-600",
      onClick: () => router.push("/dpia/assessments"),
    },
    {
      key: "reports",
      Icon: BarChart3,
      title: "Reports",
      subtitle: "Risk level overview",
      color: "from-amber-400 to-amber-500",
      onClick: () => router.push("/dpia/assessments"),
    },
  ];

  const quickActions = isRoot
    ? rootActions
    : isRiskOwner
      ? riskOwnerActions
      : defaultActions;

  // ── Role badge ────────────────────────────────────────────────────────────
  const roleBadge = isRoot
    ? { label: "Root", style: "bg-blue-100 text-blue-700" }
    : isRiskOwner
      ? { label: "Risk Owner", style: "bg-violet-100 text-violet-700" }
      : null;

  // ── Loading gate ──────────────────────────────────────────────────────────
  // Show spinner while the useEffectiveOrg hook is resolving on hard reload.
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  // Confirmed unauthenticated — render nothing
  if (!user) return null;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex flex-col overflow-hidden"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-28">
        {/* ── HEADER ── */}
        <motion.header
          id="dashboard-header"
          className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl shadow-md mb-6 p-6 !text-left"
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
              <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <ShieldCheck className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              <div style={{ textAlign: "left" }}>
                <h1 className="text-2xl font-semibold text-slate-800 leading-tight">
                  DPIA Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {roleBadge && (
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-full ${roleBadge.style}`}
                >
                  {roleBadge.label}
                </span>
              )}
              <span className="text-sm font-semibold text-slate-600">
                {user?.name || "User"}
              </span>
              <motion.button
                onClick={loadData}
                title="Refresh"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw
                  size={15}
                  className="text-slate-500"
                  style={
                    loading ? { animation: "spin 1s linear infinite" } : {}
                  }
                />
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

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
            ⚠ {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-3">
            {/* Stat Cards — root / default only (risk owners see assignment summary) */}
            {!isRiskOwner && (
              <motion.section
                id="stats-grid"
                className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                initial={hasMounted ? { opacity: 0, y: 15 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {statCards.map((stat, i) => {
                  const Icon = stat.Icon;
                  return (
                    <motion.div
                      key={stat.label}
                      className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-3 h-20 hover:bg-white"
                      initial={hasMounted ? { opacity: 0, y: 20 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md flex-shrink-0`}
                      >
                        <Icon size={20} className="text-white drop-shadow-sm" />
                      </div>
                      <div>
                        <span className="text-2xl font-semibold text-slate-800 block leading-tight group-hover:text-slate-900">
                          {loadingStats ? "—" : stat.value}
                        </span>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                          {stat.label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.section>
            )}

            {/* Risk owner — assigned summary card */}
            {isRiskOwner && (
              <motion.div
                id="stats-grid"
                className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-5 shadow-sm"
                initial={hasMounted ? { opacity: 0, y: 15 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-violet-500 flex items-center justify-center shadow-md">
                    <UserCheck size={18} className="text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700">
                    DPIAs assigned to {user?.name || "you"}
                  </h3>
                </div>
                <p className="text-sm text-slate-500">
                  Open "My DPIAs" to view your assigned assessments, or "Review
                  Findings" to log remediation actions against compliance
                  issues.
                </p>
              </motion.div>
            )}

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
              <div
                className={`grid gap-4 ${isRiskOwner ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2"
                  }`}
              >
                <AnimatePresence>
                  {quickActions.map((action, i) => {
                    const Icon = action.Icon;
                    return (
                      <motion.div
                        key={action.key}
                        className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer"
                        initial={hasMounted ? { opacity: 0, scale: 0.93 } : false}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={action.onClick}
                      >
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md mb-4`}
                        >
                          <Icon
                            size={22}
                            className="text-white drop-shadow-sm"
                          />
                        </div>
                        <p className="text-sm font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                          {action.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {action.subtitle}
                        </p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.section>
          </div>

          {/* ── RIGHT COLUMN: CHARTS ── */}
          <div id="charts-container" ref={chartsContainerRef} className="space-y">
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
                {total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={72}
                        paddingAngle={3}
                        stroke="white"
                        strokeWidth={3}
                      >
                        {pieData.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip total={total} />} />
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
                        y="57%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fill: "#1e293b",
                          fontSize: 22,
                          fontWeight: 800,
                        }}
                      >
                        {total}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <ShieldCheck
                      size={40}
                      className="text-slate-300 mb-3"
                      strokeWidth={1.5}
                    />
                    <p className="text-base font-semibold text-slate-400 mb-1">
                      No Assessments Yet
                    </p>
                    <p className="text-sm text-slate-400">
                      Create your first DPIA to get started
                    </p>
                  </div>
                )}
              </div>
              {total > 0 && (
                <div className="flex gap-4 justify-center mt-2">
                  {pieData.map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: d.color,
                        }}
                      />
                      {d.name}
                    </div>
                  ))}
                </div>
              )}
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
                    {total} total
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
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="value" radius={[5, 5, 0, 0]} barSize={24}>
                      {barData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={BAR_COLORS[i % BAR_COLORS.length]}
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
        title="DPIA Help"
        content={DPIA_HELP_CONTENT}
      />

      {/* ── FOOTER ── */}
      <footer className="bg-white/90 backdrop-blur-md border-t border-slate-100/50 shadow-lg px-8 py-5 sticky bottom-0 z-50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-slate-500 font-medium">
            © {new Date().getFullYear()} CalVant. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ── MODALS ── */}
      {modal === "assign" && (
        <AssignDpiaModal
          onClose={() => setModal(null)}
          onSaved={loadData}
          riskOwners={riskOwners}
          departments={departments}
        />
      )}
      {modal === "manage" && (
        <ManageDpiaAssignmentsModal
          onClose={() => setModal(null)}
          onSaved={loadData}
          riskOwners={riskOwners}
          departments={departments}
        />
      )}
      {modal === "myDpias" && (
        <ViewMyDpiasModal onClose={() => setModal(null)} />
      )}
      {modal === "findings" && (
        <ReviewDpiaFindingsModal onClose={() => setModal(null)} />
      )}
    </div>
  );
}
