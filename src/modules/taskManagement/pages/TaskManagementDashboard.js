// //Working - full n final
// import React, {
//   useState,
//   useEffect,
//   useCallback,
//   useMemo,
//   useRef,
// } from "react";
// import { useRouter } from "next/navigation";
// import { useEffectiveOrg } from "@/hooks/useEffectiveOrg";
// import taskService from "../services/taskService";
// import Joyride, { STATUS } from "react-joyride";
// import {
//   BarChart3,
//   FileText,
//   CheckCircle,
//   CheckCircle2,
//   Circle,
//   AlertTriangle,
//   Clock,
//   FolderOpen,
//   Users,
//   Award,
//   HelpCircle,
//   PieChartIcon,
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
// import HelpDocModal from "@/components/shared/HelpDocModal";

// // ── Logging ───────────────────────────────────────────────────────────────────
// import { captureActivity, ACTIONS, MODULES } from "../../admin/shell/services/activities";

// // ── Overdue / Due Soon helpers (derived, not real status values) ──────────────
// const DUE_SOON_DAYS = 3;
// function isTaskOverdue(t) {
//   return !!t.endDate && new Date(t.endDate) < new Date() && t.status !== "Done";
// }
// function isTaskDueSoon(t) {
//   if (!t.endDate || t.status === "Done") return false;
//   const diffDays = (new Date(t.endDate) - new Date()) / (1000 * 60 * 60 * 24);
//   return diffDays >= 0 && diffDays <= DUE_SOON_DAYS;
// }

// const TaskManagementDashboard = () => {
//   const router = useRouter();
//   const chartsContainerRef = useRef(null);

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
//   const [run, setRun] = useState(false);

//   const [showHelpDoc, setShowHelpDoc] = useState(false);

// const TASK_HELP_CONTENT = `
// # **calvant** 

// Digital Compliance Management 

// ## **Task Module** 

// ### **End-User Guide** 

// Version 1.0  |  July 2026 

// © 2026 CalVant. All rights reserved. 

// #### **Table of Contents** 

// ###### **1. Introduc4on** 

// ###### **2. Accessing the Task Module** 

// 2.1 How Task Module Integrates with Calvant 

// 2.2 Typical workflow 

// ###### **3. Key Terminology** 

// ###### **4. Manual Naviga4on** 

// 4.1 Task Dashboard 

// 4.2 AcBon Plan 

// 4.3 CreaBng a Task 

// 4.4 My Task 

// 4.5 Task AcBons 

// 4.6 Viewing Task Details 

// ###### **5. Status & Quality Reference** 

// ###### **6. Tips, Best Prac4ces & Troubleshoo4ng** 

// #### **1. Introduc4on** 

// The Task Module is the centralized task management workspace in CalVant. Tasks created from Risk, Compliance, Policy, Audit, and other modules are managed here, allowing users to assign, monitor, update, and complete acBviBes from a single locaBon. 

// #### **2. Accessing the Task Module** 

// 1. Click the Task icon in the sidebar to land on your Task Dashboard. 

// ##### **2.1 How Task Module Integrates with Calvant** 

// The Task Module serves as the execuBon layer of CalVant. While other modules idenBfy compliance requirements, risks, gaps, policies, audits, and vendor acBviBes, the Task Module enables organizaBons to assign ownership, track progress, and monitor compleBon of the acBons required to achieve compliance. 

// Tasks may originate from or support mulBple modules, including: 

// 1. **Risk Assessment** – Risk treatment and miBgaBon acBviBes. 

// 2. **Compliance** – Control implementaBon and remediaBon. 

// 3. **Policy** – Policy draRing, review, approval, and periodic review. 

// 4. **TPRM** – Vendor assessments, evidence collecBon, and follow-up acBons. 

// 5. **Audit** – CorrecBve acBons arising from audit findings. 

// ##### **2.2 Typical workflow:** 

// IdenBfy Requirement/Risk → Create Task → Assign Owner → Track Progress → Complete Task → Change Task Status → Receive NoBficaBon 

// #### **3. Key Terminologies** 

// |**Term**|**Defni4on**|
// |---|---|
// |Assignee|User responsible for compleBng the task|
// |Reporter|User who created the task|



// #### **4. Manual Naviga4on** 

// ##### **4.1 Task Dashboard** 



// 1. Review status, assignee, reporter and priority. 

// 2. Track history, remarks and work log. 

// 3. View subtasks where available. 

// #### **5. Status Reference** 

// |**Status**|**Meaning**|
// |---|---|
// |To-Do|Task has not been started|
// |In Progress|Work is currently underway|
// |Done|Taks has been completed|
// |On Hold|Task is temporarily paused|



// #### **6. Tips & Best Prac4ces** 

// 1. Assign every task to the appropriate department and owner. 

// 2. Use remarks and work logs to record important updates. 

// 3. Review overdue tasks periodically. 
// `;

//   const [hasMounted, setHasMounted] = useState(false);
//   useEffect(() => { setHasMounted(true); }, []);

//   // ── Total / Completed / Due Soon / Overdue — no In Progress here (that lives
//   // only in the Manage Task screen) ──
//   const [taskStats, setTaskStats] = useState({
//     total: 0,
//     completed: 0,
//     dueSoon: 0,
//     overdue: 0,
//   });
//   const [allTasks, setAllTasks] = useState([]);

//   // Kept for the header badge / label only — NOT used for task visibility anymore.
//   const { isAdmin, userDeptNames, departmentLabel } = useMemo(() => {
//     if (!user)
//       return { isAdmin: false, userDeptNames: [], departmentLabel: "" };

//     const depts = user?.departments || [];
//     const names = depts.map((d) => d.name.trim().toLowerCase());

//     return {
//       isAdmin: isPrivilegedRole,
//       userDeptNames: names,
//       departmentLabel: isPrivilegedRole
//         ? "All"
//         : depts.map((d) => d.name).join(", ") ||
//         user?.department?.name ||
//         "General",
//     };
//   }, [user, isPrivilegedRole]);

//   useEffect(() => {
//     const resizeObserver = new ResizeObserver((entries) => {
//       for (let entry of entries) {
//         clearTimeout(window.resizeTimeout);
//         window.resizeTimeout = setTimeout(() => {
//           window.dispatchEvent(new Event("resize"));
//         }, 150);
//       }
//     });

//     if (chartsContainerRef.current) {
//       resizeObserver.observe(chartsContainerRef.current);
//     }

//     return () => {
//       if (chartsContainerRef.current) {
//         resizeObserver.unobserve(chartsContainerRef.current);
//       }
//       clearTimeout(window.resizeTimeout);
//     };
//   }, []);

//   // ── Visibility rule: root sees the whole org's tasks; everyone else sees
//   // only tasks assigned to them. ──
//   const loadTaskStats = useCallback(async () => {
//     if (!user) return;

//     captureActivity({ action: ACTIONS.VISITED, module: MODULES.TASK, url: "/task-management" });

//     try {
//       const tasks = await taskService.getAllTasks();
//       if (!Array.isArray(tasks)) return;

//       const orgTasks = tasks.filter(
//         (t) => t.organization === effectiveOrgId,
//       );

//       const visibleTasks = isRoot
//         ? orgTasks
//         : orgTasks.filter((t) => {
//             const emp = t.employee;
//             if (!emp) return false;
//             return (
//               String(emp) === String(user?._id || user?.id) ||
//               emp === user?.name ||
//               emp === user?.username
//             );
//           });

//       setAllTasks(visibleTasks);

//       setTaskStats({
//         total: visibleTasks.length,
//         completed: visibleTasks.filter((t) => t.status === "Done").length,
//         overdue: visibleTasks.filter(isTaskOverdue).length,
//         dueSoon: visibleTasks.filter(isTaskDueSoon).length,
//       });
//     } catch (error) {
//       console.error("Error loading task stats:", error);
//     }
//   }, [user, isRoot, effectiveOrgId]);

//   useEffect(() => {
//     loadTaskStats();
//   }, [loadTaskStats]);

//   useEffect(() => {
//     if (mounted && !user) {
//       router.push("/");
//     }
//   }, [mounted, user, router]);

//   if (!mounted || !user) return null;

//   // Charts Data Processing
//   const getMonthFromDate = (dateString) => {
//     if (!dateString) return null;
//     const date = new Date(dateString);
//     const monthNames = [
//       "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
//     ];
//     return monthNames[date.getMonth()];
//   };

//   // ── Pie: Completed / Overdue / Due Soon / Others (rest of the total) ──
//   const otherCount = Math.max(
//     0,
//     taskStats.total - taskStats.completed - taskStats.overdue - taskStats.dueSoon,
//   );

//   const pieData = [
//     {
//       name: "Completed",
//       value: taskStats.completed,
//       color: "#10b981",
//       desc: `${taskStats.completed} completed tasks`,
//     },
//     {
//       name: "Overdue",
//       value: taskStats.overdue,
//       color: "#ef4444",
//       desc: `${taskStats.overdue} overdue tasks`,
//     },
//     {
//       name: "Due Soon",
//       value: taskStats.dueSoon,
//       color: "#f59e0b",
//       desc: `${taskStats.dueSoon} due within ${DUE_SOON_DAYS} days`,
//     },
//     {
//       name: "Others",
//       value: otherCount,
//       color: "#3b82f6",
//       desc: `${otherCount} other tasks`,
//     },
//   ].filter((d) => d.value > 0);

//   const realMonthlyData = allTasks.reduce((acc, task) => {
//     const month = getMonthFromDate(task.createdAt || task.created_at);
//     if (month) acc[month] = (acc[month] || 0) + 1;
//     return acc;
//   }, {});

//   const barData = [
//     { name: "Jan", value: realMonthlyData.Jan || 0 },
//     { name: "Feb", value: realMonthlyData.Feb || 0 },
//     { name: "Mar", value: realMonthlyData.Mar || 0 },
//     { name: "Apr", value: realMonthlyData.Apr || 0 },
//     { name: "May", value: realMonthlyData.May || 0 },
//     { name: "Jun", value: realMonthlyData.Jun || 0 },
//     { name: "Jul", value: realMonthlyData.Jul || 0 },
//     { name: "Aug", value: realMonthlyData.Aug || 0 },
//     { name: "Sep", value: realMonthlyData.Sep || 0 },
//     { name: "Oct", value: realMonthlyData.Oct || 0 },
//     { name: "Nov", value: realMonthlyData.Nov || 0 },
//     { name: "Dec", value: realMonthlyData.Dec || 0 },
//   ];

//   // COMPACT Tooltips
//   const CustomPieTooltip = ({ active, payload }) => {
//     if (active && payload && payload.length) {
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
//             {((data.value / (taskStats.total || 1)) * 100).toFixed(1)}% of total
//           </div>
//         </div>
//       );
//     }
//     return null;
//   };

//   const CustomBarTooltip = ({ active, payload }) => {
//     if (active && payload && payload.length) {
//       const data = payload[0].payload;
//       const percentage =
//         taskStats.total > 0
//           ? ((data.value / taskStats.total) * 100).toFixed(1)
//           : 0;

//       const monthInfo = {
//         Jan: "January", Feb: "February", Mar: "March", Apr: "April",
//         May: "May", Jun: "June", Jul: "July", Aug: "August",
//         Sep: "September", Oct: "October", Nov: "November", Dec: "December",
//       };
//       return (
//         <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg min-w-[240px] max-h-[200px]">
//           <div className="flex items-center gap-2 mb-2 pb-1">
//             <div className="w-2 h-2 rounded-full bg-blue-500" />
//             <span className="font-bold text-sm text-slate-900">
//               {data.name}
//             </span>
//           </div>
//           <div className="text-2xl font-bold text-slate-900 mb-2">
//             {data.value}
//           </div>
//           <div className="grid grid-cols-2 gap-2 text-xs mb-2">
//             <div className="text-slate-600">{monthInfo[data.name]}</div>
//             <div className="text-right">
//               <span className="font-semibold text-slate-800">
//                 {percentage}%
//               </span>
//               <span className="text-slate-500"> of total</span>
//             </div>
//           </div>
//           <div className="text-xs text-slate-600 space-y-0.5 mb-2 bg-slate-50 p-2 rounded">
//             <div className="font-medium">How calculated:</div>
//             <div className="text-left pl-2">
//               •{" "}
//               <code className="text-xs bg-blue-100 px-1 rounded">
//                 createdAt
//               </code>{" "}
//               in {data.name}
//             </div>
//             <div className="text-left pl-2">• {departmentLabel} dept only</div>
//           </div>
//           <div className="text-xs text-slate-400 text-center mt-1 pt-1 border-t border-slate-100">
//             🔄 Live database data
//           </div>
//         </div>
//       );
//     }
//     return null;
//   };

//   // ── Stat cards: Total / Completed / Due Soon / Overdue ──
//   const statsCards = [
//     {
//       Icon: BarChart3,
//       value: taskStats.total,
//       label: "Total Tasks",
//       color: "from-blue-400 to-blue-500",
//       filterKey: "all",
//     },
//     {
//       Icon: CheckCircle2,
//       value: taskStats.completed,
//       label: "Done",
//       color: "from-green-400 to-green-500",
//       filterKey: "done",
//     },
//     {
//       Icon: Clock,
//       value: taskStats.dueSoon,
//       label: "Due Soon",
//       color: "from-orange-400 to-orange-500",
//       filterKey: "dueSoon",
//     },
//     {
//       Icon: AlertTriangle,
//       value: taskStats.overdue,
//       label: "Overdue",
//       color: "from-red-400 to-red-500",
//       filterKey: "overdue",
//     },
//   ];

//   const actionCards = [
//     {
//       id: "tasks",
//       icon: FileText,
//       title: "Manage Tasks",
//       subtitle: "All Tasks",
//       path: "/task-management/tasks",
//       color: "from-violet-400 to-violet-500",
//     },
//     {
//       id: "dept",
//       icon: Users,
//       title: "My Tasks",
//       subtitle: "Repository",
//       path: "/task-management/departmenttasks",
//       color: "from-emerald-400 to-emerald-500",
//       primary: true,
//     },
//   ];

//   const steps = [
//     {
//       target: "#dashboard-header",
//       content: `Welcome to your ${departmentLabel} task management dashboard.`,
//     },
//     {
//       target: "#stats-grid",
//       content: "Quick metrics overview at a glance.",
//     },
//     {
//       target: "#charts-container",
//       content: "Visual task distribution and trends analysis.",
//     },
//     {
//       target: "#action-cards",
//       content: "Quick access to all task management tools.",
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex flex-col overflow-hidden">
//       <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2 lg:py-6 pb-20 lg:pb-26 overflow-hidden">
//         <Joyride
//           steps={steps}
//           run={run}
//           continuous
//           showSkipButton
//           scrollToFirstStep
//           styles={{ options: { primaryColor: "#3b82f6", width: 300 } }}
//           callback={(data) => {
//             if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status))
//               setRun(false);
//           }}
//         />

//         {/* Header */}
//         <motion.header
//           id="dashboard-header"
//           className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl shadow-md mb-2 lg:mb-2 p-4 lg:p-5 !text-left"
//           style={{ textAlign: "left", width: "100%", justifyContent: "flex-start", alignItems: "flex-start", justifyItems: "flex-start" }}
//           initial={hasMounted ? { opacity: 0, y: -15 } : false}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//         >
//           <div className="flex items-center justify-between w-full">

//             {/* LEFT SIDE: ICON + TITLE */}
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
//                 <BarChart3 className="w-6 h-6 text-white" />
//               </div>

//               <div>
//                 <h1 className="text-xl font-semibold text-slate-800">
//                   Task Dashboard
//                 </h1>
//                 <p className="text-sm text-slate-600">
//                   {departmentLabel} •{" "}
//                   <span className="font-bold text-slate-900">
//                     {taskStats.total}
//                   </span>{" "}
//                   total tasks
//                 </p>
//               </div>
//             </div>

//             {/* RIGHT SIDE: BUTTONS */}
//             <div className="flex items-center gap-3">
//               <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isAdmin ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
//                 {isAdmin ? "Admin" : "User"}
//               </span>
//               <span className="text-sm font-semibold text-slate-600">
//                 {user?.name || "User"}
//               </span>
//               <motion.button
//                 onClick={() => {
//                   captureActivity({ action: ACTIONS.CLICK, module: MODULES.TASK, item: "Refresh Dashboard", url: "/task-management" });
//                   loadTaskStats();
//                 }}
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
//                 className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
//                 onClick={() => {
//                   captureActivity({ action: ACTIONS.CLICK, module: MODULES.TASK, item: "Open Guide", url: "/task-management" });
//                   setRun(false);
//                   setTimeout(() => setRun(true), 100);
//                 }}
//                 whileHover={{ scale: 1.02 }}
//                 whileTap={{ scale: 0.98 }}
//               >
//                 <HelpCircle size={18} />
//                 <span>Guide</span>
//               </motion.button>
//             </div>

//           </div>
//         </motion.header>

//         <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-10 h-full">
//           {/* Left: Stats + Actions */}
//           <div className="space-y-8 lg:space-y-10">
//             {/* Stats Grid */}
//             <motion.section
//               id="stats-grid"
//               className="grid grid-cols-2 md:grid-cols-3 gap-4 items-stretch"
//               initial={hasMounted ? { opacity: 0, y: 15 } : false}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.5, delay: 0.1 }}
//             >
//               {statsCards.map(({ Icon, value, label, color, filterKey }, i) => (
//                 <motion.div
//                   key={label}
//                   className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center gap-3 h-full min-h-[84px] hover:bg-white"
//                   onClick={() => {
//                     captureActivity({ action: ACTIONS.CLICK, module: MODULES.TASK, item: `Stat Card - ${label}`, url: "/task-management" });
//                     const query = filterKey && filterKey !== "all" ? `?filter=${filterKey}` : "";
//                     router.push(`/task-management/tasks${query}`);
//                   }}
//                   initial={hasMounted ? { opacity: 0, y: 20 } : false}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
//                   whileHover={{ scale: 1.02 }}
//                 >
//                   <div
//                     className={`w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-md flex-shrink-0`}
//                   >
//                     <Icon
//                       size={16}
//                       className="lg:size-18 text-white drop-shadow-sm"
//                     />
//                   </div>
//                   <div className="min-w-0 flex-1">
//                     <span className="text-lg lg:text-xl font-semibold text-slate-800 block leading-tight group-hover:text-slate-900">
//                       {value}
//                     </span>
//                     <span className="text-[11px] lg:text-xs font-semibold text-slate-600 uppercase tracking-wide leading-snug block pb-0.5">
//                       {label}
//                     </span>
//                   </div>
//                 </motion.div>
//               ))}
//             </motion.section>

//             {/* Quick Actions */}
//             <motion.section
//               id="action-cards"
//               className="space-y-1"
//               initial={hasMounted ? { opacity: 0, y: 20 } : false}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.5, delay: 0.3 }}
//             >
//               <h3 className="text-lg lg:text-xl font-semibold text-slate-800 mb-6 px-1">
//                 Quick Actions
//               </h3>
//               <div className="grid grid-cols-2 md:grid-cols-3 gap-3 h-15">
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
//                         show = true,
//                       },
//                       index,
//                     ) =>
//                       show && (
//                         <motion.div
//                           key={id}
//                           className={`group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-4 h-full flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer ${primary ? "ring-2 ring-emerald-200/50 bg-gradient-to-br " + color : ""}`}
//                           initial={hasMounted ? { opacity: 0, scale: 0.9 } : false}
//                           animate={{ opacity: 1, scale: 1 }}
//                           exit={{ opacity: 0, scale: 0.9 }}
//                           transition={{
//                             duration: 0.4,
//                             delay: 0.4 + index * 0.06,
//                           }}
//                           whileHover={{ scale: 1.02 }}
//                           onClick={() => {
//                             captureActivity({ action: ACTIONS.CLICK, module: MODULES.TASK, item: `Action Card - ${title}`, url: "/task-management" });
//                             router.push(path);
//                           }}
//                         >
//                           <div
//                             className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-md flex-shrink-0 ${primary ? "bg-white/20 backdrop-blur-sm" : `bg-gradient-to-br ${color}`}`}
//                           >
//                             <Icon
//                               size={20}
//                               className={`${primary ? "text-white" : "text-white"} drop-shadow-sm`}
//                             />
//                           </div>
//                           <div className="flex-1 flex flex-col justify-center">
//                             <h4 className="text-sm lg:text-base font-semibold text-center text-slate-800 leading-tight mb-1 px-1 truncate group-hover:text-blue-600 transition-colors duration-200">
//                               {title}
//                             </h4>
//                             <p className="text-xs font-bold text-center text-slate-600 px-1 truncate">
//                               {subtitle}
//                             </p>
//                           </div>
//                         </motion.div>
//                       ),
//                   )}
//                 </AnimatePresence>
//               </div>
//             </motion.section>
//           </div>

//           {/* Right: Charts */}
//           <div
//             ref={chartsContainerRef}
//             id="charts-container"
//             className="space-y-4 lg:space-y-3"
//           >
//             {/* Pie Chart - Task Distribution */}
//             <motion.div
//               className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-6 lg:p-7 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-400 h-72 flex flex-col"
//               initial={hasMounted ? { opacity: 0, scale: 0.95 } : false}
//               animate={{ opacity: 1, scale: 1 }}
//               whileHover={{ scale: 1.01 }}
//             >
//               <h3 className="text-base lg:text-lg font-semibold text-slate-800 mb-6 px-1">
//                 Task Distribution
//               </h3>
//               <div className="flex-1 flex items-center justify-center min-h-0">
//                 {taskStats.total > 0 ? (
//                   <ResponsiveContainer width="100%" height="100%">
//                     <PieChart>
//                       <Pie
//                         data={pieData}
//                         dataKey="value"
//                         nameKey="name"
//                         cx="50%"
//                         cy="50%"
//                         innerRadius={42}
//                         outerRadius={76}
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
//                         dominantBaseline="middle"
//                         fill="#475569"
//                         fontSize={12}
//                         fontWeight={600}
//                       >
//                         Total
//                       </text>
//                       <text
//                         x="50%"
//                         y="52%"
//                         textAnchor="middle"
//                         dominantBaseline="middle"
//                         fill="#111827"
//                         fontSize={20}
//                         fontWeight={700}
//                       >
//                         {taskStats.total}
//                       </text>
//                     </PieChart>
//                   </ResponsiveContainer>
//                 ) : (
//                   <div className="flex flex-col items-center justify-center h-full text-center p-8">
//                     <PieChartIcon
//                       size={40}
//                       className="text-slate-400 mb-4"
//                       strokeWidth={1.5}
//                     />
//                     <p className="text-lg font-semibold text-slate-500 mb-2">
//                       No Data
//                     </p>
//                     <p className="text-sm text-slate-500 max-w-xs">
//                       Start by creating tasks
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </motion.div>

//             {/* Bar Chart - Monthly Task Creation Trends */}
//             <motion.div
//               style={{
//                 background: "rgba(255,255,255,0.7)",
//                 backdropFilter: "blur(8px)",
//                 border: "1px solid #f1f5f9",
//                 borderRadius: "16px",
//                 padding: "24px",
//                 height: "288px",
//                 display: "flex",
//                 flexDirection: "column",
//                 boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
//                 transition: "all 0.4s ease",
//               }}
//               initial={hasMounted ? { opacity: 0, scale: 0.95 } : false}
//               animate={{ opacity: 1, scale: 1 }}
//               transition={{ duration: 0.5, delay: 0.3 }}
//               whileHover={{ scale: 1.01 }}
//             >
//               <div style={{ marginBottom: "14px" }}>
//                 <h3
//                   style={{
//                     fontSize: "16px",
//                     fontWeight: 600,
//                     color: "#1e293b",
//                     marginBottom: "4px",
//                   }}
//                 >
//                   📈 Monthly Task Creation Trends
//                 </h3>

//                 <p
//                   style={{
//                     fontSize: "13px",
//                     color: "#64748b",
//                     fontWeight: 500,
//                   }}
//                 >
//                   Each bar shows NEW tasks created each month
//                 </p>
//               </div>

//               <div style={{ flex: 1 }}>
//                 {barData.some((d) => d.value > 0) ? (
//                   <ResponsiveContainer width="100%" height="100%">
//                     <BarChart
//                       data={barData}
//                       margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
//                       barCategoryGap="25%"
//                     >
//                       <CartesianGrid
//                         vertical={false}
//                         stroke="#f1f5f9"
//                         strokeDasharray="3 3"
//                       />

//                       <XAxis
//                         dataKey="name"
//                         axisLine={false}
//                         tickLine={false}
//                         tick={{
//                           fontSize: 12,
//                           fill: "#6b7280",
//                           fontWeight: 500,
//                         }}
//                       />

//                       <Tooltip content={<CustomBarTooltip />} />

//                       <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={24}>
//                         {barData.map((entry, index) => (
//                           <Cell
//                             key={`bar-${index}`}
//                             fill={
//                               [
//                                 "#3b82f6",
//                                 "#60a5fa",
//                                 "#93c5fd",
//                                 "#bfdbfe",
//                                 "#dbeafe",
//                                 "#eff6ff",
//                                 "#e0f2fe",
//                                 "#bae6fd",
//                                 "#7dd3fc",
//                                 "#38bdf8",
//                                 "#0ea5e9",
//                                 "#0284c7",
//                               ][index]
//                             }
//                           />
//                         ))}
//                       </Bar>
//                     </BarChart>
//                   </ResponsiveContainer>
//                 ) : (
//                   <div
//                     style={{
//                       display: "flex",
//                       flexDirection: "column",
//                       alignItems: "center",
//                       justifyContent: "center",
//                       height: "100%",
//                       textAlign: "center",
//                     }}
//                   >
//                     <BarChart3
//                       size={38}
//                       style={{
//                         color: "#cbd5f5",
//                         marginBottom: "8px",
//                       }}
//                       strokeWidth={1.5}
//                     />

//                     <p
//                       style={{
//                         fontSize: "14px",
//                         fontWeight: 600,
//                         color: "#94a3b8",
//                         marginBottom: "4px",
//                       }}
//                     >
//                       No Trend Data
//                     </p>

//                     <p
//                       style={{
//                         fontSize: "12px",
//                         color: "#94a3b8",
//                       }}
//                     >
//                       Tasks need date fields for trends
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </main>

//       <HelpDocModal
//         open={showHelpDoc}
//         onClose={() => setShowHelpDoc(false)}
//         title="Task Management Help"
//         content={TASK_HELP_CONTENT}
//       />

//       {/* Professional Footer */}
//       <footer className="bg-white/90 backdrop-blur-md border-t border-slate-100/50 shadow-lg px-6 py-4 lg:px-8 lg:py-5 sticky bottom-0 z-0">
//         <div className="max-w-7xl mx-auto text-center">
//           <p className="text-sm lg:text-base text-slate-600 font-medium">
//             © {new Date().getFullYear()} CalVant. All rights reserved.
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default TaskManagementDashboard;


import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { useEffectiveOrg } from "@/hooks/useEffectiveOrg";
import taskService from "../services/taskService";
import Joyride, { STATUS } from "react-joyride";
import {
  BarChart3,
  FileText,
  CheckCircle,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  FolderOpen,
  Users,
  Award,
  HelpCircle,
  PieChartIcon,
  RefreshCw,
  BookOpen,
  UserCheck,
  Send,
  Building2,
  Plus,
  Archive,
  Zap,
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
import HelpDocModal from "@/components/shared/HelpDocModal";

// ── Logging ───────────────────────────────────────────────────────────────────
import { captureActivity, ACTIONS, MODULES } from "../../admin/shell/services/activities";

// ── Overdue / Due Soon helpers (derived, not real status values) ──────────────
const DUE_SOON_DAYS = 3;
function isTaskOverdue(t) {
  return !!t.endDate && new Date(t.endDate) < new Date() && t.status !== "Done";
}
function isTaskDueSoon(t) {
  if (!t.endDate || t.status === "Done") return false;
  const diffDays = (new Date(t.endDate) - new Date()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= DUE_SOON_DAYS;
}

const TaskManagementDashboard = () => {
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
  const [run, setRun] = useState(false);

  const [showHelpDoc, setShowHelpDoc] = useState(false);

const TASK_HELP_CONTENT = `
# **calvant** 

Digital Compliance Management 

## **Task Module** 

### **End-User Guide** 

Version 1.0  |  July 2026 

© 2026 CalVant. All rights reserved. 

#### **Table of Contents** 

###### **1. Introduc4on** 

###### **2. Accessing the Task Module** 

2.1 How Task Module Integrates with Calvant 

2.2 Typical workflow 

###### **3. Key Terminology** 

###### **4. Manual Naviga4on** 

4.1 Task Dashboard 

4.2 AcBon Plan 

4.3 CreaBng a Task 

4.4 My Task 

4.5 Task AcBons 

4.6 Viewing Task Details 

###### **5. Status & Quality Reference** 

###### **6. Tips, Best Prac4ces & Troubleshoo4ng** 

#### **1. Introduc4on** 

The Task Module is the centralized task management workspace in CalVant. Tasks created from Risk, Compliance, Policy, Audit, and other modules are managed here, allowing users to assign, monitor, update, and complete acBviBes from a single locaBon. 

#### **2. Accessing the Task Module** 

1. Click the Task icon in the sidebar to land on your Task Dashboard. 

##### **2.1 How Task Module Integrates with Calvant** 

The Task Module serves as the execuBon layer of CalVant. While other modules idenBfy compliance requirements, risks, gaps, policies, audits, and vendor acBviBes, the Task Module enables organizaBons to assign ownership, track progress, and monitor compleBon of the acBons required to achieve compliance. 

Tasks may originate from or support mulBple modules, including: 

1. **Risk Assessment** – Risk treatment and miBgaBon acBviBes. 

2. **Compliance** – Control implementaBon and remediaBon. 

3. **Policy** – Policy draRing, review, approval, and periodic review. 

4. **TPRM** – Vendor assessments, evidence collecBon, and follow-up acBons. 

5. **Audit** – CorrecBve acBons arising from audit findings. 

##### **2.2 Typical workflow:** 

IdenBfy Requirement/Risk → Create Task → Assign Owner → Track Progress → Complete Task → Change Task Status → Receive NoBficaBon 

#### **3. Key Terminologies** 

|**Term**|**Defni4on**|
|---|---|
|Assignee|User responsible for compleBng the task|
|Reporter|User who created the task|



#### **4. Manual Naviga4on** 

##### **4.1 Task Dashboard** 



1. Review status, assignee, reporter and priority. 

2. Track history, remarks and work log. 

3. View subtasks where available. 

#### **5. Status Reference** 

|**Status**|**Meaning**|
|---|---|
|To-Do|Task has not been started|
|In Progress|Work is currently underway|
|Done|Taks has been completed|
|On Hold|Task is temporarily paused|



#### **6. Tips & Best Prac4ces** 

1. Assign every task to the appropriate department and owner. 

2. Use remarks and work logs to record important updates. 

3. Review overdue tasks periodically. 
`;

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  // ── Completed / Due Soon / Overdue / In Progress / My Task / Reported Task / Department Task ──
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    dueSoon: 0,
    overdue: 0,
    inProgress: 0,
    myTask: 0,
    reportedTask: 0,
    departmentTask: 0,
  });
  const [allTasks, setAllTasks] = useState([]);

  // Kept for the header badge / label only — NOT used for task visibility anymore.
  const { isAdmin, userDeptNames, departmentLabel } = useMemo(() => {
    if (!user)
      return { isAdmin: false, userDeptNames: [], departmentLabel: "" };

    const depts = user?.departments || [];
    const names = depts.map((d) => d.name.trim().toLowerCase());

    return {
      isAdmin: isPrivilegedRole,
      userDeptNames: names,
      departmentLabel: isPrivilegedRole
        ? "All"
        : depts.map((d) => d.name).join(", ") ||
        user?.department?.name ||
        "General",
    };
  }, [user, isPrivilegedRole]);

  // NEW: role check for the Department Task card — risk_owner or process_owner only
  // (root alone does NOT qualify unless also holding one of these roles).
  const userRoles = useMemo(
    () => (Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : []),
    [user],
  );
  const canSeeDeptTasks = userRoles.includes("risk_owner") || userRoles.includes("process_owner");

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(() => {
          window.dispatchEvent(new Event("resize"));
        }, 150);
      }
    });

    if (chartsContainerRef.current) {
      resizeObserver.observe(chartsContainerRef.current);
    }

    return () => {
      if (chartsContainerRef.current) {
        resizeObserver.unobserve(chartsContainerRef.current);
      }
      clearTimeout(window.resizeTimeout);
    };
  }, []);

  // ── Visibility rule: root sees the whole org's tasks; everyone else sees
  // tasks where they are the ASSIGNEE **or** the REPORTER. ──
  const loadTaskStats = useCallback(async () => {
    if (!user) return;

    captureActivity({ action: ACTIONS.VISITED, module: MODULES.TASK, url: "/task-management" });

    try {
      const tasks = await taskService.getAllTasks();
      if (!Array.isArray(tasks)) return;

      const orgTasks = tasks.filter(
        (t) => t.organization === effectiveOrgId,
      );

      const isAssignee = (t) => {
        const emp = t.employee;
        return (
          !!emp &&
          (String(emp) === String(user?._id || user?.id) ||
            emp === user?.name ||
            emp === user?.username)
        );
      };
      const isReporterOf = (t) => {
        const rep = t.reporter;
        return (
          !!rep &&
          (rep === user?.name || rep === user?.username || String(rep) === String(user?._id || user?.id))
        );
      };

      const visibleTasks = isRoot
        ? orgTasks
        : orgTasks.filter((t) => isAssignee(t) || isReporterOf(t));

      setAllTasks(visibleTasks);

      const deptNames = (user?.departments || []).map((d) => (d.name || "").trim().toLowerCase());
      const departmentTaskCount = canSeeDeptTasks
        ? orgTasks.filter(
            (t) => t.department && deptNames.includes(String(t.department).trim().toLowerCase()),
          ).length
        : 0;

      setTaskStats({
        total: visibleTasks.length,
        completed: visibleTasks.filter((t) => t.status === "Done").length,
        overdue: visibleTasks.filter(isTaskOverdue).length,
        dueSoon: visibleTasks.filter(isTaskDueSoon).length,
        inProgress: visibleTasks.filter((t) => t.status === "In Progress").length,
        myTask: visibleTasks.filter(isAssignee).length,
        reportedTask: visibleTasks.filter(isReporterOf).length,
        departmentTask: departmentTaskCount,
      });
    } catch (error) {
      console.error("Error loading task stats:", error);
    }
  }, [user, isRoot, effectiveOrgId, canSeeDeptTasks]);

  useEffect(() => {
    loadTaskStats();
  }, [loadTaskStats]);

  useEffect(() => {
    if (mounted && !user) {
      router.push("/");
    }
  }, [mounted, user, router]);

  if (!mounted || !user) return null;

  // Charts Data Processing
  const getMonthFromDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return monthNames[date.getMonth()];
  };

  // ── Pie: Completed / Overdue / Due Soon / Others (rest of the total) ──
  const otherCount = Math.max(
    0,
    taskStats.total - taskStats.completed - taskStats.overdue - taskStats.dueSoon,
  );

  const pieData = [
    {
      name: "Completed",
      value: taskStats.completed,
      color: "#10b981",
      desc: `${taskStats.completed} completed tasks`,
    },
    {
      name: "Overdue",
      value: taskStats.overdue,
      color: "#ef4444",
      desc: `${taskStats.overdue} overdue tasks`,
    },
    {
      name: "Due Soon",
      value: taskStats.dueSoon,
      color: "#f59e0b",
      desc: `${taskStats.dueSoon} due within ${DUE_SOON_DAYS} days`,
    },
    {
      name: "Others",
      value: otherCount,
      color: "#3b82f6",
      desc: `${otherCount} other tasks`,
    },
  ].filter((d) => d.value > 0);

  const realMonthlyData = allTasks.reduce((acc, task) => {
    const month = getMonthFromDate(task.createdAt || task.created_at);
    if (month) acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const barData = [
    { name: "Jan", value: realMonthlyData.Jan || 0 },
    { name: "Feb", value: realMonthlyData.Feb || 0 },
    { name: "Mar", value: realMonthlyData.Mar || 0 },
    { name: "Apr", value: realMonthlyData.Apr || 0 },
    { name: "May", value: realMonthlyData.May || 0 },
    { name: "Jun", value: realMonthlyData.Jun || 0 },
    { name: "Jul", value: realMonthlyData.Jul || 0 },
    { name: "Aug", value: realMonthlyData.Aug || 0 },
    { name: "Sep", value: realMonthlyData.Sep || 0 },
    { name: "Oct", value: realMonthlyData.Oct || 0 },
    { name: "Nov", value: realMonthlyData.Nov || 0 },
    { name: "Dec", value: realMonthlyData.Dec || 0 },
  ];

  // COMPACT Tooltips
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
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
            {((data.value / (taskStats.total || 1)) * 100).toFixed(1)}% of total
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage =
        taskStats.total > 0
          ? ((data.value / taskStats.total) * 100).toFixed(1)
          : 0;

      const monthInfo = {
        Jan: "January", Feb: "February", Mar: "March", Apr: "April",
        May: "May", Jun: "June", Jul: "July", Aug: "August",
        Sep: "September", Oct: "October", Nov: "November", Dec: "December",
      };
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg min-w-[240px] max-h-[200px]">
          <div className="flex items-center gap-2 mb-2 pb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-bold text-sm text-slate-900">
              {data.name}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-2">
            {data.value}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div className="text-slate-600">{monthInfo[data.name]}</div>
            <div className="text-right">
              <span className="font-semibold text-slate-800">
                {percentage}%
              </span>
              <span className="text-slate-500"> of total</span>
            </div>
          </div>
          <div className="text-xs text-slate-600 space-y-0.5 mb-2 bg-slate-50 p-2 rounded">
            <div className="font-medium">How calculated:</div>
            <div className="text-left pl-2">
              •{" "}
              <code className="text-xs bg-blue-100 px-1 rounded">
                createdAt
              </code>{" "}
              in {data.name}
            </div>
            <div className="text-left pl-2">• {departmentLabel} dept only</div>
          </div>
          <div className="text-xs text-slate-400 text-center mt-1 pt-1 border-t border-slate-100">
            🔄 Live database data
          </div>
        </div>
      );
    }
    return null;
  };

  // ── Stat cards: In Progress / Done / Due Soon / Overdue / My Task / Reported Task / (Department Task) ──
  // "Total Tasks" card removed per request — total count still shows in the header text.
  const statsCardsBase = [
    {
      Icon: Zap,
      value: taskStats.inProgress,
      label: "In Progress",
      color: "from-blue-400 to-blue-500",
      filterKey: "inProgress",
    },
    {
      Icon: CheckCircle2,
      value: taskStats.completed,
      label: "Done",
      color: "from-green-400 to-green-500",
      filterKey: "done",
    },
    {
      Icon: Clock,
      value: taskStats.dueSoon,
      label: "Due Soon",
      color: "from-orange-400 to-orange-500",
      filterKey: "dueSoon",
    },
    {
      Icon: AlertTriangle,
      value: taskStats.overdue,
      label: "Overdue",
      color: "from-red-400 to-red-500",
      filterKey: "overdue",
    },
    {
      Icon: UserCheck,
      value: taskStats.myTask,
      label: "My Task",
      color: "from-indigo-400 to-indigo-500",
      filterKey: "myTask",
    },
    {
      Icon: Send,
      value: taskStats.reportedTask,
      label: "Reported Task",
      color: "from-pink-400 to-pink-500",
      filterKey: "reportedTask",
    },
  ];

  // NEW: Department Task card — only rendered for risk_owner / process_owner
  const statsCards = canSeeDeptTasks
    ? [
        ...statsCardsBase,
        {
          Icon: Building2,
          value: taskStats.departmentTask,
          label: "Department Task",
          color: "from-teal-400 to-teal-500",
          filterKey: "departmentTask",
        },
      ]
    : statsCardsBase;

  // CHANGED: "My Tasks" quick action replaced with "Create Task" + "Archive"
  const actionCards = [
    {
      id: "tasks",
      icon: FileText,
      title: "Manage Tasks",
      subtitle: "All Tasks",
      path: "/task-management/tasks",
      color: "from-violet-400 to-violet-500",
    },
    {
      id: "create",
      icon: Plus,
      title: "Create Task",
      subtitle: "New Task",
      path: "/task-management/tasks?openCreate=true",
      color: "from-emerald-400 to-emerald-500",
      primary: true,
    },
    {
      id: "archive",
      icon: Archive,
      title: "Archive",
      subtitle: "Deleted Tasks",
      path: "/task-management/tasks?view=archived",
      color: "from-slate-400 to-slate-500",
    },
  ];

  const steps = [
    {
      target: "#dashboard-header",
      content: `Welcome to your ${departmentLabel} task management dashboard.`,
    },
    {
      target: "#stats-grid",
      content: "Quick metrics overview at a glance.",
    },
    {
      target: "#charts-container",
      content: "Visual task distribution and trends analysis.",
    },
    {
      target: "#action-cards",
      content: "Quick access to all task management tools.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex flex-col overflow-hidden">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2 lg:py-6 pb-20 lg:pb-26 overflow-hidden">
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

        {/* Header */}
        <motion.header
          id="dashboard-header"
          className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl shadow-md mb-2 lg:mb-2 p-4 lg:p-5 !text-left"
          style={{ textAlign: "left", width: "100%", justifyContent: "flex-start", alignItems: "flex-start", justifyItems: "flex-start" }}
          initial={hasMounted ? { opacity: 0, y: -15 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between w-full">

            {/* LEFT SIDE: ICON + TITLE */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>

              <div>
                <h1 className="text-xl font-semibold text-slate-800">
                  Task Dashboard
                </h1>
                <p className="text-sm text-slate-600">
                  {departmentLabel} •{" "}
                  <span className="font-bold text-slate-900">
                    {taskStats.total}
                  </span>{" "}
                  total tasks
                </p>
              </div>
            </div>

            {/* RIGHT SIDE: BUTTONS */}
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isAdmin ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
                {isAdmin ? "Admin" : "User"}
              </span>
              <span className="text-sm font-semibold text-slate-600">
                {user?.name || "User"}
              </span>
              <motion.button
                onClick={() => {
                  captureActivity({ action: ACTIONS.CLICK, module: MODULES.TASK, item: "Refresh Dashboard", url: "/task-management" });
                  loadTaskStats();
                }}
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
                  captureActivity({ action: ACTIONS.CLICK, module: MODULES.TASK, item: "Open Guide", url: "/task-management" });
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-10 h-full">
          {/* Left: Stats + Actions */}
          <div className="space-y-8 lg:space-y-10">
            {/* Stats Grid — now 3 per row */}
            <motion.section
              id="stats-grid"
              className="grid grid-cols-2 md:grid-cols-3 gap-4 items-stretch"
              initial={hasMounted ? { opacity: 0, y: 15 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {statsCards.map(({ Icon, value, label, color, filterKey }, i) => (
                <motion.div
                  key={label}
                  className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center gap-3 h-full min-h-[84px] hover:bg-white"
                  onClick={() => {
                    captureActivity({ action: ACTIONS.CLICK, module: MODULES.TASK, item: `Stat Card - ${label}`, url: "/task-management" });
                    const query = filterKey && filterKey !== "all" ? `?filter=${filterKey}` : "";
                    router.push(`/task-management/tasks${query}`);
                  }}
                  initial={hasMounted ? { opacity: 0, y: 20 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div
                    className={`w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-md flex-shrink-0`}
                  >
                    <Icon
                      size={16}
                      className="lg:size-18 text-white drop-shadow-sm"
                    />
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

            {/* Quick Actions */}
            <motion.section
              id="action-cards"
              className="space-y-1"
              initial={hasMounted ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-lg lg:text-xl font-semibold text-slate-800 mb-6 px-1">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 h-15">
                <AnimatePresence>
                  {actionCards.map(
                    (
                      {
                        id,
                        icon: Icon,
                        title,
                        subtitle,
                        path,
                        color,
                        primary,
                        show = true,
                      },
                      index,
                    ) =>
                      show && (
                        <motion.div
                          key={id}
                          className={`group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-4 h-full flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer ${primary ? "ring-2 ring-emerald-200/50 bg-gradient-to-br " + color : ""}`}
                          initial={hasMounted ? { opacity: 0, scale: 0.9 } : false}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{
                            duration: 0.4,
                            delay: 0.4 + index * 0.06,
                          }}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => {
                            captureActivity({ action: ACTIONS.CLICK, module: MODULES.TASK, item: `Action Card - ${title}`, url: "/task-management" });
                            router.push(path);
                          }}
                        >
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-md flex-shrink-0 ${primary ? "bg-white/20 backdrop-blur-sm" : `bg-gradient-to-br ${color}`}`}
                          >
                            <Icon
                              size={20}
                              className={`${primary ? "text-white" : "text-white"} drop-shadow-sm`}
                            />
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

          {/* Right: Charts */}
          <div
            ref={chartsContainerRef}
            id="charts-container"
            className="space-y-4 lg:space-y-3"
          >
            {/* Pie Chart - Task Distribution */}
            <motion.div
              className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-6 lg:p-7 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-400 h-72 flex flex-col"
              initial={hasMounted ? { opacity: 0, scale: 0.95 } : false}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.01 }}
            >
              <h3 className="text-base lg:text-lg font-semibold text-slate-800 mb-6 px-1">
                Task Distribution
              </h3>
              <div className="flex-1 flex items-center justify-center min-h-0">
                {taskStats.total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={76}
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
                        dominantBaseline="middle"
                        fill="#475569"
                        fontSize={12}
                        fontWeight={600}
                      >
                        Total
                      </text>
                      <text
                        x="50%"
                        y="52%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#111827"
                        fontSize={20}
                        fontWeight={700}
                      >
                        {taskStats.total}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <PieChartIcon
                      size={40}
                      className="text-slate-400 mb-4"
                      strokeWidth={1.5}
                    />
                    <p className="text-lg font-semibold text-slate-500 mb-2">
                      No Data
                    </p>
                    <p className="text-sm text-slate-500 max-w-xs">
                      Start by creating tasks
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Bar Chart - Monthly Task Creation Trends */}
            <motion.div
              style={{
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(8px)",
                border: "1px solid #f1f5f9",
                borderRadius: "16px",
                padding: "24px",
                height: "288px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
                transition: "all 0.4s ease",
              }}
              initial={hasMounted ? { opacity: 0, scale: 0.95 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
            >
              <div style={{ marginBottom: "14px" }}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "4px",
                  }}
                >
                  📈 Monthly Task Creation Trends
                </h3>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: 500,
                  }}
                >
                  Each bar shows NEW tasks created each month
                </p>
              </div>

              <div style={{ flex: 1 }}>
                {barData.some((d) => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      barCategoryGap="25%"
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="#f1f5f9"
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 12,
                          fill: "#6b7280",
                          fontWeight: 500,
                        }}
                      />

                      <Tooltip content={<CustomBarTooltip />} />

                      <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={24}>
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
                              ][index]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      textAlign: "center",
                    }}
                  >
                    <BarChart3
                      size={38}
                      style={{
                        color: "#cbd5f5",
                        marginBottom: "8px",
                      }}
                      strokeWidth={1.5}
                    />

                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#94a3b8",
                        marginBottom: "4px",
                      }}
                    >
                      No Trend Data
                    </p>

                    <p
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                      }}
                    >
                      Tasks need date fields for trends
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <HelpDocModal
        open={showHelpDoc}
        onClose={() => setShowHelpDoc(false)}
        title="Task Management Help"
        content={TASK_HELP_CONTENT}
      />

      {/* Professional Footer */}
      <footer className="bg-white/90 backdrop-blur-md border-t border-slate-100/50 shadow-lg px-6 py-4 lg:px-8 lg:py-5 sticky bottom-0 z-0">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm lg:text-base text-slate-600 font-medium">
            © {new Date().getFullYear()} CalVant. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TaskManagementDashboard;