// import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
// import { useRouter } from "next/navigation";
// import { useEffectiveOrg } from "@/hooks/useEffectiveOrg";
// import documentationService from "../services/documentationService";
// import controlService from "../services/controlService";
// import { useFramework, ALL_FRAMEWORKS } from "../../../context/FrameworkContex";
// import Joyride from "react-joyride";
// import CompactFrameworkFilter from "./CompactFrameworkFilter";
// import { captureActivity, ACTIONS } from "../../../services/activities";
// import HelpDocModal from "@/components/shared/HelpDocModal";

// import {
//   FileText,
//   CheckCircle,
//   AlertCircle,
//   BarChart3,
//   HelpCircle,
//   FolderOpen,
//   Archive,
//   RefreshCw,
//   BookOpen
// } from "lucide-react";
// import {
//   PieChart,
//   Pie,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   ResponsiveContainer,
//   Tooltip,
//   Cell,
//   CartesianGrid,
// } from "recharts";
// import { motion, AnimatePresence } from "framer-motion";

// // ---------------------------------------------------------------------------
// // Documentation dashboard
// // ---------------------------------------------------------------------------

// const Documentation = () => {
//   const router = useRouter();
//   const chartsContainerRef = useRef(null);
//   // 
//   const {
//     user,
//     mounted,
//     isRoot,
//     isPrivilegedRole,
//     isViewingManagedOrg,
//     effectiveOrgId,
//     effectiveOrgIds,
//     selectedChildOrg,
//   } = useEffectiveOrg();

//   const userRoles = Array.isArray(user?.role) ? user.role : [user?.role || ""];
//   const deptLabel = isPrivilegedRole
//     ? "All"
//     : (user?.departments || []).map((d) => d.name).join(", ") || "Your";

//   const [documentStats, setDocumentStats] = useState({
//     total: 0,
//     uploaded: 0,
//     pending: 0,
//     archived: 0,
//   });
//   const [hasMounted, setHasMounted] = useState(false);
//   useEffect(() => { setHasMounted(true); }, []);
//   const [allDocuments, setAllDocuments] = useState([]);
//   const [run, setRun] = useState(false);

//   const [showHelpDoc, setShowHelpDoc] = useState(false);

// const DOCUMENTATION_HELP_CONTENT = `
// # **calvant** 

// Digital Compliance Management 

// ## **Policy Module** 

// ### **End-User Guide** 

// Version 1.0  |  July 2026 

// © 2026 CalVant. All rights reserved. 

// Page 1 

// # **Table of Contents** 

// ###### **1. Introduction** 

// ###### **2. Accessing the Policy Module** 

// ###### **3. Key Terminology** 

// ###### **4. Manual Navigation** 

// 4.1 Policies Dashboard 

// 4.2 Policies List View (Master List of Documents) 

// 4.3 Uploading a Policy Document 

// 4.4 Reviewing, Approving & Quality Check 

// 4.5 Creating a Task 

// 4.6 Archiving Policies 

// ###### **5. Status & Quality Reference** 

// ###### **6. Tips, Best Practices & Troubleshooting** 

// Page 1 

// CalVant — Policy Module User Guide 

// #### **1. Introduction** 

// The Policy Module in CalVant helps you create, upload, review, approve, and track the policy documents required for your compliance and information security program. It maps every policy to the controls in frameworks such as ISO 27001, ISO 27701, SOC 2, ISO 42001, and PDPL, and keeps a version-controlled record of what has been submitted, reviewed, and archived. 

// #### **2. Accessing the Policy Module** 

// After logging in to CalVant, use the left-hand navigation sidebar to move between modules. The sidebar gives you access to the Home/Dashboard, Risk, Policy, Audit, and other Task modules, along with account settings at the bottom. 

// 1. Click the Policy icon in the sidebar to land on your Policies Dashboard. 

// 2. Your logged-in user name and role (e.g., Root) appear in the top-right of the dashboard header. 

// #### **3. Key Terminology** 

// A short list of terms that are specific to CalVant's policy workflow rather than self-explanatory from the screen itself: 

// |**Term**|**Definition**|
// |---|---|
// |**MLD (Master List of**<br>**Documents)**|The complete, filterable list of every policy record in the system — CalVant's<br>working name for the Policies list screen.|
// |**SoA Linked**|A policy connected to an entry in the Statement of Applicability, shown in the<br>header stats and as a green SoA tag on each row.|



// #### **4. Manual Navigation** 

// With the vocabulary in place, this section walks through every screen in the module in the order you'll use them day to day — starting at the dashboard and ending at the archive. 

// ##### **4.1 Policies Dashboard** 

// The Policies Dashboard is your home base for the module. It gives you an at-a-glance summary of every policy in your organization, along with quick actions to browse, upload, and manage documents. 

// Page 3 



// <!-- Start of picture text -->
// 8 Policies Dashboard<br>All + 57 total policies Ea ohn (2<br>TOTALSn DoeUPLOADED DewPENDING BARCHIVED Document Status<br>;uick Actions wep<br>©<br>Upload Trends<br>Documents by month 0 total<br>No Upload Data<br>Documents need to be uploaded to display trends<br><!-- End of picture text -->



// <!-- Start of picture text -->
// € Back to Dashboard<br>Policies<br>Upload and manage your policies<br>Total: 170 Uploaded:0 SoALinked:68 1SO 27001: 170<br>earch policy, control ID or C-ID. By Framework (27001 > 27701 > SOC2 + 42001 PDPL) ¥ Uploaded: @ ¥ Uploaded X Not Uploaded Showing 170 of 170<br>Policies<br>Control ID Policy Name Related Framework Type Control Code Ownership Department —CalVant Version Status Subm<br>4. Information<br>c-1 ISMS Manual QD Guideline _ Understanding the " Security = To Upload<br>cantont Officer (ISO)<br>4. Information<br>C-1 ISMS Scope Doe Understanding the Security = To Upload<br>cones Officer (ISO)<br>42 Information<br>C-1 ISMS LOG Context & Objectives Log Understanding the Security - To Upload<br>laa baad Officer (ISO)<br>c-2 ISMS Manual Guideline 4.2Understandingcede and the , InformationSecurity - To Upload<br>expectations of Officer (ISO)<br>Policies<br>Upload and manage your policies<br>Total; 170 Uploaded: 0 SOA Linked: 68 180 27001<br>: ¥ By FrameworkPolicy Name (A (27001+ Z)  + 27701 + SOC2 + 42001 + POPL) ) Uploaded oO v Uptecded ) (x Net Uptondes Showing 170 of 170<br>Control ID (# Ase, grouped by framework)<br>Policies Control IO (4 Desc, grouped by framework)<br>SOA Linked First<br>Control 10 SoASoA DateDate (Newest)(Oldest) oe Control Code Ownership Department CalVant Version ‘Status ‘Subm<br>4a Information<br>Cl ISMS Manual @Z> (\s027001 ) Guideline er standing the Security - To Upload<br>—_ Officer (1S0)<br>44 Information<br>Cl ISMS Scope > (18027001 ) 0 handing the Security - To Upload<br>— Officer (ISO)<br>4a Information<br>C1 ISMS LOG Context & Objectives > (8027001) Log anding the Security - To Upload<br>L —— _—_—_.1_l_ Obi 0s.<br><!-- End of picture text -->

// ###### Policies 

// |Department|CalVantVersion|Status|SubmittedBy|Submission Date|Approved By|ReviewDate|Upload|Remarks|QualityCheck|Add Task|
// |---|---|---|---|---|---|---|---|---|---|---|
// |information<br>|||||||||||
// |Security|-|ToUptoad|-|~-|-|-|>Upload|-|||
// |Officer (ISO)|||||||||||
// |information<br>|||||||||||
// |Security|-|ToUptoad|-|=|=|—|}Upload|-|||
// |Officer (ISO)|||||||||||
// |information|||||||||||
// |Security|-|ToUptoad|-|-|—|=|>Upload|=|||
// |Officer (ISO)|||||||||||
// |information|||||||||||
// |Security|=|ToUptoad|=|=|=|-|>Upload|-|||
// |Officer(ISO)|||||||||||





// <!-- Start of picture text -->
// Policies<br>Department CalVant Version Status Submitted By Submission Date Approved By Review Date Upload Remarks Quality Check Add Task<br>Information<br>Information<br>Information —<br><!-- End of picture text -->



// <!-- Start of picture text -->
// Department *<br>Select department v<br>Assign To<br>Auto Assign (Risk Owner) v<br>Task Description *<br>Policy: ISMS Manual | Control: 4.1 (C-1)<br>Start Date * End Date*<br>15/07/2026 i] ddim yyyy o<br>Priority<br>Remarks<br>Canes!<br><!-- End of picture text -->



// <!-- Start of picture text -->
// IAMS<br>© Archived Policies<br>Policies archived from the MLD are stored here. You can permanently delete them when no longer needed<br>Total Archived:0 Shown: 0<br>0 of 0 archived<br>© Archive<br>* Policy Name CalVant Version Submitted By Department Uploaded On Reason (Remarks) Actions<br>No Archived Po! §<br><!-- End of picture text -->

// CalVant — Policy Module User Guide 

// ###### **Document Status (Dashboard Tiles)** 

// |**Status**|**Meaning**|
// |---|---|
// |**Total**|All policies currently tracked in the Master List of Documents.|
// |**Uploaded**|Policies with a file attached and submitted for review.|
// |**Pending**|Policies awaiting upload; shown as To Upload in the list.|
// |**Archived**|Policies removed from the active list and stored in Archived Policies.|



// ###### **Row Status (Master List of Documents)** 

// |**Status**|**Meaning**|
// |---|---|
// |**To Upload**|No document has been attached to this control yet.|
// |**To Approve**|A document has been uploaded and is awaiting review.|
// |**Approved**|The document has been reviewed and accepted.|
// |**Archived**|The policy has been moved out of the active list.|



// #### **6. Tips, Best Practices** 

// 1. Use the By Framework sort when preparing for a certification audit, so policies follow the same order as your framework. 

// 2. Review the Quality Check score and click Re-verify before approving a document, so incomplete files aren't approved by mistake. 

// 3. Use the Uploaded and Not Uploaded filter chips to focus on outstanding submissions ahead of a review cycle. 

// 4. Set realistic Start and End Dates when creating a task so follow-up work stays on schedule. 

// 5. Archive superseded policy versions instead of deleting them, so a Reason and audit trail are preserved. 

// Page 9 
// `;

//   const {
//     selectedFrameworks,
//     toggleFramework,
//     isAllSelected,
//     availableFrameworks,
//   } = useFramework();

//   const steps = [
//     {
//       target: "#dashboard-header",
//       content: `Welcome to your ${deptLabel} documentation dashboard.`,
//     },
//     {
//       target: "#stats-grid",
//       content: "Document compliance metrics at a glance.",
//     },
//     {
//       target: "#charts-container",
//       content: "Visual document status and detailed upload trends.",
//     },
//     {
//       target: "#action-cards",
//       content: "Quick access to document management tools.",
//     },
//   ];

//   useEffect(() => {
//     captureActivity({
//       action: ACTIONS.PAGE_LOAD,
//       item: [{ detail: "Documentation · Viewed dashboard" }],
//       url: window.pathname,
//     });
//   }, []);

//   // ── ResizeObserver for recharts ───────────────────────────────────────────
//   useEffect(() => {
//     const resizeObserver = new ResizeObserver(() => {
//       clearTimeout(window.resizeTimeout);
//       window.resizeTimeout = setTimeout(() => {
//         window.dispatchEvent(new Event("resize"));
//       }, 150);
//     });
//     if (chartsContainerRef.current)
//       resizeObserver.observe(chartsContainerRef.current);
//     return () => {
//       if (chartsContainerRef.current)
//         resizeObserver.unobserve(chartsContainerRef.current);
//       clearTimeout(window.resizeTimeout);
//     };
//   }, []);

//   useEffect(() => {
//     if (mounted && !user) {
//       router.push("/");
//     }
//   }, [mounted, user, router]);

//   // useEffect(() => {
//   //   collapseSidebar();
//   // }, [collapseSidebar]);

//   // ── Count total required docs from backend controls ───────────────────────
//   const getTotalFromBackendControls = (controls, currentUser, userIsAdmin) => {
//     const userDeptNames = (currentUser?.departments || []).map((d) =>
//       (d.name || "").toLowerCase(),
//     );
//     const docsSet = new Set();
//     controls.forEach((ctrl) => {
//       if (!ctrl.documents?.length) return;
//       const ctrlDepts = (ctrl.departmentIds || []).map((d) =>
//         (d || "").toLowerCase(),
//       );
//       const docDepts = ctrl.documents
//         .map((d) => (d.dept || "").toLowerCase())
//         .filter(Boolean);
//       const allDepts = [...ctrlDepts, ...docDepts];
//       const hasAccess =
//         userIsAdmin ||
//         allDepts.length === 0 ||
//         allDepts.some((d) => userDeptNames.includes(d));
//       if (!hasAccess) return;
//       ctrl.documents.forEach(({ doc }) => {
//         if (doc) docsSet.add(doc);
//       });
//     });
//     return docsSet.size;
//   };

//   // ── Load stats ─────────────────────────────────────────────────────────────
//   const loadDocumentStats = useCallback(async () => {
//     if (!user) return;
//     try {
//       const [docs, soaList, ...controlResults] = await Promise.all([
//         documentationService.getDocuments().catch(() => []),
//         documentationService.getSoAEntries().catch(() => []),
//         ...availableFrameworks.map((fw) =>
//           controlService.getControlsByFramework(fw.code).catch(() => []),
//         ),
//       ]);

//       const normalize = (fw) => {
//         if (!fw) return "";
//         return fw.replace(/[\s_-]/g, "").toUpperCase();
//       };

//       const selectedFW = isAllSelected
//         ? availableFrameworks.map((fw) => normalize(fw.code))
//         : selectedFrameworks.map(normalize);

//       const soaFrameworkMap = {};
//       (soaList || []).forEach((soa) => {
//         if (soa.id) soaFrameworkMap[String(soa.id)] = soa.framework;
//       });

//       const orgDocs = (docs || [])
//         .filter((d) => d.organization === effectiveOrgId)
//         .map((doc) => ({
//           ...doc,
//           framework:
//             soaFrameworkMap[String(doc.soaId)] || doc.framework || null,
//         }));

//       const frameworkDocs = orgDocs.filter((doc) =>
//         selectedFW.includes(normalize(doc.framework)),
//       );

//       setAllDocuments(frameworkDocs.filter((d) => !d.deleted));

//       const frameworkControls = availableFrameworks
//         .flatMap((fw, i) =>
//           (controlResults[i] || []).map((c) => ({
//             ...c,
//             _fw: normalize(fw.code),
//           })),
//         )
//         .filter((ctrl) => selectedFW.includes(ctrl._fw));

//       const totalRequired = getTotalFromBackendControls(
//         frameworkControls,
//         user,
//         isPrivilegedRole,
//       );

//       const uploaded = frameworkDocs.filter(
//         (doc) => !!doc.url && !doc.deleted,
//       ).length;

//       // Count archived (soft-deleted) docs
//       const archived = frameworkDocs.filter(
//         (doc) => doc.deleted === true,
//       ).length;

//       setDocumentStats({
//         total: totalRequired,
//         uploaded,
//         pending: Math.max(0, totalRequired - uploaded),
//         archived,
//       });
//     } catch (error) {
//       console.error("Error loading document stats:", error);
//       setDocumentStats({ total: 0, uploaded: 0, pending: 0, archived: 0 });
//     }
//   }, [user, selectedFrameworks, isAllSelected, isPrivilegedRole, availableFrameworks, effectiveOrgId]);

//   useEffect(() => {
//     captureActivity({
//       action: ACTIONS.PAGE_LOAD,
//       item: "Documentation Dashboard",
//       url: "/documentation",
//     });
//     loadDocumentStats();
//   }, [loadDocumentStats]);

//   if (!mounted || !user) return null;

//   // ── Chart data ─────────────────────────────────────────────────────────────
//   const pieData = [
//     {
//       name: "Uploaded",
//       value: documentStats.uploaded,
//       color: "#10b981",
//       desc: `${documentStats.uploaded} documents`,
//     },
//     {
//       name: "Pending",
//       value: documentStats.pending,
//       color: "#f59e0b",
//       desc: `${documentStats.pending} documents`,
//     },
//   ].filter((d) => d.value > 0);

//   const getMonthFromDate = (dateString) => {
//     if (!dateString) return null;
//     return new Date(dateString).toLocaleDateString("en-US", { month: "short" });
//   };

//   const monthlyDetailedData = allDocuments.reduce((acc, doc) => {
//     const month = getMonthFromDate(doc.createdAt || doc.created_at);
//     if (month) {
//       if (!acc[month]) acc[month] = { count: 0, dates: [], docs: [] };
//       acc[month].count++;
//       acc[month].dates.push(
//         new Date(doc.createdAt || doc.created_at).toLocaleDateString("en-US", {
//           year: "numeric",
//           month: "short",
//           day: "numeric",
//         }),
//       );
//       acc[month].docs.push(doc.name || doc.title || "Document");
//     }
//     return acc;
//   }, {});

//   const barData = [
//     "Jan",
//     "Feb",
//     "Mar",
//     "Apr",
//     "May",
//     "Jun",
//     "Jul",
//     "Aug",
//     "Sep",
//     "Oct",
//     "Nov",
//     "Dec",
//   ].map((m) => ({
//     name: m,
//     value: monthlyDetailedData[m]?.count || 0,
//     details: monthlyDetailedData[m],
//   }));

//   const CustomPieTooltip = ({ active, payload }) => {
//     if (active && payload?.length) {
//       const data = payload[0].payload;
//       return (
//         <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg min-w-[200px]">
//           <div className="font-semibold text-slate-800 text-sm mb-1">
//             {data.name}
//           </div>
//           <div className="text-xl font-bold text-slate-900 mb-1">
//             {data.value}
//           </div>
//           <div className="text-xs text-slate-600">{data.desc}</div>
//           <div className="text-xs text-slate-500 mt-1">
//             {((data.value / (documentStats.total || 1)) * 100).toFixed(1)}% of
//             total
//           </div>
//         </div>
//       );
//     }
//     return null;
//   };

//   const CustomBarTooltip = ({ active, payload }) => {
//     if (active && payload?.length) {
//       const data = payload[0].payload;
//       const details = data.details;
//       if (!details || details.count === 0) {
//         return (
//           <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg">
//             <div className="font-semibold text-slate-800 text-sm mb-1">
//               {data.name}
//             </div>
//             <div className="text-xl font-bold text-slate-900 mb-1">
//               {data.value}
//             </div>
//             <div className="text-xs text-slate-500">No uploads</div>
//           </div>
//         );
//       }
//       return (
//         <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-lg max-w-sm max-h-60 overflow-y-auto">
//           <div className="font-semibold text-slate-800 text-sm mb-3">
//             {data.name}{" "}
//             <span className="text-slate-600">({data.value} docs)</span>
//           </div>
//           {details.dates.slice(0, 5).map((date, index) => (
//             <div
//               key={index}
//               className="flex items-center gap-2 py-1 border-b border-slate-100 last:border-b-0 text-xs"
//             >
//               <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
//               <div>
//                 <div className="font-medium text-slate-900">
//                   {details.docs[index] || "Document"}
//                 </div>
//                 <div className="text-slate-500 text-[10px]">{date}</div>
//               </div>
//             </div>
//           ))}
//           {details.dates.length > 5 && (
//             <div className="text-xs text-slate-500 mt-2">
//               +{details.dates.length - 5} more uploads
//             </div>
//           )}
//         </div>
//       );
//     }
//     return null;
//   };

//   const actionCards = [
//     {
//       id: "mld",
//       icon: FolderOpen,
//       title: "Master List of Documents",
//       subtitle: "MLD",
//       path: "/documentation/mld",
//       color: "from-emerald-400 to-emerald-500",
//       primary: true,
//     },
//     {
//       id: "upload",
//       icon: FolderOpen,
//       title: "Upload",
//       subtitle: "Documents",
//       path: "/documentation/mld",
//       color: "from-blue-500 to-blue-600",
//       primary: true,
//     },
//     {
//       id: "view",
//       icon: FolderOpen,
//       title: "View",
//       subtitle: "Documents",
//       path: "/documentation/mld",
//       color: "from-orange-400 to-red-500",
//       primary: true,
//     },
//     {
//       id: "archived",
//       icon: Archive,
//       title: "Archived",
//       subtitle: `${documentStats.archived} document${documentStats.archived !== 1 ? "s" : ""}`,
//       path: "/documentation/archived",
//       color: "from-slate-400 to-slate-600",
//       primary: true,
//       badge: documentStats.archived > 0 ? documentStats.archived : null,
//     },
//   ];

//   // ── Render ─────────────────────────────────────────────────────────────────
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex flex-col overflow-hidden">
//       <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2 lg:py-8 pb-24 lg:pb-28 overflow-hidden">
//         <Joyride
//           steps={steps}
//           run={run}
//           continuous
//           showSkipButton
//           scrollToFirstStep
//           styles={{ options: { primaryColor: "#3b82f6", width: 300 } }}
//         />

//         {/* Header */}
//         <motion.header
//           id="dashboard-header"
//           className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl shadow-md mb-2 p-6 !text-left"
//           style={{
//             textAlign: "left",
//             width: "100%",
//             justifyContent: "flex-start",
//             alignItems: "flex-start",
//           }}
//           initial={hasMounted ? { opacity: 0, y: -15 } : false}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//         >
//           <div className="flex items-center justify-between w-full">
//             <div
//               className="flex items-center gap-4 flex-1"
//               style={{
//                 justifyContent: "flex-start",
//                 textAlign: "left",
//                 alignItems: "flex-start",
//               }}
//             >
//               <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
//                 <FileText className="w-7 h-7 text-white drop-shadow-sm" />
//               </div>
//               <div style={{ textAlign: "left" }}>
//                 <h1 className="text-2xl font-semibold text-slate-800 leading-tight">
//                   Policies Dashboard
//                 </h1>
//                 <p className="text-base text-slate-600 mt-1">
//                   {deptLabel} •{" "}
//                   <span className="font-bold text-2xl text-slate-900">
//                     {documentStats.total}
//                   </span>{" "}
//                   total policies
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center gap-3">
//               <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isPrivilegedRole ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
//                 {isPrivilegedRole ? "Root" : (userRoles[0] ? userRoles[0].replace("_", " ") : "User")}
//               </span>
//               <span className="text-sm font-semibold text-slate-600">
//                 {user?.name || "User"}
//               </span>
//               <motion.button
//                 onClick={loadDocumentStats}
//                 title="Refresh"
//                 className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 flex items-center justify-center"
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <RefreshCw size={15} className="text-slate-500" />
//               </motion.button>
//               <motion.button
//                 onClick={() => setShowHelpDoc(true)}
//                 title="Help Documentation"
//                 className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 flex items-center justify-center"
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <BookOpen size={15} className="text-slate-500" />
//               </motion.button>
//               <motion.button
//                 className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
//                 onClick={() => {
//                   setRun(false);
//                   setTimeout(() => setRun(true), 100);
//                 }}
//                 whileHover={{ scale: 1.02 }}
//                 whileTap={{ scale: 0.98 }}
//               >
//                 <HelpCircle size={18} />
//                 <span>Tutorial</span>
//               </motion.button>
//             </div>
//           </div>
//         </motion.header>

//         <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 w-full min-w-0">
//           {/* LEFT */}
//           <div className="space-y-10 w-full min-w-0">
//             {/* Stats Grid */}
//             <motion.section
//               id="stats-grid"
//               className="grid grid-cols-2 md:grid-cols-4 gap-4"
//               initial={hasMounted ? { opacity: 0, y: 15 } : false}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.5, delay: 0.1 }}
//             >
//               {[
//                 {
//                   Icon: FileText,
//                   value: documentStats.total,
//                   label: "Total",
//                   color: "from-blue-400 to-blue-500",
//                   id: "total-docs",
//                   path: "/documentation/mld",
//                 },
//                 {
//                   Icon: CheckCircle,
//                   value: documentStats.uploaded,
//                   label: "Uploaded",
//                   color: "from-emerald-400 to-emerald-500",
//                   id: "uploaded-docs",
//                   path: "/documentation/mld",
//                 },
//                 {
//                   Icon: AlertCircle,
//                   value: documentStats.pending,
//                   label: "Pending",
//                   color: "from-orange-400 to-orange-500",
//                   id: "pending-docs",
//                   path: "/documentation/mld",
//                 },
//                 {
//                   Icon: Archive,
//                   value: documentStats.archived,
//                   label: "Archived",
//                   color: "from-slate-400 to-slate-600",
//                   id: "archived-docs",
//                   path: "/documentation/archived",
//                 },
//               ].map(
//                 ({ Icon: IconComponent, value, label, color, id, path }, i) => (
//                   <motion.div
//                     key={id}
//                     className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-lg px-3 py-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center gap-2 h-20 hover:bg-white"
//                     onClick={() => router.push(path)}
//                   >
//                     <div
//                       className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-md flex-shrink-0`}
//                     >
//                       <IconComponent
//                         size={18}
//                         className="text-white drop-shadow-sm"
//                       />
//                     </div>

//                     <div className="flex-1">
//                       <span className="text-2xl font-semibold text-slate-800 block leading-tight">
//                         {value}
//                       </span>
//                       <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">
//                         {label}
//                       </span>
//                     </div>
//                   </motion.div>
//                 ),
//               )}
//             </motion.section>

//             {/* Action Cards */}
//             <motion.section
//               id="action-cards"
//               className="space-y-1"
//               initial={hasMounted ? { opacity: 0, y: 5 } : false}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.5, delay: 0.3 }}
//             >
//               <h3 className="text-xl font-semibold text-slate-800 mb-6">
//                 Quick Actions
//               </h3>
//               <div className="grid grid-cols-2 gap-4">
//                 <AnimatePresence>
//                   {actionCards.map(
//                     (
//                       {
//                         id,
//                         icon: Icon,
//                         title,
//                         subtitle,
//                         path,
//                         color,
//                         primary,
//                         badge,
//                       },
//                       index,
//                     ) => (
//                       <motion.div
//                         key={`${id}-${index}`}
//                         className={`group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-6 h-full flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer relative ${primary ? "ring-2 ring-emerald-200/50 bg-gradient-to-br " + color : ""}`}
//                         initial={hasMounted ? { opacity: 0, scale: 0.9 } : false}
//                         animate={{ opacity: 1, scale: 1 }}
//                         exit={{ opacity: 0, scale: 0.9 }}
//                         transition={{
//                           duration: 0.4,
//                           delay: 0.4 + index * 0.06,
//                         }}
//                         whileHover={{ scale: 1.02 }}
//                         onClick={() => router.push(path)}
//                       >
//                         {/* Badge for archived count */}
//                         {badge != null && badge > 0 && (
//                           <span
//                             style={{
//                               position: "absolute",
//                               top: "10px",
//                               right: "10px",
//                               background: "#ef4444",
//                               color: "white",
//                               borderRadius: "50%",
//                               width: "22px",
//                               height: "22px",
//                               display: "flex",
//                               alignItems: "center",
//                               justifyContent: "center",
//                               fontSize: "11px",
//                               fontWeight: 700,
//                             }}
//                           >
//                             {badge}
//                           </span>
//                         )}
//                         <div
//                           className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-md flex-shrink-0 ${primary ? "bg-white/20 backdrop-blur-sm" : `bg-gradient-to-br ${color}`}`}
//                         >
//                           <Icon
//                             size={24}
//                             className="text-white drop-shadow-sm"
//                           />
//                         </div>
//                         <div className="flex-1 flex flex-col justify-center">
//                           <h4 className="text-lg font-semibold text-center text-slate-800 leading-tight mb-2 group-hover:text-blue-600 transition-colors duration-200">
//                             {title}
//                           </h4>
//                           <p className="text-sm font-bold text-center text-slate-600">
//                             {subtitle}
//                           </p>
//                         </div>
//                       </motion.div>
//                     ),
//                   )}
//                 </AnimatePresence>
//               </div>
//             </motion.section>
//           </div>

//           {/* RIGHT — Charts */}
//           <div
//             ref={chartsContainerRef}
//             id="charts-container"
//             className="space-y-1 w-full min-w-0"
//           >
//             {/* Pie Chart */}
//             <motion.div
//               className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-400 h-64 flex flex-col w-full min-w-0"
//               initial={hasMounted ? { opacity: 0, scale: 0.95 } : false}
//               animate={{ opacity: 1, scale: 1 }}
//               whileHover={{ scale: 1.01 }}
//             >
//               <h3 className="text-lg font-semibold text-slate-800 mb-6">
//                 Document Status
//               </h3>
//               <div className="h-40 flex items-center justify-center w-full min-w-0">
//                 {documentStats.total > 0 ? (
//                   <ResponsiveContainer width="100%" height="100%" debounce={50}>
//                     <PieChart>
//                       <Pie
//                         data={pieData}
//                         dataKey="value"
//                         nameKey="name"
//                         cx="50%"
//                         cy="50%"
//                         innerRadius={35}
//                         outerRadius={65}
//                         paddingAngle={2}
//                         stroke="white"
//                         strokeWidth={3}
//                       >
//                         {pieData.map((entry, index) => (
//                           <Cell key={`cell-${index}`} fill={entry.color} />
//                         ))}
//                       </Pie>
//                       <Tooltip content={<CustomPieTooltip />} />
//                       <text
//                         x="50%"
//                         y="42%"
//                         textAnchor="middle"
//                         dominantBaseline="left"
//                         className="fill-slate-700 text-sm font-semibold"
//                       >
//                         Total
//                       </text>
//                       <text
//                         x="50%"
//                         y="52%"
//                         textAnchor="middle"
//                         dominantBaseline="middle"
//                         className="fill-slate-900 text-2xl font-bold"
//                       >
//                         {documentStats.total}
//                       </text>
//                     </PieChart>
//                   </ResponsiveContainer>
//                 ) : (
//                   <div className="flex flex-col items-center justify-center h-full text-center p-8">
//                     <FileText
//                       size={48}
//                       className="text-slate-400 mb-4"
//                       strokeWidth={1.5}
//                     />
//                     <p className="text-xl font-semibold text-slate-500 mb-2">
//                       No Policies
//                     </p>
//                     <p className="text-base text-slate-500 max-w-xs">
//                       Start by uploading documents
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </motion.div>

//             {/* Bar Chart */}
//             <motion.div
//               className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-72 w-full min-w-0"
//               initial={hasMounted ? { opacity: 0, scale: 0.95 } : false}
//               animate={{ opacity: 1, scale: 1 }}
//               transition={{ duration: 0.5, delay: 0.3 }}
//               whileHover={{ scale: 1.01 }}
//             >
//               <div className="mb-3">
//                 <h3 className="text-base font-semibold text-slate-800 mb-1">
//                   Upload Trends
//                 </h3>
//                 <p className="text-xs text-slate-500">
//                   Documents by month{" "}
//                   <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
//                     {barData.reduce((s, d) => s + d.value, 0)} total
//                   </span>
//                 </p>
//               </div>
//               {barData.some((d) => d.value > 0) ? (
//                 <ResponsiveContainer width="100%" height="75%" debounce={50}>
//                   <BarChart
//                     data={barData}
//                     margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
//                   >
//                     <CartesianGrid
//                       vertical={false}
//                       stroke="#f8fafc"
//                       strokeDasharray="3 3"
//                     />
//                     <XAxis
//                       dataKey="name"
//                       axisLine={false}
//                       tickLine={false}
//                       tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
//                     />
//                     <YAxis hide />
//                     <Tooltip content={<CustomBarTooltip />} />
//                     <Bar dataKey="value" radius={[5, 5, 0, 0]} barSize={24}>
//                       {barData.map((entry, index) => (
//                         <Cell
//                           key={`bar-${index}`}
//                           fill={
//                             [
//                               "#3b82f6",
//                               "#60a5fa",
//                               "#93c5fd",
//                               "#bfdbfe",
//                               "#dbeafe",
//                               "#eff6ff",
//                               "#e0f2fe",
//                               "#bae6fd",
//                               "#7dd3fc",
//                               "#38bdf8",
//                               "#0ea5e9",
//                               "#0284c7",
//                             ][index % 12]
//                           }
//                         />
//                       ))}
//                     </Bar>
//                   </BarChart>
//                 </ResponsiveContainer>
//               ) : (
//                 <div className="flex flex-col items-center justify-center h-full text-center">
//                   <BarChart3
//                     size={40}
//                     className="text-slate-300 mb-3"
//                     strokeWidth={1.5}
//                   />
//                   <p className="text-base font-semibold text-slate-400 mb-1">
//                     No Upload Data
//                   </p>
//                   <p className="text-sm text-slate-400">
//                     Documents need to be uploaded to display trends
//                   </p>
//                 </div>
//               )}
//             </motion.div>
//           </div>
//         </div>
//       </main>
//       <HelpDocModal
//         open={showHelpDoc}
//         onClose={() => setShowHelpDoc(false)}
//         title="Documentation Help"
//         content={DOCUMENTATION_HELP_CONTENT}
//       />

//       <footer className="bg-white/90 backdrop-blur-md border-t border-slate-100/50 shadow-lg px-8 py-5 sticky bottom-0 z-50">
//         <div className="max-w-7xl mx-auto text-center">
//           <p className="text-base text-slate-600 font-medium">
//             © {new Date().getFullYear()} CalVant. All rights reserved.
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default Documentation;


import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useEffectiveOrg } from "@/hooks/useEffectiveOrg";
import documentationService from "../services/documentationService";
import controlService from "../services/controlService";
import { useFramework, ALL_FRAMEWORKS } from "../../../context/FrameworkContex";
import Joyride from "react-joyride";
import CompactFrameworkFilter from "./CompactFrameworkFilter";
import { captureActivity, ACTIONS } from "../../../services/activities";
import HelpDocModal from "@/components/shared/HelpDocModal";

import {
  FileText,
  CheckCircle,
  AlertCircle,
  BarChart3,
  HelpCircle,
  FolderOpen,
  Archive,
  RefreshCw,
  BookOpen
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
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Documentation dashboard
// ---------------------------------------------------------------------------

const Documentation = () => {
  const router = useRouter();
  const chartsContainerRef = useRef(null);
  // 
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

  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role || ""];
  const deptLabel = isPrivilegedRole
    ? "All"
    : (user?.departments || []).map((d) => d.name).join(", ") || "Your";

  const [documentStats, setDocumentStats] = useState({
    total: 0,
    uploaded: 0,
    pending: 0,
    archived: 0,
  });
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);
  const [allDocuments, setAllDocuments] = useState([]);
  const [run, setRun] = useState(false);

  const [showHelpDoc, setShowHelpDoc] = useState(false);

  const DOCUMENTATION_HELP_CONTENT = `
# **calvant** 

Digital Compliance Management 

## **Policy Module** 

### **End-User Guide** 

Version 1.0  |  July 2026 

© 2026 CalVant. All rights reserved. 

Page 1 

# **Table of Contents** 

###### **1. Introduction** 

###### **2. Accessing the Policy Module** 

###### **3. Key Terminology** 

###### **4. Manual Navigation** 

4.1 Policies Dashboard 

4.2 Policies List View (Master List of Documents) 

4.3 Uploading a Policy Document 

4.4 Reviewing, Approving & Quality Check 

4.5 Creating a Task 

4.6 Archiving Policies 

###### **5. Status & Quality Reference** 

###### **6. Tips, Best Practices & Troubleshooting** 

Page 1 

CalVant — Policy Module User Guide 

#### **1. Introduction** 

The Policy Module in CalVant helps you create, upload, review, approve, and track the policy documents required for your compliance and information security program. It maps every policy to the controls in frameworks such as ISO 27001, ISO 27701, SOC 2, ISO 42001, and PDPL, and keeps a version-controlled record of what has been submitted, reviewed, and archived. 

#### **2. Accessing the Policy Module** 

After logging in to CalVant, use the left-hand navigation sidebar to move between modules. The sidebar gives you access to the Home/Dashboard, Risk, Policy, Audit, and other Task modules, along with account settings at the bottom. 

1. Click the Policy icon in the sidebar to land on your Policies Dashboard. 

2. Your logged-in user name and role (e.g., Root) appear in the top-right of the dashboard header. 

#### **3. Key Terminology** 

A short list of terms that are specific to CalVant's policy workflow rather than self-explanatory from the screen itself: 

|**Term**|**Definition**|
|---|---|
|**MLD (Master List of**<br>**Documents)**|The complete, filterable list of every policy record in the system — CalVant's<br>working name for the Policies list screen.|
|**SoA Linked**|A policy connected to an entry in the Statement of Applicability, shown in the<br>header stats and as a green SoA tag on each row.|



#### **4. Manual Navigation** 

With the vocabulary in place, this section walks through every screen in the module in the order you'll use them day to day — starting at the dashboard and ending at the archive. 

##### **4.1 Policies Dashboard** 

The Policies Dashboard is your home base for the module. It gives you an at-a-glance summary of every policy in your organization, along with quick actions to browse, upload, and manage documents. 

Page 3 



<!-- Start of picture text -->
8 Policies Dashboard<br>All + 57 total policies Ea ohn (2<br>TOTALSn DoeUPLOADED DewPENDING BARCHIVED Document Status<br>;uick Actions wep<br>©<br>Upload Trends<br>Documents by month 0 total<br>No Upload Data<br>Documents need to be uploaded to display trends<br><!-- End of picture text -->



<!-- Start of picture text -->
€ Back to Dashboard<br>Policies<br>Upload and manage your policies<br>Total: 170 Uploaded:0 SoALinked:68 1SO 27001: 170<br>earch policy, control ID or C-ID. By Framework (27001 > 27701 > SOC2 + 42001 PDPL) ¥ Uploaded: @ ¥ Uploaded X Not Uploaded Showing 170 of 170<br>Policies<br>Control ID Policy Name Related Framework Type Control Code Ownership Department —CalVant Version Status Subm<br>4. Information<br>c-1 ISMS Manual QD Guideline _ Understanding the " Security = To Upload<br>cantont Officer (ISO)<br>4. Information<br>C-1 ISMS Scope Doe Understanding the Security = To Upload<br>cones Officer (ISO)<br>42 Information<br>C-1 ISMS LOG Context & Objectives Log Understanding the Security - To Upload<br>laa baad Officer (ISO)<br>c-2 ISMS Manual Guideline 4.2Understandingcede and the , InformationSecurity - To Upload<br>expectations of Officer (ISO)<br>Policies<br>Upload and manage your policies<br>Total; 170 Uploaded: 0 SOA Linked: 68 180 27001<br>: ¥ By FrameworkPolicy Name (A (27001+ Z)  + 27701 + SOC2 + 42001 + POPL) ) Uploaded oO v Uptecded ) (x Net Uptondes Showing 170 of 170<br>Control ID (# Ase, grouped by framework)<br>Policies Control IO (4 Desc, grouped by framework)<br>SOA Linked First<br>Control 10 SoASoA DateDate (Newest)(Oldest) oe Control Code Ownership Department CalVant Version ‘Status ‘Subm<br>4a Information<br>Cl ISMS Manual @Z> (\s027001 ) Guideline er standing the Security - To Upload<br>—_ Officer (1S0)<br>44 Information<br>Cl ISMS Scope > (18027001 ) 0 handing the Security - To Upload<br>— Officer (ISO)<br>4a Information<br>C1 ISMS LOG Context & Objectives > (8027001) Log anding the Security - To Upload<br>L —— _—_—_.1_l_ Obi 0s.<br><!-- End of picture text -->

###### Policies 

|Department|CalVantVersion|Status|SubmittedBy|Submission Date|Approved By|ReviewDate|Upload|Remarks|QualityCheck|Add Task|
|---|---|---|---|---|---|---|---|---|---|---|
|information<br>|||||||||||
|Security|-|ToUptoad|-|~-|-|-|>Upload|-|||
|Officer (ISO)|||||||||||
|information<br>|||||||||||
|Security|-|ToUptoad|-|=|=|—|}Upload|-|||
|Officer (ISO)|||||||||||
|information|||||||||||
|Security|-|ToUptoad|-|-|—|=|>Upload|=|||
|Officer (ISO)|||||||||||
|information|||||||||||
|Security|=|ToUptoad|=|=|=|-|>Upload|-|||
|Officer(ISO)|||||||||||





<!-- Start of picture text -->
Policies<br>Department CalVant Version Status Submitted By Submission Date Approved By Review Date Upload Remarks Quality Check Add Task<br>Information<br>Information<br>Information —<br><!-- End of picture text -->



<!-- Start of picture text -->
Department *<br>Select department v<br>Assign To<br>Auto Assign (Risk Owner) v<br>Task Description *<br>Policy: ISMS Manual | Control: 4.1 (C-1)<br>Start Date * End Date*<br>15/07/2026 i] ddim yyyy o<br>Priority<br>Remarks<br>Canes!<br><!-- End of picture text -->



<!-- Start of picture text -->
IAMS<br>© Archived Policies<br>Policies archived from the MLD are stored here. You can permanently delete them when no longer needed<br>Total Archived:0 Shown: 0<br>0 of 0 archived<br>© Archive<br>* Policy Name CalVant Version Submitted By Department Uploaded On Reason (Remarks) Actions<br>No Archived Po! §<br><!-- End of picture text -->

CalVant — Policy Module User Guide 

###### **Document Status (Dashboard Tiles)** 

|**Status**|**Meaning**|
|---|---|
|**Total**|All policies currently tracked in the Master List of Documents.|
|**Uploaded**|Policies with a file attached and submitted for review.|
|**Pending**|Policies awaiting upload; shown as To Upload in the list.|
|**Archived**|Policies removed from the active list and stored in Archived Policies.|



###### **Row Status (Master List of Documents)** 

|**Status**|**Meaning**|
|---|---|
|**To Upload**|No document has been attached to this control yet.|
|**To Approve**|A document has been uploaded and is awaiting review.|
|**Approved**|The document has been reviewed and accepted.|
|**Archived**|The policy has been moved out of the active list.|



#### **6. Tips, Best Practices** 

1. Use the By Framework sort when preparing for a certification audit, so policies follow the same order as your framework. 

2. Review the Quality Check score and click Re-verify before approving a document, so incomplete files aren't approved by mistake. 

3. Use the Uploaded and Not Uploaded filter chips to focus on outstanding submissions ahead of a review cycle. 

4. Set realistic Start and End Dates when creating a task so follow-up work stays on schedule. 

5. Archive superseded policy versions instead of deleting them, so a Reason and audit trail are preserved. 

Page 9 
`;

  const {
    selectedFrameworks,
    toggleFramework,
    isAllSelected,
    availableFrameworks,
  } = useFramework();

  const steps = [
    {
      target: "#dashboard-header",
      content: `Welcome to your ${deptLabel} documentation dashboard.`,
    },
    {
      target: "#stats-grid",
      content: "Document compliance metrics at a glance.",
    },
    {
      target: "#charts-container",
      content: "Visual document status and detailed upload trends.",
    },
    {
      target: "#action-cards",
      content: "Quick access to document management tools.",
    },
  ];

  useEffect(() => {
    captureActivity({
      action: ACTIONS.PAGE_LOAD,
      item: [{ detail: "Documentation · Viewed dashboard" }],
      url: window.pathname,
    });
  }, []);

  // ── ResizeObserver for recharts ───────────────────────────────────────────
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(window.resizeTimeout);
      window.resizeTimeout = setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 150);
    });
    if (chartsContainerRef.current)
      resizeObserver.observe(chartsContainerRef.current);
    return () => {
      if (chartsContainerRef.current)
        resizeObserver.unobserve(chartsContainerRef.current);
      clearTimeout(window.resizeTimeout);
    };
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.push("/");
    }
  }, [mounted, user, router]);

  // useEffect(() => {
  //   collapseSidebar();
  // }, [collapseSidebar]);

  // ── Count total required docs from backend controls ───────────────────────
  const getTotalFromBackendControls = (controls, currentUser, userIsAdmin) => {
    const userDeptNames = (currentUser?.departments || []).map((d) =>
      (d.name || "").toLowerCase(),
    );
    const docsSet = new Set();
    controls.forEach((ctrl) => {
      if (!ctrl.documents?.length) return;
      const ctrlDepts = (ctrl.departmentIds || []).map((d) =>
        (d || "").toLowerCase(),
      );
      const docDepts = ctrl.documents
        .map((d) => (d.dept || "").toLowerCase())
        .filter(Boolean);
      const allDepts = [...ctrlDepts, ...docDepts];
      const hasAccess =
        userIsAdmin ||
        allDepts.length === 0 ||
        allDepts.some((d) => userDeptNames.includes(d));
      if (!hasAccess) return;
      ctrl.documents.forEach(({ doc }) => {
        if (doc) docsSet.add(doc);
      });
    });
    return docsSet.size;
  };

  // ── Load stats ─────────────────────────────────────────────────────────────
  const loadDocumentStats = useCallback(async () => {
    if (!user) return;
    try {
      const [docs, soaList, ...controlResults] = await Promise.all([
        documentationService.getDocuments().catch(() => []),
        documentationService.getSoAEntries().catch(() => []),
        ...availableFrameworks.map((fw) =>
          controlService.getControlsByFramework(fw.code).catch(() => []),
        ),
      ]);

      const normalize = (fw) => {
        if (!fw) return "";
        return fw.replace(/[\s_-]/g, "").toUpperCase();
      };

      const selectedFW = isAllSelected
        ? availableFrameworks.map((fw) => normalize(fw.code))
        : selectedFrameworks.map(normalize);

      const soaFrameworkMap = {};
      (soaList || []).forEach((soa) => {
        if (soa.id) soaFrameworkMap[String(soa.id)] = soa.framework;
      });

      const orgDocs = (docs || [])
        .filter((d) => d.organization === effectiveOrgId)
        .map((doc) => ({
          ...doc,
          framework:
            soaFrameworkMap[String(doc.soaId)] || doc.framework || null,
        }));

      const frameworkDocs = orgDocs.filter((doc) =>
        selectedFW.includes(normalize(doc.framework)),
      );

      setAllDocuments(frameworkDocs.filter((d) => !d.deleted));

      const frameworkControls = availableFrameworks
        .flatMap((fw, i) =>
          (controlResults[i] || []).map((c) => ({
            ...c,
            _fw: normalize(fw.code),
          })),
        )
        .filter((ctrl) => selectedFW.includes(ctrl._fw));

      const totalRequired = getTotalFromBackendControls(
        frameworkControls,
        user,
        isPrivilegedRole,
      );

      const uploaded = frameworkDocs.filter(
        (doc) => !!doc.url && !doc.deleted,
      ).length;

      // Count archived (soft-deleted) docs
      const archived = frameworkDocs.filter(
        (doc) => doc.deleted === true,
      ).length;

      setDocumentStats({
        total: totalRequired,
        uploaded,
        pending: Math.max(0, totalRequired - uploaded),
        archived,
      });
    } catch (error) {
      console.error("Error loading document stats:", error);
      setDocumentStats({ total: 0, uploaded: 0, pending: 0, archived: 0 });
    }
  }, [user, selectedFrameworks, isAllSelected, isPrivilegedRole, availableFrameworks, effectiveOrgId]);

  useEffect(() => {
    captureActivity({
      action: ACTIONS.PAGE_LOAD,
      item: "Documentation Dashboard",
      url: "/documentation",
    });
    loadDocumentStats();
  }, [loadDocumentStats]);

  if (!mounted || !user) return null;

  // ── Chart data ─────────────────────────────────────────────────────────────
  const pieData = [
    {
      name: "Uploaded",
      value: documentStats.uploaded,
      color: "#10b981",
      desc: `${documentStats.uploaded} documents`,
    },
    {
      name: "Pending",
      value: documentStats.pending,
      color: "#f59e0b",
      desc: `${documentStats.pending} documents`,
    },
  ].filter((d) => d.value > 0);

  const getMonthFromDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", { month: "short" });
  };

  const monthlyDetailedData = allDocuments.reduce((acc, doc) => {
    const month = getMonthFromDate(doc.createdAt || doc.created_at);
    if (month) {
      if (!acc[month]) acc[month] = { count: 0, dates: [], docs: [] };
      acc[month].count++;
      acc[month].dates.push(
        new Date(doc.createdAt || doc.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      );
      acc[month].docs.push(doc.name || doc.title || "Document");
    }
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
  ].map((m) => ({
    name: m,
    value: monthlyDetailedData[m]?.count || 0,
    details: monthlyDetailedData[m],
  }));

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg min-w-[200px]">
          <div className="font-semibold text-slate-800 text-sm mb-1">
            {data.name}
          </div>
          <div className="text-xl font-bold text-slate-900 mb-1">
            {data.value}
          </div>
          <div className="text-xs text-slate-600">{data.desc}</div>
          <div className="text-xs text-slate-500 mt-1">
            {((data.value / (documentStats.total || 1)) * 100).toFixed(1)}% of
            total
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      const details = data.details;
      if (!details || details.count === 0) {
        return (
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg">
            <div className="font-semibold text-slate-800 text-sm mb-1">
              {data.name}
            </div>
            <div className="text-xl font-bold text-slate-900 mb-1">
              {data.value}
            </div>
            <div className="text-xs text-slate-500">No uploads</div>
          </div>
        );
      }
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-lg max-w-sm max-h-60 overflow-y-auto">
          <div className="font-semibold text-slate-800 text-sm mb-3">
            {data.name}{" "}
            <span className="text-slate-600">({data.value} docs)</span>
          </div>
          {details.dates.slice(0, 5).map((date, index) => (
            <div
              key={index}
              className="flex items-center gap-2 py-1 border-b border-slate-100 last:border-b-0 text-xs"
            >
              <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
              <div>
                <div className="font-medium text-slate-900">
                  {details.docs[index] || "Document"}
                </div>
                <div className="text-slate-500 text-[10px]">{date}</div>
              </div>
            </div>
          ))}
          {details.dates.length > 5 && (
            <div className="text-xs text-slate-500 mt-2">
              +{details.dates.length - 5} more uploads
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const actionCards = [
    {
      id: "mld",
      icon: FolderOpen,
      title: "Master List of Documents",
      subtitle: "MLD",
      path: "/documentation/mld",
      color: "from-emerald-400 to-emerald-500",
      primary: true, // only one card gets the highlighted ring, matching Task Dashboard's "Create Task"
    },
    {
      id: "upload",
      icon: FolderOpen,
      title: "Upload",
      subtitle: "Documents",
      path: "/documentation/mld",
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "view",
      icon: FolderOpen,
      title: "View",
      subtitle: "Documents",
      path: "/documentation/mld",
      color: "from-orange-400 to-red-500",
    },
    {
      id: "archived",
      icon: Archive,
      title: "Archived",
      subtitle: `${documentStats.archived} document${documentStats.archived !== 1 ? "s" : ""}`,
      path: "/documentation/archived",
      color: "from-slate-400 to-slate-600",
      badge: documentStats.archived > 0 ? documentStats.archived : null,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex flex-col overflow-hidden">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2 lg:py-8 pb-24 lg:pb-28 overflow-hidden">
        <Joyride
          steps={steps}
          run={run}
          continuous
          showSkipButton
          scrollToFirstStep
          styles={{ options: { primaryColor: "#3b82f6", width: 300 } }}
        />

        {/* Header */}
        <motion.header
          id="dashboard-header"
          className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl shadow-md mb-2 p-6 !text-left"
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
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              <div style={{ textAlign: "left" }}>
                <h1 className="text-2xl font-semibold text-slate-800 leading-tight">
                  Policies Dashboard
                </h1>
                <p className="text-base text-slate-600 mt-1">
                  {deptLabel} •{" "}
                  <span className="font-bold text-2xl text-slate-900">
                    {documentStats.total}
                  </span>{" "}
                  total policies
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isPrivilegedRole ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
                {isPrivilegedRole ? "Root" : (userRoles[0] ? userRoles[0].replace("_", " ") : "User")}
              </span>
              <span className="text-sm font-semibold text-slate-600">
                {user?.name || "User"}
              </span>
              <motion.button
                onClick={loadDocumentStats}
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
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
                onClick={() => {
                  setRun(false);
                  setTimeout(() => setRun(true), 100);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <HelpCircle size={18} />
                <span>Tutorial</span>
              </motion.button>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 w-full min-w-0">
          {/* LEFT */}
          <div className="space-y-10 w-full min-w-0">
            {/* Stats Grid */}
            <motion.section
              id="stats-grid"
              className="grid grid-cols-2 md:grid-cols-3 gap-4 items-stretch"
              initial={hasMounted ? { opacity: 0, y: 15 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {[
                {
                  Icon: FileText,
                  value: documentStats.total,
                  label: "Total",
                  color: "from-blue-400 to-blue-500",
                  id: "total-docs",
                  path: "/documentation/mld",
                },
                {
                  Icon: CheckCircle,
                  value: documentStats.uploaded,
                  label: "Uploaded",
                  color: "from-emerald-400 to-emerald-500",
                  id: "uploaded-docs",
                  path: "/documentation/mld",
                },
                {
                  Icon: AlertCircle,
                  value: documentStats.pending,
                  label: "Pending",
                  color: "from-orange-400 to-orange-500",
                  id: "pending-docs",
                  path: "/documentation/mld",
                },
                {
                  Icon: Archive,
                  value: documentStats.archived,
                  label: "Archived",
                  color: "from-slate-400 to-slate-600",
                  id: "archived-docs",
                  path: "/documentation/archived",
                },
              ].map(({ Icon: IconComponent, value, label, color, id, path }, i) => (
                <motion.div
                  key={id}
                  className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center gap-3 h-full min-h-[84px] hover:bg-white"
                  onClick={() => router.push(path)}
                  initial={hasMounted ? { opacity: 0, y: 20 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div
                    className={`w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-md flex-shrink-0`}
                  >
                    <IconComponent size={16} className="lg:size-18 text-white drop-shadow-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-lg lg:text-xl font-semibold text-slate-800 block leading-tight group-hover:text-slate-900">
                      {value}
                    </span>
                    <span className="text-[11px] lg:text-xs font-semibold text-slate-600 uppercase tracking-wide leading-snug block pb-0.5">
                      {label}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.section>

            {/* Action Cards */}
            <motion.section
              id="action-cards"
              className="space-y-1"
              initial={hasMounted ? { opacity: 0, y: 5 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-lg lg:text-xl font-semibold text-slate-800 mb-6 px-1">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-15">
                <AnimatePresence>
                  {actionCards.map(
                    ({ id, icon: Icon, title, subtitle, path, color, primary, badge }, index) => (
                      <motion.div
                        key={id}
                        className={`group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-4 h-full flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer relative ${primary ? "ring-2 ring-emerald-200/50 bg-gradient-to-br " + color : ""}`}
                        initial={hasMounted ? { opacity: 0, scale: 0.9 } : false}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4, delay: 0.4 + index * 0.06 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => router.push(path)}
                      >
                        {badge != null && badge > 0 && (
                          <span
                            style={{
                              position: "absolute", top: "10px", right: "10px",
                              background: "#ef4444", color: "white", borderRadius: "50%",
                              width: "20px", height: "20px", display: "flex",
                              alignItems: "center", justifyContent: "center",
                              fontSize: "10px", fontWeight: 700,
                            }}
                          >
                            {badge}
                          </span>
                        )}
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-md flex-shrink-0 ${primary ? "bg-white/20 backdrop-blur-sm" : `bg-gradient-to-br ${color}`}`}
                        >
                          <Icon size={20} className="text-white drop-shadow-sm" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <h4 className="text-sm lg:text-base font-semibold text-center text-slate-800 leading-tight mb-1 px-1 truncate group-hover:text-blue-600 transition-colors duration-200">
                            {title}
                          </h4>
                          <p className="text-xs font-bold text-center text-slate-600 px-1 truncate">
                            {subtitle}
                          </p>
                        </div>
                      </motion.div>
                    ),
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          </div>

          {/* RIGHT — Charts */}
          <div
            ref={chartsContainerRef}
            id="charts-container"
            className="space-y-1 w-full min-w-0"
          >
            {/* Pie Chart */}
            <motion.div
              className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-3 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-400 h-64 flex flex-col w-full min-w-0"
              initial={hasMounted ? { opacity: 0, scale: 0.95 } : false}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.01 }}
            >
              <h3 className="text-lg font-semibold text-slate-800 mb-6">
                Document Status
              </h3>
              <div className="h-40 flex items-center justify-center w-full min-w-0">
                {documentStats.total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={65}
                        paddingAngle={2}
                        stroke="white"
                        strokeWidth={3}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <text
                        x="50%"
                        y="42%"
                        textAnchor="middle"
                        dominantBaseline="left"
                        className="fill-slate-700 text-sm font-semibold"
                      >
                        Total
                      </text>
                      <text
                        x="50%"
                        y="52%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-slate-900 text-2xl font-bold"
                      >
                        {documentStats.total}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <FileText
                      size={48}
                      className="text-slate-400 mb-4"
                      strokeWidth={1.5}
                    />
                    <p className="text-xl font-semibold text-slate-500 mb-2">
                      No Policies
                    </p>
                    <p className="text-base text-slate-500 max-w-xs">
                      Start by uploading documents
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Bar Chart */}
            <motion.div
              className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-72 w-full min-w-0"
              initial={hasMounted ? { opacity: 0, scale: 0.95 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="mb-3">
                <h3 className="text-base font-semibold text-slate-800 mb-1">
                  Upload Trends
                </h3>
                <p className="text-xs text-slate-500">
                  Documents by month{" "}
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                    {barData.reduce((s, d) => s + d.value, 0)} total
                  </span>
                </p>
              </div>
              {barData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="75%" debounce={50}>
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
                      {barData.map((entry, index) => (
                        <Cell
                          key={`bar-${index}`}
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
                            ][index % 12]
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
                    No Upload Data
                  </p>
                  <p className="text-sm text-slate-400">
                    Documents need to be uploaded to display trends
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
        title="Documentation Help"
        content={DOCUMENTATION_HELP_CONTENT}
      />

      <footer className="bg-white/90 backdrop-blur-md border-t border-slate-100/50 shadow-lg px-8 py-5 sticky bottom-0 z-50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-base text-slate-600 font-medium">
            © {new Date().getFullYear()} CalVant. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Documentation;
