"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import taskService from "../../taskManagement/services/taskService";
import { CheckCircle, Edit, ArrowLeft, Send, X, AlertTriangle, Clock, Eye, ThumbsUp } from "lucide-react";
import { useEffectiveOrg } from "../../../hooks/useEffectiveOrg";
import { getPlanById, upsertPlan, getDepartmentReview, acceptDepartmentObjectives, proposeDepartmentObjectivesChanges, fetchUsers } from "../services/planService";

// ── helpers ───────────────────────────────────────────────────
function parseObjectives(description) {
  try {
    if (!description) return [];
    if (description.includes("---OBJECTIVES_PAYLOAD---")) {
      const part = description.split("---OBJECTIVES_PAYLOAD---")[1];
      const parsed = JSON.parse(part.trim());
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch { return []; }
}

// Removed old description-building logic because we now rely entirely on departmentObjectivesPayload.

/** Compare two objective arrays and return field-level diffs */
function computeDiff(oldObjs, newObjs) {
  const fields = ["text", "deptMetric", "frequency", "target", "objective", "actionPlans", "proposedForDeletion"];
  const diffs = [];
  const maxLen = Math.max(oldObjs.length, newObjs.length);
  for (let i = 0; i < maxLen; i++) {
    const o = oldObjs[i] || {};
    const n = newObjs[i] || {};
    const changed = fields.filter(f => (o[f] || "") !== (n[f] || ""));
    if (changed.length > 0) diffs.push({ index: i, fields: changed, old: o, new: n });
  }
  return diffs;
}

// ── sub-components ─────────────────────────────────────────────
function DiffBadge({ count }) {
  if (!count) return null;
  return (
    <span style={{
      background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a",
      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
      marginLeft: 8
    }}>
      {count} change{count !== 1 ? "s" : ""}
    </span>
  );
}

function ObjectiveCard({ obj, index, isEditing, onChange, oldObj, showDiff, onToggleDelete, onRestore }) {
  const fields = [
    { key: "text", label: "Objective" },
    { key: "deptMetric", label: "Metric" },
    { key: "frequency", label: "Frequency" },
    { key: "target", label: "Target" },
    { key: "actionPlans", label: "Action Plan" },
  ];

  return (
    <div style={{
      border: "1px solid #e2e8f0", borderRadius: 10, padding: 16,
      marginBottom: 12, background: "#f8fafc",
      transition: "box-shadow 0.2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textDecoration: obj.proposedForDeletion ? "line-through" : "none" }}>
          OBJECTIVE #{index + 1}
          {obj.proposedForDeletion && <span style={{ marginLeft: 8, color: "#ef4444", background: "#fef2f2", padding: "2px 6px", borderRadius: 4 }}>Proposed for Deletion</span>}
        </div>
        {isEditing && (
          <button
            onClick={() => onToggleDelete(index)}
            style={{
              background: "transparent", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              color: obj.proposedForDeletion ? "#64748b" : "#ef4444", display: "flex", alignItems: "center", gap: 4
            }}
          >
            {obj.proposedForDeletion ? "Undo Deletion" : "Propose Deletion"}
          </button>
        )}
        {!isEditing && obj.proposedForDeletion && onRestore && (
          <button
            onClick={() => onRestore(index)}
            style={{
              background: "#eff6ff", border: "1px solid #3b82f6", cursor: "pointer", fontSize: 12, fontWeight: 600,
              color: "#2563eb", padding: "4px 10px", borderRadius: 6
            }}
          >
            Restore
          </button>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, opacity: obj.proposedForDeletion ? 0.6 : 1, pointerEvents: obj.proposedForDeletion ? "none" : "auto" }}>
        {fields.map(({ key, label }) => {
          const hasChanged = showDiff && oldObj && (oldObj[key] || "") !== (obj[key] || "");
          return (
            <div key={key} style={{ gridColumn: key === "text" || key === "actionPlans" ? "1/-1" : "auto" }}>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 700,
                color: hasChanged ? "#92400e" : "#64748b", marginBottom: 4
              }}>
                {label}
                {hasChanged && <span style={{ marginLeft: 6, color: "#f59e0b" }}>● changed</span>}
              </label>
              {isEditing ? (
                <input
                  value={obj[key] || ""}
                  onChange={e => onChange(index, key, e.target.value)}
                  style={{
                    width: "100%", padding: "8px 10px", borderRadius: 6,
                    border: `1.5px solid ${hasChanged ? "#f59e0b" : "#e2e8f0"}`,
                    fontSize: 13, background: hasChanged ? "#fffbeb" : "white",
                    boxSizing: "border-box",
                  }}
                />
              ) : (
                <div>
                  {hasChanged ? (
                    <div>
                      <div style={{
                        fontSize: 12, color: "#ef4444", textDecoration: "line-through",
                        background: "#fef2f2", padding: "4px 8px", borderRadius: 4, marginBottom: 3
                      }}>
                        {oldObj[key] || "—"}
                      </div>
                      <div style={{
                        fontSize: 13, color: "#16a34a", fontWeight: 600,
                        background: "#f0fdf4", padding: "4px 8px", borderRadius: 4
                      }}>
                        {obj[key] || "—"}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#334155" }}>{obj[key] || "—"}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChangeNoteModal({ onConfirm, onCancel, isSubmitting }) {
  const [note, setNote] = useState("");
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div style={{
        background: "white", borderRadius: 14, padding: 28, maxWidth: 440, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: "#e0f2fe",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Edit size={20} color="#0284c7" />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
            Add a Change Note
          </h3>
        </div>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          Please provide a short note explaining the changes or deletion proposal for the reviewer.
        </p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Required: explain what you changed..."
          rows={3}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1.5px solid #e2e8f0", fontSize: 13, resize: "vertical",
            boxSizing: "border-box", outline: "none", fontFamily: "inherit"
          }}
          onFocus={e => e.target.style.borderColor = "#3b82f6"}
          onBlur={e => e.target.style.borderColor = "#e2e8f0"}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onCancel} disabled={isSubmitting}
            style={{ padding: "9px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(note)} disabled={isSubmitting || !note.trim()}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "white", fontWeight: 700, fontSize: 13, cursor: (isSubmitting || !note.trim()) ? "not-allowed" : "pointer", opacity: (isSubmitting || !note.trim()) ? 0.7 : 1 }}>
            {isSubmitting ? "Submitting..." : "Submit Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ onConfirm, onCancel, isSubmitting }) {
  const [comment, setComment] = useState("");
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div style={{
        background: "white", borderRadius: 14, padding: 28, maxWidth: 440, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "fadeUp 0.2s ease"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: "#fef2f2",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <AlertTriangle size={20} color="#ef4444" />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
            Reject & Return Task
          </h3>
        </div>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
          The task will be sent back to the assignee for revision. Add an optional comment explaining what needs to change.
        </p>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Optional: explain what needs to be revised..."
          rows={3}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1.5px solid #e2e8f0", fontSize: 13, resize: "vertical",
            boxSizing: "border-box", outline: "none", fontFamily: "inherit"
          }}
          onFocus={e => e.target.style.borderColor = "#3b82f6"}
          onBlur={e => e.target.style.borderColor = "#e2e8f0"}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onCancel} disabled={isSubmitting}
            style={{ padding: "9px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(comment)} disabled={isSubmitting}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "white", fontWeight: 700, fontSize: 13, cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? "Sending..." : "Reject & Return"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
const PlanReviewView = ({ taskId, isReporterView: propIsReporterView = false, onClose }) => {
  const router = useRouter();
  const { user } = useEffectiveOrg();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [objectives, setObjectives] = useState([]);
  const [originalObjectives, setOriginalObjectives] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showChangeNoteModal, setShowChangeNoteModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [changeLogEntries, setChangeLogEntries] = useState([]);
  const [taskLogs, setTaskLogs] = useState([]);
  const [negotiationHistory, setNegotiationHistory] = useState([]);
  const [latestChangeNote, setLatestChangeNote] = useState("");
  const [reviewInfo, setReviewInfo] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const isReporterView = propIsReporterView || !!(task && user && (task.reporterId === user._id || task.reporterId === user.id || task.reporter === user.name));

  const getUserName = (userId) => {
    if (!userId) return "Unassigned";
    const userObj = allUsers.find(u => (u.id || u._id) === String(userId));
    if (!userObj) return userId;
    return userObj.name || `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || userObj.email || userId;
  };

  const handleClose = () => {
    if (onClose) onClose();
    else router.back();
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!taskId) return;
    const fetch_ = async () => {
      try {
        const t = await taskService.getTaskById(taskId);

        let planId = t.sourceId; // The new architecture uses sourceId for planId
        if (!planId) planId = t.planId; // fallback
        t.planId = planId; // save to task object for easier access
        setTask(t);

        if (planId && t.department) {
          try {
            const reviewData = await getDepartmentReview(planId, t.department);
            // The backend sends objectives and optionally originalObjectives
            setObjectives(reviewData.objectives || reviewData.deptObjectives || []);
            setOriginalObjectives(reviewData.originalObjectives || reviewData.objectives || reviewData.deptObjectives || []);
            if (reviewData.changeNote) {
              setLatestChangeNote(reviewData.changeNote);
            }
            if (reviewData.history) {
              setNegotiationHistory(reviewData.history);
            }
            setReviewInfo(reviewData.review || null);
            setIsApproved(!!reviewData.approved);
          } catch (e) {
            console.error("Failed to load department review data:", e);
            setObjectives([]);
            setOriginalObjectives([]);
            setLatestChangeNote("");
            setNegotiationHistory([]);
            setReviewInfo(null);
            setIsApproved(false);
          }
        }

        try {
          const logs = await taskService.getTaskLogs(taskId);
          setTaskLogs(Array.isArray(logs) ? logs : []);
        } catch { setTaskLogs([]); }

      } catch (e) {
        console.error("Failed to load task:", e);
      } finally {
        setLoading(false);
      }
    };
    fetch_();

    const loadUsers = async () => {
      try {
        const users = await fetchUsers();
        setAllUsers(users || []);
      } catch (e) {
        console.error("Failed to fetch users for Review View", e);
      }
    };
    loadUsers();
  }, [taskId]);

  const handleObjectiveChange = (index, field, value) => {
    const updated = [...objectives];
    updated[index] = { ...updated[index], [field]: value };
    setObjectives(updated);
  };

  const handleToggleDelete = (index) => {
    const updated = [...objectives];
    updated[index] = { ...updated[index], proposedForDeletion: !updated[index].proposedForDeletion };
    setObjectives(updated);
  };

  const requestRestore = (index) => {
    // When restoring, we effectively edit it to remove the proposedForDeletion flag
    // But since restoring counts as a proposed change, we'll stage it for submit.
    const updated = [...objectives];
    updated[index] = { ...updated[index], proposedForDeletion: false };
    setObjectives(updated);
    setIsEditing(true); // switch to edit mode so they can submit the restore
  };

  // Assignee accepts objectives as-is (no edits needed)
  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      const actedByUserId = user?._id || user?.id || "";
      const actedByName = user?.name || "System";
      await acceptDepartmentObjectives(task.planId, task.department, actedByUserId, actedByName);
      setIsApproved(true);
      setIsEditing(false);
      showToast("Objectives accepted! Reporter has been notified. ✓");
      setTask({ ...task, status: "Done", remarks: "Approved" });
      setTimeout(() => handleClose(), 1500);
    } catch (e) {
      console.error(e);
      showToast("Failed to accept objectives.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestSubmitChanges = () => {
    setShowChangeNoteModal(true);
  };

  // Assignee or Reporter submits their edits
  const handleSubmitChanges = async (changeNote) => {
    setIsSubmitting(true);
    try {
      const actedByUserId = user?._id || user?.id || "";
      const actedByName = user?.name || "System";
      await proposeDepartmentObjectivesChanges(task.planId, task.department, actedByUserId, actedByName, objectives, changeNote);
      showToast("Changes submitted for review!");
      setTask({ ...task, remarks: "Proposed Plan" });
      setTimeout(() => handleClose(), 1500);
    } catch (e) {
      console.error(e);
      showToast(e.response?.data?.message || "Failed to submit changes.", "error");
    } finally {
      setIsSubmitting(false);
      setShowChangeNoteModal(false);
      setIsEditing(false);
    }
  };

  // Reporter accepts — marks task Done
  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const actedByUserId = user?._id || user?.id || "";
      const actedByName = user?.name || "System";
      await acceptDepartmentObjectives(task.planId, task.department, actedByUserId, actedByName);
      setIsApproved(true);
      setIsEditing(false);
      showToast("Plan approved successfully! ✓");
      setTask({ ...task, status: "Done", remarks: "Approved" });
      setTimeout(() => handleClose(), 1500);
    } catch (e) {
      console.error(e);
      showToast("Failed to approve.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reporter rejects — creates return task
  const handleReject = async (comment) => {
    setIsSubmitting(true);
    try {
      await taskService.rejectTask(taskId, comment);
      setShowRejectModal(false);
      showToast("Task returned to assignee for revision.");
      setTimeout(() => handleClose(), 1500);
    } catch (e) {
      console.error(e);
      // Fallback: repropose via existing logic
      try {
        const newTask = {
          organization: task.organization,
          department: task.department,
          employeeId: task.reporterId || null,
          employee: task.reporter,
          reporter: user?.name || "System",
          reporterId: user?._id || user?.id,
          source: "Plan",
          planId: task.planId,
          type: "Module Based",
          subType: "Plan",
          status: "Pending",
          priority: "Medium",
          description: `[REVISION REQUIRED] ${comment || "Please revise the objectives."}`,
        };
        await taskService.updateTask(taskId, { status: "Done", remarks: "Rejected" });
        await taskService.saveTask(newTask, user?.name || "System");
        setShowRejectModal(false);
        showToast("Task returned to assignee.");
        setTimeout(() => handleClose(), 1500);
      } catch { showToast("Failed to reject.", "error"); }
    } finally {
      setIsSubmitting(false);
    }
  };

  const diffs = computeDiff(originalObjectives, objectives);
  const hasDiffs = diffs.length > 0;

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
      Loading task details...
    </div>
  );

  if (!task) return (
    <div style={{ padding: 60, textAlign: "center", color: "#ef4444" }}>
      Task not found.
    </div>
  );

  const REVIEW_STATUS_LABELS = {
    PENDING_REVIEW: "Pending",
    CHANGES_PROPOSED: "Proposed Plan",
    ACCEPTED: "Approved",
  };
  const reviewStatus = isApproved
    ? "Approved"
    : (reviewInfo?.reviewStatus && REVIEW_STATUS_LABELS[reviewInfo.reviewStatus]) || task.remarks || "Pending";
  const statusColors = {
    "Pending": { bg: "#f1f5f9", color: "#475569" },
    "Proposed Plan": { bg: "#fef3c7", color: "#92400e" },
    "Approved": { bg: "#dcfce7", color: "#166534" },
    "Rejected": { bg: "#fee2e2", color: "#991b1b" },
  };
  const sc = statusColors[reviewStatus] || statusColors["Pending"];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 10000,
          background: toast.type === "error" ? "#ef4444" : "#10b981",
          color: "white", padding: "12px 20px", borderRadius: 10,
          fontWeight: 600, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          animation: "fadeUp 0.2s ease"
        }}>
          {toast.msg}
        </div>
      )}

      {/* Change Note Modal */}
      {showChangeNoteModal && (
        <ChangeNoteModal
          onConfirm={handleSubmitChanges}
          onCancel={() => setShowChangeNoteModal(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          onConfirm={handleReject}
          onCancel={() => setShowRejectModal(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Back Button */}
      <button
        onClick={handleClose}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#fff", border: "1.5px solid #e2e8f0",
          borderRadius: 8, cursor: "pointer",
          color: "#475569", fontSize: 13, fontWeight: 700,
          padding: "7px 16px", marginBottom: 20,
          transition: "background 0.15s, border-color 0.15s, color 0.15s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
        onMouseOver={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.color = "#0f172a"; }}
        onMouseOut={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
      >
        <ArrowLeft size={15} /> Back to Manage Tasks
      </button>

      {/* Header Card */}
      <div style={{
        background: "white", borderRadius: 14, padding: "20px 24px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.07)", marginBottom: 20,
        borderLeft: "4px solid #3b82f6"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b" }}>
              Review Department Objectives
              {hasDiffs && <DiffBadge count={diffs.length} />}
            </h2>
            <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
              <strong>Department:</strong> {task.department} &nbsp;·&nbsp;
              <strong>Assigned by:</strong> {getUserName(task.reporterId || task.reporter)} &nbsp;·&nbsp;
              <strong>Assignee:</strong> {getUserName(task.employeeId || task.employee)}
            </p>
          </div>
          <span style={{
            padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: sc.bg, color: sc.color, whiteSpace: "nowrap"
          }}>
            {reviewStatus}
          </span>
        </div>

        {/* Latest Change Note prominently displayed */}
        {latestChangeNote && (
          <div style={{ marginTop: 24, padding: "16px 20px", background: "#f0fdfa", borderRadius: 12, border: "1px solid #ccfbf1", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ padding: 8, background: "#ccfbf1", borderRadius: "50%", color: "#0f766e" }}>
              <Edit size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 6px 0", fontSize: 14, fontWeight: 700, color: "#0f766e" }}>Latest Note from Reviewer</h4>
              <p style={{ margin: 0, fontSize: 13, color: "#115e59", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {latestChangeNote}
              </p>
            </div>
          </div>
        )}

        {/* Change Log summary / Activity History */}
        {(taskLogs.length > 0 || negotiationHistory.length > 0) && (
          <div style={{ marginTop: 24, padding: "20px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={16} /> Activity History
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {negotiationHistory.map((entry, i) => (
                <div key={`hist-${i}`} style={{ display: "flex", gap: 12, fontSize: 13, color: "#475569" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", marginTop: 6, flexShrink: 0 }}></div>
                  <div>
                    <strong>{entry.actorName || "System"}</strong> {entry.action === "ACCEPTED" ? "accepted the objectives" : "proposed changes to the objectives"}
                    <div style={{ marginTop: 4, background: "white", padding: "8px 12px", borderRadius: 6, border: "1px solid #e2e8f0", color: "#334155" }}>
                      <em>Note:</em> {entry.note}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              {taskLogs.map((log, i) => (
                <div key={`log-${i}`} style={{ display: "flex", gap: 12, fontSize: 13, color: "#475569" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#cbd5e1", marginTop: 6, flexShrink: 0 }}></div>
                  <div>
                    <strong>{log.changedByUserName || log.changedBy}</strong> updated <strong>{log.changeType}</strong>
                    {log.changeType === "REVIEW_STATUS" && (
                      <span> from <span style={{ textDecoration: "line-through" }}>{log.oldValue}</span> to <strong style={{ color: log.newValue === "Approved" ? "#166534" : log.newValue === "Rejected" ? "#991b1b" : "#92400e" }}>{log.newValue}</strong></span>
                    )}
                    {log.changeType === "DESCRIPTION" && (
                      <span> (proposed new objectives)</span>
                    )}
                    {log.changeType === "CREATED" && (
                      <span> - {log.newValue}</span>
                    )}
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      {new Date(log.changedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Objectives */}
      <div style={{ background: "white", borderRadius: 14, padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.07)", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
            Current / Reproposed Objectives
          </h3>
          {/* // AFTER — single source of truth: plan-service's isApproved, not task-service's status */}
          {!isEditing && !isApproved && !(isReporterView && reviewStatus === "Pending") && !(!isReporterView && reviewStatus === "Proposed Plan") && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8,
                border: "1.5px solid #e2e8f0", background: "white",
                color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer"
              }}
            >
              <Edit size={14} /> Edit
            </button>
          )}
        </div>

        {objectives.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", border: "1px dashed #cbd5e1", borderRadius: 8 }}>
            No objectives found.
          </div>
        ) : (
          objectives.map((obj, i) => {
            const oldObj = originalObjectives.find(o => o.id === obj.id) || originalObjectives[i];
            return (
              <ObjectiveCard
                key={obj.id || i}
                obj={obj}
                index={i}
                isEditing={isEditing}
                onChange={handleObjectiveChange}
                onToggleDelete={handleToggleDelete}
                onRestore={requestRestore}
                oldObj={oldObj}
                showDiff={hasDiffs}
              />
            );
          })
        )}
      </div>

      {/* Original Assigned Objectives (if diff exists) */}
      {hasDiffs && !isEditing && (
        <div style={{ background: "#f8fafc", borderRadius: 14, padding: 24, border: "1px solid #e2e8f0", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#64748b", marginBottom: 16 }}>
            First Assigned Task (Original Objectives)
          </h3>
          {originalObjectives.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", border: "1px dashed #cbd5e1", borderRadius: 8 }}>
              No original objectives found.
            </div>
          ) : (
            originalObjectives.map((obj, i) => (
              <div key={i} style={{ opacity: 0.75 }}>
                <ObjectiveCard
                  obj={obj}
                  index={i}
                  isEditing={false}
                  onChange={() => { }}
                  showDiff={false}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
        {/* ── APPROVED STATE ── show banner, no further actions */}
        {(isApproved || task?.status === "Done" || task?.status === "Completed") ? (
          isReporterView ? (
            <div style={{
              padding: "12px 22px", background: "#dcfce7", color: "#166534",
              borderRadius: 10, fontWeight: 700, fontSize: 14,
              display: "flex", alignItems: "center", gap: 8,
              border: "1.5px solid #bbf7d0"
            }}>
              ✓ Approved by {getUserName(task?.employeeId || task?.employee) || "the Assignee"}
            </div>
          ) : (
            <div style={{
              padding: "12px 22px", background: "#dcfce7", color: "#166534",
              borderRadius: 10, fontWeight: 700, fontSize: 14,
              display: "flex", alignItems: "center", gap: 8,
              border: "1.5px solid #bbf7d0"
            }}>
              ✓ You approved this plan — no further edits allowed
            </div>
          )
        ) : isEditing ? (
          <>
            <button
              onClick={() => {
                // Re-fetch or reset to the pre-edit state
                setObjectives([...objectives]);
                setIsEditing(false);
              }}
              disabled={isSubmitting}
              style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              <X size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />Cancel
            </button>
            <button
              onClick={requestSubmitChanges}
              disabled={isSubmitting || !hasDiffs}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "white", fontWeight: 700, fontSize: 14, cursor: (isSubmitting || !hasDiffs) ? "not-allowed" : "pointer", opacity: (isSubmitting || !hasDiffs) ? 0.7 : 1 }}>
              <Send size={14} />
              {isSubmitting ? "Submitting..." : "Propose Changes"}
            </button>
          </>
        ) : (
          <>
            {/* REPORTER (Sender) — Always waiting for the assignee to act */}
            {isReporterView && (
              <div style={{ padding: "10px 20px", background: "#eff6ff", color: "#1d4ed8", borderRadius: 10, fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                ⏳ Waiting for {getUserName(task?.employeeId || task?.employee) || "the Assignee"} to review the changes
              </div>
            )}

            {/* ASSIGNEE (Receiver) — Always has the action buttons */}
            {!isReporterView && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={isSubmitting}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 10, border: "1.5px solid #3b82f6", background: "#eff6ff", color: "#2563eb", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  <Edit size={14} /> Edit and Propose Changes
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isSubmitting}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#10b981,#059669)", color: "white", fontWeight: 700, fontSize: 14, cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1 }}>
                  <ThumbsUp size={14} />
                  {isSubmitting ? "Accepting..." : "Accept Objectives"}
                </button>
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

export default PlanReviewView;
