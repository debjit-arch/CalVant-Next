"use client";
import React, { useState } from "react";
import { recordPolicyAcceptance, updatePolicyAcceptance, uploadDocument, documentDownloadUrl } from "../services/peopleApi";
import { POLICY_LABELS, humanize } from "../utils/peopleFormat";
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

const ALLOWED_FILE_TYPES = "application/pdf,image/*";
const isAllowedFile = (f) => f.type === "application/pdf" || (f.type || "").startsWith("image/");

const SOURCE_OPTIONS = [
  { value: "HRMS_LINK", label: "Link to HRMS" },
  { value: "MANUAL_UPLOAD", label: "Upload a copy" },
];

export default function DocumentAcceptanceFormModal({ policyType, person, acceptance, onClose, onSaved }) {
  const isEdit = !!acceptance;
  const docName = POLICY_LABELS[policyType] || humanize(policyType);

  const [version, setVersion] = useState(acceptance?.version || "");
  const [accepted, setAccepted] = useState(acceptance?.accepted ?? false);
  const [acceptedAt, setAcceptedAt] = useState(
    acceptance?.acceptedAt ? acceptance.acceptedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [documentSource, setDocumentSource] = useState(acceptance?.documentSource || "HRMS_LINK");
  const [documentUrl, setDocumentUrl] = useState(acceptance?.documentUrl || "");
  const [documentFileId, setDocumentFileId] = useState(acceptance?.documentFileId || null);
  const [fileName, setFileName] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // "Yes, accepted" is locked until the signed copy (PDF or image) is uploaded.
  const hasUpload = documentSource === "MANUAL_UPLOAD" && !!documentFileId && !uploading;
  const acceptedOptions = [
    {
      value: true,
      label: "Yes, accepted",
      disabled: !hasUpload,
      disabledReason: "Upload the signed PDF or image first",
    },
    { value: false, label: "Not yet" },
  ];

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!isAllowedFile(f)) {
      setError("Please upload a PDF or an image (PNG, JPG…).");
      e.target.value = "";
      return;
    }
    setFileName(f.name);
    setUploading(true);
    setError("");
    try {
      const { fileId } = await uploadDocument(f, policyType);
      setDocumentFileId(fileId);
    } catch (err) {
      setError(err.message || "Couldn't upload the document.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        personId: person.id,
        policyType,
        version,
        accepted: accepted && hasUpload,
        acceptedAt: acceptedAt ? new Date(acceptedAt).toISOString() : null,
        documentSource,
        documentUrl: documentSource === "HRMS_LINK" ? documentUrl : null,
        documentFileId: documentSource === "MANUAL_UPLOAD" ? documentFileId : null,
      };
      const saved = isEdit ? await updatePolicyAcceptance(acceptance.id, payload) : await recordPolicyAcceptance(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message || "Couldn't save this record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={`${isEdit ? "Update" : "Record"} ${docName.toLowerCase()}`}
      subtitle={`For ${person.name}.`}
      onClose={onClose}
      onSubmit={submit}
      footer={<ModalButtons onCancel={onClose} busy={saving} disabled={uploading} submitLabel="Save" />}
    >
      <Section title="Acceptance">
        <FieldGroup label="Has this person accepted it?">
          <ChipGroup ariaLabel="Accepted" options={acceptedOptions} value={accepted && hasUpload} onChange={setAccepted} />
          {!hasUpload && (
            <span className="block text-[11px] text-slate-400 mt-1.5 leading-snug">
              Upload the signed copy (PDF or image) below to enable “Yes, accepted”.
            </span>
          )}
        </FieldGroup>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Accepted on">
            <input type="date" value={acceptedAt} onChange={(e) => setAcceptedAt(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Version" hint="Optional, e.g. 2026-v2">
            <input value={version} onChange={(e) => setVersion(e.target.value)} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="The signed document">
        <ChipGroup ariaLabel="Where the document is kept" options={SOURCE_OPTIONS} value={documentSource} onChange={setDocumentSource} />
        {documentSource === "HRMS_LINK" ? (
          <Field hint="Paste the link to this document in your HRMS.">
            <input
              type="url"
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              placeholder="https://your-hrms.example.com/documents/…"
              className={inputClass}
            />
          </Field>
        ) : (
          <FileButton
            onChange={handleFile}
            uploading={uploading}
            fileName={fileName}
            accept={ALLOWED_FILE_TYPES}
            existingUrl={documentFileId ? documentDownloadUrl(documentFileId) : null}
            existingLabel="Current file on record"
          />
        )}
      </Section>

      <ModalError message={error} />
    </ModalShell>
  );
}
