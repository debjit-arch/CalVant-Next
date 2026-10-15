"use client";
import React, { useState } from "react";
import { createTraining, updateTraining } from "../services/peopleApi";
import ModalShell, {
  Section,
  Field,
  FieldGroup,
  ChipGroup,
  ModalError,
  ModalButtons,
  inputClass,
} from "./ModalShell";

const CATEGORY_OPTIONS = [
  { value: "SECURITY", label: "Security" },
  { value: "PRIVACY", label: "Privacy" },
  { value: "AI", label: "AI" },
];

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
];

export default function TrainingFormModal({ persons = [], training = null, onClose, onSaved }) {
  // Passing `training` switches the modal to edit mode, so HR can correct a
  // record (e.g. marked "Not started" by mistake) and move it to Completed.
  const isEdit = !!training;
  const [personId, setPersonId] = useState(training?.personId || persons[0]?.id || "");
  const [courseName, setCourseName] = useState(training?.courseName || "");
  const [category, setCategory] = useState(training?.category || "SECURITY");
  const [status, setStatus] = useState(training?.status || "NOT_STARTED");
  const [attendancePercent, setAttendancePercent] = useState(training?.attendancePercent ?? "");
  const [completedAt, setCompletedAt] = useState(training?.completedAt ? String(training.completedAt).slice(0, 10) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const single = isEdit || persons.length === 1;
  const personName = persons.find((p) => p.id === personId)?.name;

  const changeStatus = (next) => {
    setStatus(next);
    // Finishing a course: default the completion date to today so it isn't left blank.
    if (next === "COMPLETED" && !completedAt) setCompletedAt(new Date().toISOString().slice(0, 10));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!personId || !courseName.trim()) {
      setError("Pick a person and name the course.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        courseName: courseName.trim(),
        category,
        status,
        attendancePercent: attendancePercent === "" ? null : Number(attendancePercent),
        completedAt: status === "COMPLETED" && completedAt ? new Date(completedAt).toISOString() : null,
      };
      const saved = isEdit ? await updateTraining(training.id, payload) : await createTraining({ personId, ...payload });
      onSaved(saved);
    } catch (err) {
      setError(err.message || "Couldn't save this record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={isEdit ? "Edit training" : "Add training"}
      subtitle={
        isEdit
          ? `Update this course${personName ? ` for ${personName}` : ""}.`
          : single
            ? `A course for ${persons[0].name}.`
            : "Record a course for someone on your team."
      }
      onClose={onClose}
      onSubmit={submit}
      footer={<ModalButtons onCancel={onClose} busy={saving} submitLabel={isEdit ? "Save changes" : "Add training"} busyLabel={isEdit ? "Saving…" : "Adding…"} />}
    >
      <Section title="The course">
        {!single && (
          <Field label="Who is it for?" required>
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
          </Field>
        )}
        <Field label="Course name" required>
          <input
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="e.g. Annual security awareness"
            className={inputClass}
            required
          />
        </Field>
        <FieldGroup label="Topic">
          <ChipGroup ariaLabel="Topic" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
        </FieldGroup>
      </Section>

      <Section title="Progress">
        <FieldGroup label="Where are they with it?">
          <ChipGroup ariaLabel="Progress" options={STATUS_OPTIONS} value={status} onChange={changeStatus} />
        </FieldGroup>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Attendance %" hint="Optional">
            <input
              type="number"
              min={0}
              max={100}
              value={attendancePercent}
              onChange={(e) => setAttendancePercent(e.target.value)}
              className={inputClass}
            />
          </Field>
          {status === "COMPLETED" && (
            <Field label="Completed on">
              <input type="date" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} className={inputClass} />
            </Field>
          )}
        </div>
      </Section>

      <ModalError message={error} />
    </ModalShell>
  );
}
