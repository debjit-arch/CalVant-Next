"use client";
import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { initiateOffboarding } from "../services/peopleApi";
import ModalShell, {
  Section,
  Field,
  InfoNote,
  ModalError,
  ModalButtons,
  inputClass,
} from "./ModalShell";

export default function InitiateOffboardingModal({ persons, onClose, onCreated }) {
  const [personId, setPersonId] = useState(persons[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [accounts, setAccounts] = useState([{ system: "", accountIdentifier: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const single = persons.length === 1;

  const updateAccount = (idx, field, value) =>
    setAccounts((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));

  const addRow = () => setAccounts((prev) => [...prev, { system: "", accountIdentifier: "" }]);
  const removeRow = (idx) => setAccounts((prev) => prev.filter((_, i) => i !== idx));

  const submit = async (e) => {
    e.preventDefault();
    if (!personId) {
      setError("Pick a person.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const cleanAccounts = accounts
        .filter((a) => a.system.trim())
        .map((a) => ({ system: a.system.trim(), accountIdentifier: a.accountIdentifier.trim() }));
      const created = await initiateOffboarding(personId, cleanAccounts, notes);
      onCreated(created);
    } catch (err) {
      setError(err.message || "Couldn't start offboarding.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Start offboarding"
      subtitle={single ? `Begin the exit process for ${persons[0].name}.` : "Begin the exit process for someone who is leaving."}
      onClose={onClose}
      onSubmit={submit}
      maxWidth="max-w-lg"
      footer={
        <ModalButtons
          onCancel={onClose}
          busy={saving}
          disabled={!personId}
          submitLabel="Start offboarding"
          busyLabel="Starting…"
        />
      }
    >
      {!single && (
        <Section title="Who is leaving?">
          <Field required>
            <select value={personId} onChange={(e) => setPersonId(e.target.value)} className={inputClass} required>
              <option value="" disabled>
                Select a person…
              </option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.email}
                </option>
              ))}
            </select>
            {persons.length === 0 && (
              <span className="text-xs text-amber-600 block mt-1">
                No one is eligible — everyone left is already offboarding or already terminated.
              </span>
            )}
          </Field>
        </Section>
      )}

      <Section title="Systems they have access to">
        <InfoNote tone="amber">
          Each system you add becomes a checklist item. It must be reviewed — and deactivated where needed — before the
          offboarding can be completed, per the access-removal policy.
        </InfoNote>
        <div className="space-y-2">
          {accounts.map((a, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                placeholder="System (e.g. GitHub, Google Workspace)"
                value={a.system}
                onChange={(e) => updateAccount(idx, "system", e.target.value)}
                className={`${inputClass} flex-1`}
              />
              <input
                placeholder="Account or username"
                value={a.accountIdentifier}
                onChange={(e) => updateAccount(idx, "accountIdentifier", e.target.value)}
                className={`${inputClass} flex-1`}
              />
              {accounts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  aria-label="Remove system"
                  className="text-slate-400 hover:text-rose-500 flex-shrink-0 p-1"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
        >
          <Plus size={13} /> Add another system
        </button>
      </Section>

      <Section title="Anything to note?">
        <Field hint="Optional">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
        </Field>
      </Section>

      <ModalError message={error} />
    </ModalShell>
  );
}
