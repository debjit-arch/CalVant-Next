"use client";
import React, { useState } from "react";
import { updateBackgroundCheckManual, uploadDocument, documentDownloadUrl } from "../services/peopleApi";
import ModalShell, {
  Section,
  Field,
  FieldGroup,
  ChipGroup,
  FileButton,
  ModalError,
  ModalButtons,
  inputClass,
} from "./ModalShell";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "CLEARED", label: "Cleared" },
  { value: "FLAGGED", label: "Flagged" },
];

export default function BgvFormModal({ check, person, onClose, onSaved }) {
  const [status, setStatus] = useState(check?.status || "PENDING");
  const [notes, setNotes] = useState(check?.notes || "");
  const [file, setFile] = useState(null);
  const [reportFileId, setReportFileId] = useState(check?.reportFileId || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setUploading(true);
    setError("");
    try {
      const { fileId } = await uploadDocument(f, "BGV_REPORT");
      setReportFileId(fileId);
    } catch (err) {
      setError(err.message || "Couldn't upload the report.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await updateBackgroundCheckManual(check.id, {
        status,
        notes,
        reportFileId,
        // No manual date field: every save stamps the check with the current time.
        checkedAt: new Date().toISOString(),
      });
      onSaved(saved);
    } catch (err) {
      setError(err.message || "Couldn't save this update.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Update background check"
      subtitle={`Record the latest result for ${person.name}.`}
      onClose={onClose}
      onSubmit={submit}
      footer={<ModalButtons onCancel={onClose} busy={saving} disabled={uploading} submitLabel="Save update" />}
    >
      <Section title="Result">
        <FieldGroup label="Where does it stand?">
          <ChipGroup ariaLabel="Background check result" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
        </FieldGroup>
      </Section>

      <Section title="Details">
        <Field label="Notes" hint="Optional — anything HR should remember about this check.">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputClass} />
        </Field>
        <FieldGroup label="Verification report">
          <FileButton
            onChange={handleFile}
            uploading={uploading}
            fileName={file?.name}
            existingUrl={reportFileId ? documentDownloadUrl(reportFileId) : null}
            existingLabel="Current report on file"
          />
          {!reportFileId && <span className="block text-[11px] text-slate-400 mt-1">No report uploaded yet.</span>}
        </FieldGroup>
      </Section>

      <ModalError message={error} />
    </ModalShell>
  );
}
