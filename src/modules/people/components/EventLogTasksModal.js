"use client";
import React, { useEffect, useState } from "react";
import { RefreshCw, Plus, CheckCircle2 } from "lucide-react";
import { getTicketTasks, addTicketTask } from "../services/peopleApi";
import ModalShell, { Section, Field, ModalError, inputClass } from "./ModalShell";
import StatusBadge from "./StatusBadge";
import { formatDate, formatDateTime } from "../utils/peopleFormat";
import { statusKey, useAssignableUsers, assigneeFields } from "./ticketShared";

const EMPTY = { description: "", assigneeUserId: "", dueDate: "", priority: "Medium" };

/**
 * One Event Log entry: its details, its tasks (live from the task board), and — for people who can
 * edit — a form to add a task and assign it. The log completes by itself when every task is
 * completed (backend), so this screen only has to show progress and add tasks.
 */
export default function EventLogTasksModal({ ticket: initial, persons, canEdit, onClose, onChanged }) {
  const [ticket, setTicket] = useState(initial);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const apply = (view) => {
    setTicket(view.ticket);
    setTasks(view.tasks || []);
    onChanged?.(view.ticket);
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      apply(await getTicketTasks(initial.id));
    } catch (err) {
      setError(err.message || "Couldn't load the tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const add = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) return setError("Describe the task.");
    if (!form.assigneeUserId) return setError("Choose who to assign it to.");
    setSaving(true);
    setError("");
    try {
      apply(
        await addTicketTask(ticket.id, {
          description: form.description.trim(),
          ...assigneeFields(assignable.find((u) => u.id === form.assigneeUserId) || { id: form.assigneeUserId }),
          dueDate: form.dueDate || null,
          priority: form.priority,
        }),
      );
      setForm(EMPTY);
    } catch (err) {
      setError(err.message || "Couldn't add the task.");
    } finally {
      setSaving(false);
    }
  };

  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const person = persons.find((p) => p.id === ticket.personId);

  // Users of this organisation (from user-service) — the same people the task board assigns to.
  const { users: assignable, loading: usersLoading, error: usersError } = useAssignableUsers();

  return (
    <ModalShell
      title="Event log"
      subtitle={ticket.ticketRefId || undefined}
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
          Close
        </button>
      }
    >
      <Section title="Event">
        <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{ticket.summary}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">Status <StatusBadge value={ticket.status} /></span>
          <span>Related person: {person?.name || "—"}</span>
          <span>Logged {formatDateTime(ticket.createdAt)}</span>
        </div>
      </Section>

      <Section title="Tasks">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-slate-500">
            {total === 0 ? "No tasks yet" : `${done} of ${total} completed`}
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {total > 0 && (
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}

        {loading && total === 0 && <p className="text-sm text-slate-400">Loading…</p>}
        {!loading && total === 0 && (
          <p className="text-sm text-slate-400">
            {canEdit ? "Add the first task below and assign it to someone." : "No tasks have been added to this event."}
          </p>
        )}

        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.taskId} className="border border-slate-100 rounded-lg px-3 py-2.5 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className={`text-slate-800 break-words ${t.completed ? "line-through decoration-slate-300" : ""}`}>{t.title}</span>
                <StatusBadge value={t.completed ? "COMPLETED" : statusKey(t.status)} />
              </div>
              <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span>{t.taskId}</span>
                <span>Assigned to {t.assigneeName || "—"}</span>
                {t.priority && <span>{t.priority} priority</span>}
                {t.dueDate && <span>Due {formatDate(t.dueDate)}</span>}
                {t.completed && (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 size={12} /> Completed {t.completedAt ? formatDateTime(t.completedAt) : ""}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {canEdit && (
        <Section title="Add a task">
          <form onSubmit={add} className="space-y-3">
            <Field label="Task" required>
              <textarea value={form.description} onChange={set("description")} rows={2} placeholder="What needs to be done?" className={inputClass} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Assign to" required>
                <select value={form.assigneeUserId} onChange={set("assigneeUserId")} disabled={assignable.length === 0} className={inputClass}>
                  <option value="">{usersLoading ? "Loading…" : assignable.length === 0 ? "No one available" : "Choose a person…"}</option>
                  {assignable.map((p) => (
                    <option key={p.id} value={p.id}>{p.name || p.email}</option>
                  ))}
                </select>
              </Field>
              <Field label="Due date" hint="Optional">
                <input type="date" value={form.dueDate} onChange={set("dueDate")} className={inputClass} />
              </Field>
              <Field label="Priority">
                <select value={form.priority} onChange={set("priority")} className={inputClass}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </Field>
            </div>
            {!usersLoading && assignable.length === 0 && (
              <p className="text-xs text-amber-700">
                {usersError ? `Couldn't load users: ${usersError}` : "No active users were found in your organisation."}
              </p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || assignable.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-[#007bff] rounded-lg hover:bg-blue-600 disabled:opacity-60"
              >
                <Plus size={15} /> {saving ? "Adding…" : "Add task"}
              </button>
            </div>
          </form>
        </Section>
      )}

      <ModalError message={error} />
    </ModalShell>
  );
}
