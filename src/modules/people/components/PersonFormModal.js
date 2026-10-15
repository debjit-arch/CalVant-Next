"use client";
import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { createPerson, updatePerson } from "../services/peopleApi";
import { getDepartments } from "@/modules/departments/services/userService";
import { useEffectiveOrg } from "@/hooks/useEffectiveOrg";
import ModalShell, {
  Section,
  Field,
  FieldGroup,
  ChipGroup,
  ModalError,
  InfoNote,
  ModalButtons,
  inputClass,
} from "./ModalShell";

const LIFECYCLE_OPTIONS = [
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "ACTIVE", label: "Active" },
  { value: "OFFBOARDING", label: "Offboarding" },
  { value: "TERMINATED", label: "Terminated" },
];

const EMPLOYMENT_OPTIONS = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "CONTRACTOR", label: "Contractor" },
];

export default function PersonFormModal({ person, onClose, onSaved }) {
  const isEdit = !!person;
  const isSynced = person?.source === "KEKA_SYNCED";

  const [form, setForm] = useState({
    name: person?.name || "",
    email: person?.email || "",
    department: person?.department || "",
    designation: person?.designation || "",
    employmentType: person?.employmentType || "EMPLOYEE",
    joiningDate: person?.joiningDate ? person.joiningDate.slice(0, 10) : "",
    lifecycleStatus: person?.lifecycleStatus || "ONBOARDING",
    linkedUserId: person?.linkedUserId || "",
  });
  // Rarely-needed settings stay tucked away when adding someone new, but are
  // open when editing (that's usually why you're here).
  const [showMore, setShowMore] = useState(isEdit);

  // Department list = the departments that exist in this org (same source as
  // the Task module), so people can only be filed under a real department.
  const { effectiveOrgId } = useEffectiveOrg();
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setDeptLoading(true);
    getDepartments()
      .then((d) => {
        if (!alive) return;
        const all = Array.isArray(d) ? d : [];
        const mine = effectiveOrgId ? all.filter((x) => x.organization === effectiveOrgId) : all;
        setDepartments(mine);
      })
      .catch(() => alive && setDepartments([]))
      .finally(() => alive && setDeptLoading(false));
    return () => {
      alive = false;
    };
  }, [effectiveOrgId]);

  const deptNames = [...new Set(departments.map((d) => (d.name || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
  // Keep a person's existing department selectable even if it isn't in the org list any more.
  if (form.department && !deptNames.includes(form.department)) deptNames.unshift(form.department);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setValue = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        joiningDate: form.joiningDate ? new Date(form.joiningDate).toISOString() : null,
      };
      const saved = isEdit ? await updatePerson(person.id, payload) : await createPerson(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message || "Couldn't save this record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={isEdit ? "Edit person" : "Add a new person"}
      subtitle={
        isEdit
          ? `Update ${person.name}'s details.`
          : "Enter their basic details to start onboarding."
      }
      onClose={onClose}
      onSubmit={submit}
      maxWidth="max-w-lg"
      footer={
        <ModalButtons
          onCancel={onClose}
          busy={saving}
          submitLabel={isEdit ? "Save changes" : "Add person"}
          busyLabel={isEdit ? "Saving…" : "Adding…"}
        />
      }
    >
      {isSynced && (
        <InfoNote tone="blue">
          This person is synced from Keka, so their name, email, department, job title and dates can only be
          changed there. You can still update their status and linked CalVant user.
        </InfoNote>
      )}

      <Section title="Who are they">
        <Field label="Full name" required>
          <input
            value={form.name}
            onChange={set("name")}
            disabled={isSynced}
            required
            placeholder="e.g. Priya Sharma"
            className={inputClass}
          />
        </Field>
        <Field label="Work email" required>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            disabled={isSynced}
            required
            placeholder="name@company.com"
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Where they'll work">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Department">
            <select
              value={form.department}
              onChange={set("department")}
              disabled={isSynced || deptLoading}
              className={inputClass}
            >
              <option value="">{deptLoading ? "Loading departments…" : "Select a department"}</option>
              {deptNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Job title">
            <input value={form.designation} onChange={set("designation")} disabled={isSynced} className={inputClass} />
          </Field>
        </div>
        <FieldGroup label="Type of worker">
          <ChipGroup
            ariaLabel="Type of worker"
            options={EMPLOYMENT_OPTIONS}
            value={form.employmentType}
            onChange={setValue("employmentType")}
            disabled={isSynced}
          />
        </FieldGroup>
      </Section>

      <Section title="Start date">
        <Field>
          <input
            type="date"
            value={form.joiningDate}
            onChange={set("joiningDate")}
            disabled={isSynced}
            className={inputClass}
          />
        </Field>
      </Section>

      <div>
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
        >
          <ChevronDown size={14} className={`transition-transform ${showMore ? "rotate-180" : ""}`} />
          {showMore ? "Hide more options" : "More options"}
        </button>

        {showMore && (
          <div className="mt-3 space-y-4">
            <FieldGroup
              label="Current status"
              hint={isEdit ? undefined : "New people start in Onboarding — only change this if they're already working."}
            >
              <ChipGroup
                ariaLabel="Current status"
                options={LIFECYCLE_OPTIONS}
                value={form.lifecycleStatus}
                onChange={setValue("lifecycleStatus")}
              />
            </FieldGroup>

            <Field
              label="Linked CalVant user ID"
              hint="Only needed if this person also logs into CalVant. It lets them appear in the document acceptance list."
            >
              <input value={form.linkedUserId} onChange={set("linkedUserId")} className={inputClass} />
            </Field>
          </div>
        )}
      </div>

      <ModalError message={error} />
    </ModalShell>
  );
}
