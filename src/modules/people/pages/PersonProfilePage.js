"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  ShieldCheck,
  FileText,
  GraduationCap,
  Ticket,
  LogOut,
  UploadCloud,
  RefreshCw,
  UserCircle2,
  Check,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  getPerson,
  listBackgroundChecksForPerson,
  listPolicyAcceptancesForPerson,
  listTrainingForPerson,
  listTicketsForPerson,
  initiateBackgroundCheck,
  refreshBackgroundCheck,
  getOffboardingCase,
} from "../services/peopleApi";
import StatusBadge from "../components/StatusBadge";
import PersonAvatar from "../components/PersonAvatar";
import PersonFormModal from "../components/PersonFormModal";
import BgvFormModal from "../components/BgvFormModal";
import DocumentAcceptanceFormModal from "../components/DocumentAcceptanceFormModal";
import TrainingFormModal from "../components/TrainingFormModal";
import CreateTicketModal from "../components/CreateTicketModal";
import InitiateOffboardingModal from "../components/InitiateOffboardingModal";
import OffboardingCaseDetail from "../components/OffboardingCaseDetail";
import SectionPageHeader from "../components/SectionPageHeader";
import { formatDate, humanize, canWrite, POLICY_LABELS, POLICY_TYPES, getAttention, attentionLabel } from "../utils/peopleFormat";
import { captureActivity, ACTIONS } from "@/services/activities";

// Journey steps shown at the top of the page. "Joined" is a milestone only (a
// person is always past it); the other three are the pages of the wizard below,
// in the real compliance order: screen, accept policies, train.
const JOURNEY_STEPS = ["Joined", "Background check", "Policy acceptance", "Training"];

function useUserRoles() {
  const [roles, setRoles] = useState([]);
  useEffect(() => {
    try {
      const token =
        (typeof window !== "undefined" &&
          (sessionStorage.getItem("token") || localStorage.getItem("token"))) ||
        "";
      if (!token) return;
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      const raw = payload.roles || payload.role || [];
      setRoles((Array.isArray(raw) ? raw : [raw]).filter(Boolean).map((r) => String(r).toLowerCase()));
    } catch {
      setRoles([]);
    }
  }, []);
  return roles;
}

/** Which step the person is currently on, 1-4, based on what's actually done. */
function currentStepIndex({ latestBgv, policies, training }) {
  const bgvCleared = (latestBgv?.status || "").toUpperCase() === "CLEARED";
  if (!bgvCleared) return 2;
  const docsComplete = POLICY_TYPES.every((t) => policies.find((p) => p.policyType === t)?.accepted);
  if (!docsComplete) return 3;
  const trainingComplete = training.length > 0 && training.every((t) => (t.status || "").toUpperCase() === "COMPLETED");
  if (!trainingComplete) return 4;
  return 5; // all caught up
}

export default function PersonProfilePage({ personId }) {
  const roles = useUserRoles();
  const canEdit = canWrite(roles);

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bgv, setBgv] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [training, setTraining] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [offboardCase, setOffboardCase] = useState(null);

  const [showEdit, setShowEdit] = useState(false);
  const [bgvBusy, setBgvBusy] = useState(false);
  const [showBgvEdit, setShowBgvEdit] = useState(false);
  const [showInitiateOffboard, setShowInitiateOffboard] = useState(false);
  const [showManageOffboard, setShowManageOffboard] = useState(false);
  const [docTypeEdit, setDocTypeEdit] = useState(null);
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [trainingEdit, setTrainingEdit] = useState(null);
  const [ticketCategory, setTicketCategory] = useState(null);
  const [viewStep, setViewStep] = useState(null); // null = follow the person's real progress

  const latestBgv = bgv[0] || null;

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const p = await getPerson(personId);
      setPerson(p);
      const [b, pol, t, tk, oc] = await Promise.all([
        listBackgroundChecksForPerson(personId).catch(() => []),
        listPolicyAcceptancesForPerson(personId).catch(() => []),
        listTrainingForPerson(personId).catch(() => []),
        listTicketsForPerson(personId).catch(() => []),
        p?.activeOffboardingCaseId ? getOffboardingCase(p.activeOffboardingCaseId).catch(() => null) : Promise.resolve(null),
      ]);
      setBgv(b || []);
      setPolicies(pol || []);
      setTraining(t || []);
      setTickets(tk || []);
      setOffboardCase(oc);
    } catch (err) {
      setError(err.message || "Couldn't load this person.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    captureActivity({ action: ACTIONS.PAGE_LOAD, item: "People · Viewed Profile", url: `/people/directory/${personId}` });
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);

  const initiateBgv = async () => {
    if (!person) return;
    setBgvBusy(true);
    try {
      const check = await initiateBackgroundCheck(person.id, person.name, person.email);
      setBgv((prev) => [check, ...prev]);
    } catch {
      /* surfaced via StatusBadge staying "Not started" */
    } finally {
      setBgvBusy(false);
    }
  };

  const refreshBgv = async () => {
    if (!latestBgv) return;
    setBgvBusy(true);
    try {
      const check = await refreshBackgroundCheck(latestBgv.id);
      setBgv((prev) => [check, ...prev.slice(1)]);
    } finally {
      setBgvBusy(false);
    }
  };

  const docsAccepted = policies.filter((p) => p.accepted).length;
  const trainingPending = training.filter((t) => (t.status || "").toUpperCase() !== "COMPLETED").length;
  const openTickets = tickets.filter((t) => (t.status || "").toUpperCase() === "OPEN").length;

  const attention = useMemo(
    () =>
      person
        ? getAttention({
            person,
            screening: latestBgv,
            docsAccepted,
            trainingPending,
            openTickets,
          })
        : { count: 0, reasons: [] },
    [person, latestBgv, docsAccepted, trainingPending, openTickets],
  );

  const step = person ? currentStepIndex({ latestBgv, policies, training }) : 2;
  const bgvCleared = (latestBgv?.status || "").toUpperCase() === "CLEARED";
  const docsComplete = POLICY_TYPES.every((t) => policies.find((p) => p.policyType === t)?.accepted);
  const trainingComplete = training.length > 0 && training.every((t) => (t.status || "").toUpperCase() === "COMPLETED");
  const stepDone = { 1: true, 2: bgvCleared, 3: docsComplete, 4: trainingComplete };
  // Wizard pages are steps 2-4; step 5 ("all caught up") lands on the last page.
  // Training stays locked until every policy has been accepted.
  const trainingUnlocked = docsComplete;
  const requested = viewStep ?? Math.min(step, 4);
  const activeStep = requested === 4 && !trainingUnlocked ? 3 : requested;
  const terminated = (person?.lifecycleStatus || "").toUpperCase() === "TERMINATED";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
        <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          <SectionPageHeader icon={UserCircle2} title="Loading…" backHref="/people/directory" backLabel="Back to Directory" />
          <div className="mt-10 text-center text-sm text-slate-400">Loading person…</div>
        </main>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
        <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          <SectionPageHeader icon={UserCircle2} title="Person not found" backHref="/people/directory" backLabel="Back to Directory" />
          <div className="mt-6 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error || "This person could not be found."}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6 pb-20">
        <SectionPageHeader
          icon={UserCircle2}
          iconGradient="from-violet-500 to-violet-600"
          title={person.name}
          description={person.email}
          backHref="/people/directory"
          backLabel="Back to Directory"
          onRefresh={load}
          right={
            canEdit && (
              <button
                onClick={() => setShowEdit(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 bg-white"
              >
                <Pencil size={14} /> Edit
              </button>
            )
          }
        />

        {/* Identity + progress strip */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mt-6 flex flex-wrap items-center gap-5">
          <PersonAvatar name={person.name} size={48} />
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusBadge value={person.lifecycleStatus} />
              <StatusBadge value={person.onboardingStatus} />
              {person.activeOffboardingCaseId && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                  <LogOut size={12} /> Offboarding in progress
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              {person.department || "No department"} · {person.designation || "No title"} · joined {formatDate(person.joiningDate)}
            </p>
          </div>

          {!terminated && (
            <div className="text-right">
              {attention.count > 0 ? (
                <span title={attention.reasons.join(" · ")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600">
                  <AlertTriangle size={15} /> {attentionLabel(attention.count)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                  <Check size={15} /> All caught up
                </span>
              )}
            </div>
          )}
        </div>

        {/* Journey stepper */}
        <div className="bg-slate-100/80 rounded-2xl p-5 sm:p-6 mt-4">
          <ol className="flex items-start">
            {JOURNEY_STEPS.map((label, idx) => {
              const n = idx + 1;
              const viewable = n >= 2 && (n < 4 || trainingUnlocked);
              const locked = n === 4 && !trainingUnlocked;
              const active = n === activeStep;
              const done = stepDone[n];
              return (
                <React.Fragment key={label}>
                  <li className="flex flex-col items-center gap-2 w-24 sm:w-32 flex-shrink-0">
                    <button
                      type="button"
                      disabled={!viewable}
                      onClick={() => viewable && setViewStep(n)}
                      aria-current={active ? "step" : undefined}
                      aria-label={label}
                      title={locked ? "Complete Policy acceptance to unlock Training" : undefined}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        active
                          ? "bg-white border-2 border-blue-600 text-blue-600"
                          : locked
                            ? "bg-slate-100 border border-slate-200 text-slate-300"
                            : done
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-slate-200 text-slate-400"
                      } ${viewable ? "cursor-pointer" : "cursor-default"}`}
                    >
                      {done && !active ? <Check size={16} /> : n}
                    </button>
                    <span
                      className={`text-xs sm:text-sm text-center leading-tight font-semibold ${
                        active ? "text-slate-900" : done ? "text-slate-700" : "text-slate-400"
                      }`}
                    >
                      {label}
                    </span>
                  </li>
                  {idx < JOURNEY_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mt-5 rounded-full ${done ? "bg-blue-600" : "bg-slate-200"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mt-6 items-start">
          {/* Left: key facts */}
          <div className="lg:sticky lg:top-6 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <dl className="grid grid-cols-1 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400 mb-0.5">Department</dt>
                  <dd className="text-slate-700">{person.department || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400 mb-0.5">Job title</dt>
                  <dd className="text-slate-700">{person.designation || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400 mb-0.5">Type</dt>
                  <dd className="text-slate-700">{humanize(person.employmentType || "EMPLOYEE")}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400 mb-0.5">Joined</dt>
                  <dd className="text-slate-700">{formatDate(person.joiningDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400 mb-0.5">Exited</dt>
                  <dd className="text-slate-700">{formatDate(person.exitDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400 mb-0.5">Added</dt>
                  <dd className="text-slate-700">{person.source === "KEKA_SYNCED" ? "Synced from Keka" : "Manually"}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Right: one step at a time, then the non-onboarding actions */}
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              {activeStep === 2 && (
                <StepPanel
                  title="Background check"
                  icon={ShieldCheck}
                  action={
                    canEdit &&
                    (!latestBgv ? (
                      <button
                        onClick={initiateBgv}
                        disabled={bgvBusy}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                      >
                        <ShieldCheck size={14} /> {bgvBusy ? "Starting…" : "Start check"}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        {latestBgv.source === "VENDOR_SYNCED" && (
                          <button
                            onClick={refreshBgv}
                            disabled={bgvBusy}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-200 bg-white px-3 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-60"
                          >
                            <RefreshCw size={14} /> Refresh
                          </button>
                        )}
                        <button
                          onClick={() => setShowBgvEdit(true)}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-200 bg-white px-3 py-2 rounded-lg hover:bg-slate-50"
                        >
                          <UploadCloud size={14} /> Update
                        </button>
                      </div>
                    ))
                  }
                >
                  {bgv.length === 0 ? (
                    <Empty text="No background check started yet." />
                  ) : (
                    <ul className="space-y-2">
                      {bgv.map((b) => (
                        <li key={b.id} className="flex items-center justify-between gap-3 text-sm border border-slate-100 rounded-xl px-4 py-3.5">
                          <div className="text-slate-700">
                            <span>{b.vendor || "Manually recorded"}</span>
                            <span className="text-slate-400"> · checked {formatDate(b.checkedAt)}</span>
                          </div>
                          <StatusBadge value={b.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </StepPanel>
              )}

              {activeStep === 3 && (
                <StepPanel title="Policy acceptance" icon={FileText}>
                  <ul className="space-y-2">
                    {POLICY_TYPES.map((t) => {
                      const p = policies.find((x) => x.policyType === t);
                      return (
                        <li key={t} className="flex items-center justify-between gap-3 text-sm border border-slate-100 rounded-xl px-4 py-3.5">
                          <div className="text-slate-700 min-w-0">
                            <span>{POLICY_LABELS[t] || humanize(t)}</span>
                            {p?.version && <span className="text-slate-400"> · v{p.version}</span>}
                            {p?.acceptedAt && <span className="text-slate-400"> · {formatDate(p.acceptedAt)}</span>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {p ? (
                              <StatusBadge
                                value={p.accepted}
                                label={p.accepted ? "Accepted" : "Not accepted"}
                                style={p.accepted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}
                              />
                            ) : (
                              <StatusBadge value="NOT_RECORDED" label="Not recorded" style="bg-slate-50 text-slate-500 border-slate-200" />
                            )}
                            {canEdit && (
                              <button
                                onClick={() => setDocTypeEdit(t)}
                                className="text-xs font-medium text-slate-600 border border-slate-200 bg-white px-2.5 py-1.5 rounded-lg hover:bg-slate-50"
                              >
                                {p ? "Update" : "Record"}
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </StepPanel>
              )}

              {activeStep === 4 && (
                <StepPanel
                  title="Training"
                  icon={GraduationCap}
                  action={
                    canEdit && (
                      <button
                        onClick={() => setShowAddTraining(true)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-200 bg-white px-3 py-2 rounded-lg hover:bg-slate-50"
                      >
                        + Add training
                      </button>
                    )
                  }
                >
                  {training.length === 0 ? (
                    <Empty text="No training assigned yet." />
                  ) : (
                    <ul className="space-y-2">
                      {training.map((t) => (
                        <li key={t.id} className="text-sm border border-slate-100 rounded-xl px-4 py-3.5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-700">{t.courseName}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <StatusBadge value={t.status} />
                              {canEdit && t.source !== "LMS_SYNCED" && (
                                <button
                                  onClick={() => setTrainingEdit(t)}
                                  className="text-xs font-medium text-slate-600 border border-slate-200 bg-white px-2.5 py-1.5 rounded-lg hover:bg-slate-50"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {humanize(t.category)} · {t.attendancePercent != null ? `${t.attendancePercent}% attendance` : "no attendance recorded"}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </StepPanel>
              )}

              {activeStep === 3 && !trainingUnlocked && (
                <p className="text-xs text-slate-400 mt-4">Accept all three policies to unlock Training.</p>
              )}

              {/* Previous / Next */}
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 mt-5 pt-5">
                <button
                  type="button"
                  onClick={() => setViewStep(activeStep - 1)}
                  disabled={activeStep <= 2}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:text-slate-300 disabled:hover:bg-white disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={14} /> Previous
                </button>
                {activeStep < 4 && (
                  <button
                    type="button"
                    onClick={() => setViewStep(activeStep + 1)}
                    disabled={activeStep === 3 && !trainingUnlocked}
                    title={activeStep === 3 && !trainingUnlocked ? "Accept all policies to continue" : undefined}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:bg-blue-300 disabled:hover:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    Next: {JOURNEY_STEPS[activeStep]} <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>

            <SectionCard
              title="HR actions"
              icon={Ticket}
              action={
                canEdit && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTicketCategory("DISCIPLINARY")}
                      className="text-xs font-medium text-slate-600 border border-slate-200 bg-white px-2 py-1.5 rounded-lg hover:bg-slate-50"
                    >
                      Log disciplinary case
                    </button>
                    <button
                      onClick={() => setTicketCategory("SECURITY_EVENT")}
                      className="text-xs font-medium text-slate-600 border border-slate-200 bg-white px-2 py-1.5 rounded-lg hover:bg-slate-50"
                    >
                      Log security event
                    </button>
                  </div>
                )
              }
            >
              {tickets.length === 0 ? (
                <Empty text="No actions logged for this person." />
              ) : (
                <ul className="space-y-2">
                  {tickets.map((t) => (
                    <li key={t.id} className="text-sm border border-slate-100 rounded-lg px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">{t.summary}</span>
                        <StatusBadge value={t.status} />
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>{humanize(t.category)}</span>
                        {t.ticketUrl && (
                          <a href={t.ticketUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                            View in {t.ticketSystem || "ticketing system"}
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              title="Offboarding"
              icon={LogOut}
              action={
                canEdit &&
                (offboardCase ? (
                  <button
                    onClick={() => setShowManageOffboard(true)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 border border-slate-200 bg-white px-2 py-1.5 rounded-lg hover:bg-slate-50"
                  >
                    Manage
                  </button>
                ) : person.lifecycleStatus !== "TERMINATED" ? (
                  <button
                    onClick={() => setShowInitiateOffboard(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#007bff] px-2.5 py-1.5 rounded-lg hover:bg-blue-600"
                  >
                    <LogOut size={12} /> Start offboarding
                  </button>
                ) : null)
              }
            >
              {offboardCase ? (
                <div className="flex items-center justify-between text-sm border border-slate-100 rounded-lg px-3 py-2.5">
                  <span className="text-slate-700">Started {formatDate(offboardCase.initiatedAt)}</span>
                  <StatusBadge value={offboardCase.stage} />
                </div>
              ) : (
                <Empty text="Not being offboarded." />
              )}
            </SectionCard>
          </div>
        </div>
      </main>

      {showEdit && (
        <PersonFormModal
          person={person}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setShowEdit(false);
            setPerson(updated);
          }}
        />
      )}

      {showBgvEdit && (
        <BgvFormModal
          check={latestBgv}
          person={person}
          onClose={() => setShowBgvEdit(false)}
          onSaved={(check) => {
            setShowBgvEdit(false);
            setBgv((prev) => [check, ...prev.slice(latestBgv ? 1 : 0)]);
          }}
        />
      )}

      {docTypeEdit && (
        <DocumentAcceptanceFormModal
          policyType={docTypeEdit}
          person={person}
          acceptance={policies.find((p) => p.policyType === docTypeEdit) || null}
          onClose={() => setDocTypeEdit(null)}
          onSaved={(saved) => {
            setDocTypeEdit(null);
            setPolicies((prev) => {
              const exists = prev.some((p) => p.id === saved.id);
              return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
            });
          }}
        />
      )}

      {showAddTraining && (
        <TrainingFormModal
          persons={[person]}
          onClose={() => setShowAddTraining(false)}
          onSaved={(created) => {
            setShowAddTraining(false);
            setTraining((prev) => [created, ...prev]);
          }}
        />
      )}

      {trainingEdit && (
        <TrainingFormModal
          persons={[person]}
          training={trainingEdit}
          onClose={() => setTrainingEdit(null)}
          onSaved={(saved) => {
            setTrainingEdit(null);
            setTraining((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
          }}
        />
      )}

      {ticketCategory && (
        <CreateTicketModal
          category={ticketCategory}
          persons={[person]}
          onClose={() => setTicketCategory(null)}
          onCreated={(created) => {
            setTicketCategory(null);
            setTickets((prev) => [created, ...prev]);
          }}
        />
      )}

      {showInitiateOffboard && (
        <InitiateOffboardingModal
          persons={[person]}
          onClose={() => setShowInitiateOffboard(false)}
          onCreated={(created) => {
            setShowInitiateOffboard(false);
            setOffboardCase(created);
            setPerson((prev) => ({ ...prev, activeOffboardingCaseId: created.id, lifecycleStatus: "OFFBOARDING" }));
          }}
        />
      )}

      {showManageOffboard && offboardCase && (
        <OffboardingCaseDetail
          offboardingCase={offboardCase}
          person={person}
          canEdit={canEdit}
          onClose={() => setShowManageOffboard(false)}
          onUpdated={(updated) => {
            setOffboardCase(updated);
            if (updated.stage === "COMPLETE") {
              setPerson((prev) => ({ ...prev, activeOffboardingCaseId: null, lifecycleStatus: "TERMINATED" }));
              setShowManageOffboard(false);
            }
          }}
        />
      )}
    </div>
  );
}

function SectionCard({ title, icon: Icon, action, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={16} className="text-slate-400" />}
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function StepPanel({ title, icon: Icon, action, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={18} className="text-slate-400" />}
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return <p className="text-sm text-slate-400">{text}</p>;
}
