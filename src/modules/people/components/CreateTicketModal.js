"use client";
import React, { useState } from "react";
import { createTicket } from "../services/peopleApi";
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
    title: "Log a security event",
    subtitle: "Record a reported security incident involving this person.",
    placeholder: "What was reported? Include what, when and where if you know.",
    submit: "Log event",
  },
};

export default function CreateTicketModal({ category, persons, onClose, onCreated }) {
  const copy = COPY[category] || COPY.DISCIPLINARY;
  const [personId, setPersonId] = useState(persons.length === 1 ? persons[0].id : "");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!summary.trim()) {
      setError("Give it a short summary.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await createTicket(category, {
        personId: personId || null,
        summary: summary.trim(),
        ticketingConfig: {},
      });
      onCreated(created);
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
      footer={<ModalButtons onCancel={onClose} busy={saving} submitLabel={copy.submit} busyLabel="Logging…" />}
    >
      <InfoNote>
        If a ticketing system is connected, this creates a real ticket there and keeps it in sync. Otherwise it's
        tracked here in CalVant only.
      </InfoNote>

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

      <ModalError message={error} />
    </ModalShell>
  );
}
