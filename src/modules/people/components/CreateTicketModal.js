"use client";
import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { createTicket, addTicketTask } from "../services/peopleApi";
import { useAssignableUsers, assigneeFields } from "./ticketShared";
import ModalShell, {
  Section,
  Field,
  InfoNote,
  ModalError,
  ModalButtons,
  inputClass,
} from "./ModalShell";

const COPY = {
  DISCIPLINARY: {
    title: "Log a disciplinary case",
    subtitle: "Record a conduct or policy breach so it can be tracked to a resolution.",
    placeholder: "What happened? Keep it short and factual.",
    submit: "Log case",
  },
  SECURITY_EVENT: {
    title: "Log an event",
    placeholder: "What was reported? Include what, when and where if you know.",
    submit: "Log event",
  },
};

const EMPTY_TASK = { description: "", assigneeUserId: "", dueDate: "", priority: "Medium" };

export default function CreateTicketModal({ category, persons, onClose, onCreated }) {
  const copy = COPY[category] || COPY.DISCIPLINARY;
  const [personId, setPersonId] = useState(persons.length === 1 ? persons[0].id : "");
  const [summary, setSummary] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Event log only: tasks to create together with the event.
  const isEvent = category === "SECURITY_EVENT";
  const [drafts, setDrafts] = useState([]);
  const [task, setTask] = useState(EMPTY_TASK);
  const setTaskField = (key) => (e) => setTask((t) => ({ ...t, [key]: e.target.value }));

  // Users of this organisation (from user-service) — the same people the task board assigns to.
  const { users: assignable, loading: usersLoading, error: usersError } = useAssignableUsers();
  const nameOf = (id) => assignable.find((u) => u.id === id)?.name || "—";

  const addDraft = () => {
    if (!task.description.trim()) return setError("Describe the task.");
    if (!task.assigneeUserId) return setError("Choose who to assign it to.");
    setError("");
    setDrafts((d) => [...d, { ...task, description: task.description.trim() }]);
    setTask(EMPTY_TASK);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!summary.trim()) {
      setError("Give it a short summary.");
      return;
    }
    // A task that's filled in but not yet added to the list still counts.
    const toCreate = [...drafts];
    if (isEvent && (task.description.trim() || task.assigneeUserId)) {
      if (!task.description.trim() || !task.assigneeUserId) {
        setError("Finish the task you started (description and assignee), or clear it.");
        return;
      }
      toCreate.push({ ...task, description: task.description.trim() });
    }
    if (isEvent && toCreate.length > 0 && !personId) {
      setError("Choose the related person to assign tasks for this event.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let created = await createTicket(category, {
        personId: personId || null,
        summary: summary.trim(),
        ticketingConfig: {},
        ...(category === "DISCIPLINARY" ? { actionTaken: actionTaken.trim() || null } : {}),
      });
      let failed = 0;
      for (const t of toCreate) {
        try {
          const view = await addTicketTask(created.id, {
            description: t.description,
            ...assigneeFields(assignable.find((u) => u.id === t.assigneeUserId) || { id: t.assigneeUserId }),
            dueDate: t.dueDate || null,
            priority: t.priority,
          });
          created = view.ticket || created;
        } catch {
          failed += 1;
        }
      }
      onCreated(created, { failed });
    } catch (err) {
      setError(err.message || "Couldn't log this ticket.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={copy.title}
      subtitle={copy.subtitle}
      onClose={onClose}
      onSubmit={submit}
      maxWidth={isEvent ? "max-w-xl" : undefined}
      footer={<ModalButtons onCancel={onClose} busy={saving} submitLabel={copy.submit} busyLabel="Logging…" />}
    >
      {!isEvent && (
        <InfoNote>
          If a ticketing system is connected, this creates a real ticket there and keeps it in sync. Otherwise it's
          tracked here in CalVant only.
        </InfoNote>
      )}

      <Section title="Details">
        <Field label="Related person" hint="Optional">
          <select value={personId} onChange={(e) => setPersonId(e.target.value)} className={inputClass}>
            <option value="">Not tied to a specific person</option>
            {persons.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.email}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Summary" required>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            placeholder={copy.placeholder}
            className={inputClass}
            required
          />
        </Field>
      </Section>

      {isEvent && (
        <Section title="Tasks">
          {drafts.length > 0 && (
            <ul className="space-y-1.5 mb-3">
              {drafts.map((d, i) => (
                <li key={i} className="flex items-start justify-between gap-2 border border-slate-100 rounded-lg px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="text-slate-800 break-words">{d.description}</div>
                    <div className="text-xs text-slate-400">
                      {nameOf(d.assigneeUserId)} · {d.priority}
                      {d.dueDate ? ` · due ${d.dueDate}` : ""}
                    </div>
                  </div>
                  <button type="button" onClick={() => setDrafts((x) => x.filter((_, j) => j !== i))} className="text-slate-400 hover:text-slate-600" aria-label="Remove task">
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="space-y-3">
            <Field label="Task" hint="Optional — you can also add tasks later">
              <textarea value={task.description} onChange={setTaskField("description")} rows={2} placeholder="What needs to be done?" className={inputClass} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Assign to">
                <select value={task.assigneeUserId} onChange={setTaskField("assigneeUserId")} disabled={assignable.length === 0} className={inputClass}>
                  <option value="">{usersLoading ? "Loading…" : assignable.length === 0 ? "No one available" : "Choose a person…"}</option>
                  {assignable.map((p) => (
                    <option key={p.id} value={p.id}>{p.name || p.email}</option>
                  ))}
                </select>
              </Field>
              <Field label="Due date" hint="Optional">
                <input type="date" value={task.dueDate} onChange={setTaskField("dueDate")} className={inputClass} />
              </Field>
              <Field label="Priority">
                <select value={task.priority} onChange={setTaskField("priority")} className={inputClass}>
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
            <button type="button" onClick={addDraft} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50">
              <Plus size={13} /> Add another task
            </button>
          </div>
        </Section>
      )}

      {category === "DISCIPLINARY" && (
        <Section title="Disciplinary action taken">
          <Field label="Action taken" hint="Optional — what was done about it">
            <textarea
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              rows={4}
              placeholder="e.g. Written warning issued, refresher training assigned, manager informed…"
              className={inputClass}
            />
          </Field>
        </Section>
      )}

      <ModalError message={error} />
    </ModalShell>
  );
}
