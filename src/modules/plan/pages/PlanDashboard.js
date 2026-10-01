"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  BarChart3,
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffectiveOrg } from "../../../hooks/useEffectiveOrg";
import { getActivePlans, fetchUsers, deletePlan } from "../services/planService";
import PlanReadOnlyView from "../components/PlanReadOnlyView";
import PlanReviewView from "../components/PlanReviewView";
import taskService from "../../taskManagement/services/taskService";

/**
 * PlanDashboard — Plan landing/dashboard UI.
 * Extracted from the "dashboard" branch of the original Plan.js.
 * "Create Plan" and "Resume/Edit" now navigate to CreatePlan.js instead
 * of switching an internal `view` state, since the wizard is now a
 * separate page/route (plan/pages/CreatePlan.js).
 */
const PlanDashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, isPrivilegedRole } = useEffectiveOrg();
  const isAdmin = isPrivilegedRole;

  const viewParam = searchParams.get("view");
  const taskIdParam = searchParams.get("taskId");

  const [activePlans, setActivePlans] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const getUserName = (userId) => {
    if (!userId) return "Unassigned";
    const uObj = allUsers.find(u => (u.id || u._id) === String(userId));
    if (!uObj) return userId;
    return uObj.name || `${uObj.firstName || ''} ${uObj.lastName || ''}`.trim() || uObj.email || userId;
  };

  const [selectedPlanForView, setSelectedPlanForView] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [approvedTasks, setApprovedTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [reviewTask, setReviewTask] = useState(null); // open reporter review modal
  const [showManageTasks, setShowManageTasks] = useState(false); // open manage tasks modal

  useEffect(() => {
    setMounted(true);
    const fetchPlans = async () => {
      setLoading(true);
      const orgId = user?.organization?._id || user?.organization || "";
      const plans = await getActivePlans(orgId);
      setActivePlans(plans);
      try {
        const users = await fetchUsers();
        setAllUsers(users);
      } catch (e) { /* ignore */ }
      // Fetch pending review tasks for this reporter
      try {
        const userId = user?._id || user?.id || "";
        if (userId) {
          const pending = await taskService.getPendingReviewTasks(userId);
          setPendingReviews(Array.isArray(pending) ? pending : []);
        }
      } catch (e) {
        // Endpoint not yet live — graceful fallback: try filtering all tasks locally
        try {
          const allTasks = await taskService.getAllTasks();
          const userId = user?._id || user?.id;
          const userName = user?.name;

          // Action required by me (I am the Assignee and task is NOT done)
          const filteredPending = allTasks.filter(t =>
            t.source === "Plan" &&
            t.status !== "Done" && t.status !== "Completed" &&
            (t.employeeId === userId || t.employee === userName)
          );
          setPendingReviews(filteredPending);

          // Tasks I am waiting on (I am the Reporter, NOT the Assignee, and task is NOT done)
          const filteredAssigned = allTasks.filter(t =>
            t.source === "Plan" &&
            t.status !== "Done" && t.status !== "Completed" &&
            (t.reporterId === userId || t.reporter === userName) &&
            t.employeeId !== userId && t.employee !== userName
          );
          setAssignedTasks(filteredAssigned);

          // Completed tasks I was involved in
          const filteredApproved = allTasks.filter(t =>
            t.source === "Plan" &&
            (t.status === "Done" || t.status === "Completed") &&
            (t.reporterId === userId || t.employeeId === userId || t.reporter === userName || t.employee === userName)
          );
          setApprovedTasks(filteredApproved);
        } catch { /* ignore */ }
      }
      setLoading(false);
    };
    if (viewParam !== "review") {
      fetchPlans();
    } else {
      setLoading(false);
    }
  }, [user, viewParam]);

  // Keep the dashboard's saved-plans list fresh if the user returns from
  // the wizard (e.g. browser back/forward) without a full reload.
  useEffect(() => {
    const fetchPlans = async () => {
      const orgId = user?.organization?._id || user?.organization || "";
      const plans = await getActivePlans(orgId);
      setActivePlans(plans);
    };
    const handleFocus = () => fetchPlans();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && viewParam !== "review") fetchPlans();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, viewParam]);

  if (!mounted) return null;

  if (viewParam === "review" && taskIdParam) {
    return <PlanReviewView taskId={taskIdParam} />;
  }

  const handleCreatePlan = () => {
    router.push("/plan/create");
  };

  const handleEditPlan = (plan) => {
    const targetId = plan.id || plan._id;
    router.push(`/plan/create?id=${targetId}`);
  };

  const handleConfirmDeletePlan = async () => {
    if (!planToDelete) return;
    const targetId = planToDelete.id || planToDelete._id;
    setIsDeleting(true);
    try {
      await deletePlan(targetId);
      const orgId = user?.organization?._id || user?.organization || "";
      const updatedPlans = await getActivePlans(orgId);
      setActivePlans(updatedPlans);

      if (selectedPlanForView && (selectedPlanForView.id || selectedPlanForView._id) === targetId) {
        setSelectedPlanForView(null);
      }
    } catch (err) {
      console.error("Failed to delete plan:", err);
    } finally {
      setIsDeleting(false);
      setPlanToDelete(null);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Loader2 size={44} className="animate-spin text-blue-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Loading Plan Dashboard...</h2>
        <p className="text-sm text-slate-500 mt-1">Fetching active plans and organizational details.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex flex-col overflow-hidden">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2 lg:py-6 pb-20 lg:pb-26 overflow-hidden">

        {/* Header - Matches Task Dashboard */}
        <motion.header
          className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl shadow-md mb-6 p-4 lg:p-5 flex items-center justify-between w-full"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">Plan Dashboard</h1>
              <p className="text-sm text-slate-600">Overview of active plans and objectives</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isAdmin ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
              {isAdmin ? "Admin" : "User"}
            </span>
            <span className="text-sm font-semibold text-slate-600">
              {user?.name || "User"}
            </span>
          </div>
        </motion.header>

        {/* Reporter Review Modal */}
        {reviewTask && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 md:p-8">
            <div className="w-full max-w-4xl my-6 bg-white rounded-2xl shadow-2xl relative">
              <button
                onClick={() => setReviewTask(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
              >
                ✕
              </button>
              <PlanReviewView taskId={reviewTask.taskId} isReporterView={
                reviewTask && user &&
                (reviewTask.reporterId === user._id || reviewTask.reporterId === user.id || reviewTask.reporter === user.name)
              } onClose={() => setReviewTask(null)} />
            </div>
          </div>
        )}

        {/* Dashboard View */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-10 h-full">
          <div className="space-y-8 lg:space-y-10">
            {/* Stat Cards */}
            <motion.section
              className="grid grid-cols-2 md:grid-cols-3 gap-4 items-stretch"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {[
                { Icon: FileText, value: activePlans.length, label: "Total Plans", color: "from-indigo-400 to-indigo-500" },
                { Icon: Clock, value: activePlans.filter(p => p.status === "Draft").length, label: "Draft Plans", color: "from-orange-400 to-orange-500" },
                { Icon: CheckCircle2, value: activePlans.filter(p => p.status === "Completed").length, label: "Completed Plans", color: "from-emerald-400 to-emerald-500" },
                { Icon: AlertTriangle, value: 0, label: "Overdue Metrics", color: "from-red-400 to-red-500" },
              ].map(({ Icon, value, label, color }) => (
                <div key={label} className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-3 h-full min-h-[72px]">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-sm flex-shrink-0`}>
                    <Icon size={16} className="text-white drop-shadow-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-base lg:text-lg font-bold text-slate-800 block mb-0.5">{value}</span>
                    <span className="text-[10px] lg:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{label}</span>
                  </div>
                </div>
              ))}
            </motion.section>

            {/* Pending & Approved Objectives moved to Manage Tasks Modal */}

            {/* Quick Actions */}
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="text-lg lg:text-xl font-semibold text-slate-800 mb-6 px-1">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div
                  onClick={handleCreatePlan}
                  className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer ring-2 ring-emerald-200/50 bg-gradient-to-br from-emerald-400 to-emerald-500"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-md flex-shrink-0 bg-white/20 backdrop-blur-sm">
                    <Plus size={20} className="text-white drop-shadow-sm" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-sm lg:text-base font-semibold text-center text-white leading-tight mb-1">Create New Plan</h4>
                    <p className="text-xs font-bold text-center text-emerald-50">Start 5-step wizard</p>
                  </div>
                </div>

                {/* Commenting out Manage Plans as requested: */}
                {/* <div
                  onClick={() => {
                    if (activePlans.length > 0) setSelectedPlanForView(activePlans[0]);
                  }}
                  className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-gradient-to-br from-violet-400 to-violet-500"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-md flex-shrink-0 bg-white/20 backdrop-blur-sm">
                    <FileText size={20} className="text-white drop-shadow-sm" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-sm lg:text-base font-semibold text-center text-white leading-tight mb-1">Manage Plans</h4>
                    <p className="text-xs font-bold text-center text-violet-50">View all records</p>
                  </div>
                </div> */}


                {/* Manage Tasks Quick Action */}
                {/* <div
                  onClick={() => setShowManageTasks(true)}
                  className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-gradient-to-br from-violet-400 to-violet-500"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-md flex-shrink-0 bg-white/20 backdrop-blur-sm">
                    <Clock size={20} className="text-white drop-shadow-sm" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-sm lg:text-base font-semibold text-center text-white leading-tight mb-1">Manage Tasks</h4>
                    <p className="text-xs font-bold text-center text-violet-50">Review objectives</p>
                  </div>
                </div> */}
              </div>
            </motion.section>
          </div>

          <div className="flex flex-col bg-white/50 backdrop-blur-sm border border-slate-100/50 rounded-2xl shadow-sm min-h-[400px] p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-4">Saved Plans</h3>
            {activePlans.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium">No plans created yet.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {activePlans.map(plan => {
                  const targetId = plan.id || plan._id;
                  const dateStr = plan.createdAt ? (plan.createdAt.includes("T") ? new Date(plan.createdAt).toLocaleDateString() : plan.createdAt) : "Recently";
                  return (
                    <div key={targetId} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800 text-lg">{(plan.frameworks || []).join(" + ")}</h4>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${plan.domain === 'Security' ? 'bg-blue-100 text-blue-700' :
                          plan.domain === 'AI' ? 'bg-purple-100 text-purple-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                          {plan.domain}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-slate-500 mt-4">
                        <span className="flex items-center gap-1.5">
                          {plan.status === "Draft" ? (
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                          ) : (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          )}
                          <span className={plan.status === "Draft" ? "text-amber-700 font-medium" : ""}>{plan.status}</span>
                        </span>
                        <div className="flex items-center gap-3">
                          <span>{dateStr}</span>
                          {/* <button
                            onClick={() => setSelectedPlanForView(plan)}
                            className="text-violet-600 hover:text-violet-700 font-medium text-xs bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-md transition-all"
                          >
                            View Plan
                          </button> */}
                          <button
                            onClick={() => handleEditPlan(plan)}
                            className="text-blue-600 hover:text-blue-700 font-medium text-xs flex items-center gap-1"
                          >
                            {plan.status === "Draft" ? "Resume" : "View"} <ArrowRight size={14} />
                          </button>
                          <button
                            onClick={() => setPlanToDelete(plan)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-md transition-all font-medium text-xs flex items-center gap-1"
                            title="Delete Plan"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal / Overlay for Complete 3-Part Plan Viewer */}
        {selectedPlanForView && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 md:p-8">
            <div className="w-full max-w-5xl my-6 relative">
              {/* Plan Selector if multiple plans exist */}
              {activePlans.length > 1 && (
                <div className="bg-slate-900 text-white px-6 py-3 rounded-t-2xl flex items-center justify-between gap-4 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <span>Switch Plan:</span>
                    <select
                      value={selectedPlanForView.id || selectedPlanForView._id}
                      onChange={(e) => {
                        const found = activePlans.find(p => (p.id || p._id) === e.target.value);
                        if (found) setSelectedPlanForView(found);
                      }}
                      className="bg-slate-800 text-white text-xs border border-slate-700 rounded px-2 py-1 font-medium focus:outline-none"
                    >
                      {activePlans.map(p => (
                        <option key={p.id || p._id} value={p.id || p._id}>
                          {(p.frameworks || []).join(" + ")} ({p.domain}) [{p.status}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <PlanReadOnlyView
                plan={selectedPlanForView}
                allUsers={allUsers}
                onClose={() => setSelectedPlanForView(null)}
              />
            </div>
          </div>
        )}

        {/* Modal / Overlay for Task Review */}
        {reviewTask && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 md:p-8">
            <div className="w-full max-w-5xl my-6 relative">
              <PlanReviewView
                taskId={reviewTask.taskId}
                isReporterView={
                  reviewTask && user &&
                  (reviewTask.reporterId === user._id || reviewTask.reporterId === user.id || reviewTask.reporter === user.name)
                }
                onClose={() => {
                  setReviewTask(null);
                  setShowManageTasks(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Manage Tasks Modal */}
        {showManageTasks && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 md:p-8">
            <div className="w-full max-w-5xl my-6 bg-slate-50 rounded-2xl shadow-2xl relative flex flex-col min-h-[600px]">
              {/* Header */}
              <div className="bg-white px-6 py-5 rounded-t-2xl border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 leading-tight">Manage Tasks</h2>
                    <p className="text-sm text-slate-500">Review pending and approved department objectives</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManageTasks(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content - Clean List View */}
              <div className="p-0 flex-1 overflow-y-auto">
                {pendingReviews.length === 0 && approvedTasks.length === 0 && assignedTasks.length === 0 ? (
                  <div className="text-center py-16">
                    <CheckCircle2 size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-600">No tasks to manage</h3>
                    <p className="text-slate-400 mt-1">You have no pending or approved objectives at this time.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                        <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned / Edited By</th>
                        <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">History / Message</th>
                        <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {/* Pending Reviews */}
                      {pendingReviews.map(task => (
                        <tr key={task.taskId} className="hover:bg-amber-50/30 transition-colors group">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-800">{task.department}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {task.taskId}</div>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600 font-medium">{getUserName(task.employeeId || task.employee)}</td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Edited & Submitted
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-500 max-w-xs truncate" title={task.description}>
                            Objectives have been edited or sent for approval.
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => { setShowManageTasks(false); setReviewTask(task); }}
                              className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm"
                            >
                              Review Edits
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* Assigned Tasks */}
                      {assignedTasks.map(task => (
                        <tr key={task.taskId} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-800">{task.department}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {task.taskId}</div>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600 font-medium">{getUserName(task.employeeId || task.employee)}</td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                              <Clock size={12} /> Awaiting Response
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-500 max-w-xs truncate" title={task.description}>
                            Task assigned, waiting for reporter to review.
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => { setShowManageTasks(false); setReviewTask(task); }}
                              className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* Approved Tasks */}
                      {approvedTasks.map(task => (
                        <tr key={task.taskId} className="hover:bg-emerald-50/30 transition-colors group">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-800">{task.department}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {task.taskId}</div>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600 font-medium">{getUserName(task.employeeId || task.employee)}</td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 size={12} /> Approved
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-500 max-w-xs truncate" title={task.description}>
                            Objectives finalized and approved by both.
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => { setShowManageTasks(false); setReviewTask(task); }}
                              className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Popup Modal */}
        {planToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Plan Confirmation</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Are you sure you want to delete the <strong className="text-slate-900 font-semibold">{planToDelete.domain || "Selected"}</strong> plan for framework(s):{" "}
                <span className="text-blue-600 font-semibold">{(planToDelete.frameworks || []).join(" + ") || planToDelete.domain || "Selected Frameworks"}</span>?
                <br />
                <span className="text-xs text-red-500 mt-2 block font-medium">This will permanently remove the plan for this segregation.</span>
              </p>
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() => setPlanToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeletePlan}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-red-200 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Yes, Delete Plan</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PlanDashboard;
