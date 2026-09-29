"use client";
import React, { useEffect, useState } from "react";
import { X, CheckCircle2, XCircle, Power, ArrowRight, Check, AlertTriangle } from "lucide-react";
import {
  reviewOffboardingAccount,
  deactivateOffboardingAccount,
  markOffboardingAccountsReviewed,
  markOffboardingAccountsDeactivated,
  completeOffboarding,
} from "../services/peopleApi";
import StatusBadge from "./StatusBadge";
import PersonAvatar from "./PersonAvatar";
import { formatDateTime } from "../utils/peopleFormat";

const STAGES = [
  { key: "STARTED", label: "Started" },
  { key: "ACCOUNTS_REVIEWED", label: "Access reviewed" },
  { key: "ACCOUNTS_DEACTIVATED", label: "Access removed" },
  { key: "COMPLETE", label: "Complete" },
];

export default function OffboardingCaseDetail({ offboardingCase, person, canEdit, onClose, onUpdated }) {
  const [c, setC] = useState(offboardingCase);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const apply = (fn) => async (...args) => {
    setBusy(true);
    setError("");
    try {
      const updated = await fn(...args);
      setC(updated);
      onUpdated(updated);
    } catch (err) {
      setError(err.message || "That didn't go through.");
    } finally {
      setBusy(false);
    }
  };

  const review = apply((account, decision) =>
    reviewOffboardingAccount(c.id, {
      system: account.system,
      accountIdentifier: account.accountIdentifier,
      decision,
    }),
  );
  const deactivate = apply((account) =>
    deactivateOffboardingAccount(c.id, { system: account.system, accountIdentifier: account.accountIdentifier }),
  );
  const advanceReviewed = apply(() => markOffboardingAccountsReviewed(c.id));
  const advanceDeactivated = apply(() => markOffboardingAccountsDeactivated(c.id));
  const complete = apply(() => completeOffboarding(c.id));

  const accounts = c.linkedAccounts || [];
  // No systems listed means nothing to review, so the case must still be able to move on.
  const allReviewed = accounts.every((a) => a.status !== "PENDING_REVIEW");
  const stageIndex = STAGES.findIndex((s) => s.key === c.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div role="dialog" aria-modal="true" aria-label="Manage offboarding" className="w-full max-w-2xl bg-white max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 rounded-t-2xl px-6 py-4 flex items-start justify-between z-10">
          <div className="flex items-center gap-3 min-w-0">
            <PersonAvatar name={person?.name || "?"} size={40} />
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 text-base truncate">Offboarding · {person?.name || c.personId}</h3>
              <p className="text-[13px] text-slate-500 truncate">{person?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Progress */}
          <div className="flex items-start">
            {STAGES.map((s, i) => {
              const done = i < stageIndex || c.stage === "COMPLETE";
              const current = i === stageIndex && c.stage !== "COMPLETE";
              return (
                <React.Fragment key={s.key}>
                  <div className="flex flex-col items-center gap-1.5 w-24 flex-shrink-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        done
                          ? "bg-blue-600 text-white"
                          : current
                            ? "bg-white border-2 border-blue-600 text-blue-600"
                            : "border-[1.5px] border-slate-200 text-slate-400"
                      }`}
                    >
                      {done ? <Check size={14} /> : i + 1}
                    </div>
                    <span
                      className={`text-[11px] text-center leading-tight ${
                        current ? "text-slate-800 font-semibold" : done ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className={`flex-1 h-0.5 mt-3.5 rounded-full ${i < stageIndex || c.stage === "COMPLETE" ? "bg-blue-600" : "bg-slate-200"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {c.notes && (
            <div className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">{c.notes}</div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Account checklist */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Access checklist</h4>
            <p className="text-xs text-slate-400 mb-3">Decide what happens to each system this person can log into.</p>
            {accounts.length === 0 ? (
              <p className="text-sm text-slate-400">No systems were listed for this person.</p>
            ) : (
              <ul className="space-y-2">
                {accounts.map((a, idx) => (
                  <li
                    key={`${a.system}-${a.accountIdentifier}-${idx}`}
                    className="border border-slate-200 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm min-w-0">
                        <span className="font-medium text-slate-800">{a.system}</span>
                        {a.accountIdentifier && <span className="text-slate-400"> · {a.accountIdentifier}</span>}
                      </div>
                      <StatusBadge value={a.status} />
                    </div>

                    {canEdit && c.stage === "STARTED" && a.status === "PENDING_REVIEW" && (
                      <div className="flex gap-2 mt-3">
                        <button
                          disabled={busy}
                          onClick={() => review(a, "KEEP")}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 border border-slate-200 bg-white px-2.5 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-60"
                        >
                          <CheckCircle2 size={13} /> Keep access
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => review(a, "DEACTIVATE")}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 border border-amber-200 bg-amber-50 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 disabled:opacity-60"
                        >
                          <XCircle size={13} /> Remove access
                        </button>
                      </div>
                    )}

                    {canEdit && a.status === "REVIEWED_DEACTIVATE" && (
                      <button
                        disabled={busy}
                        onClick={() => deactivate(a)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-900 mt-3 disabled:opacity-60"
                      >
                        <Power size={13} /> Mark as removed
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="text-xs text-slate-400">
            Started {formatDateTime(c.initiatedAt)}
            {c.completedAt ? ` · Completed ${formatDateTime(c.completedAt)}` : ""}
          </div>

          {/* Next step */}
          {canEdit && c.stage !== "COMPLETE" && (
            <div className="pt-4 border-t border-slate-100">
              {c.stage === "STARTED" && (
                <button
                  disabled={busy || !allReviewed}
                  onClick={advanceReviewed}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#007bff] px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-40"
                >
                  All systems reviewed <ArrowRight size={14} />
                </button>
              )}
              {c.stage === "ACCOUNTS_REVIEWED" && (
                <button
                  disabled={busy}
                  onClick={advanceDeactivated}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#007bff] px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-40"
                >
                  All flagged access removed <ArrowRight size={14} />
                </button>
              )}
              {c.stage === "ACCOUNTS_DEACTIVATED" && (
                <button
                  disabled={busy}
                  onClick={complete}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-40"
                >
                  Complete offboarding <CheckCircle2 size={14} />
                </button>
              )}
              {c.stage === "STARTED" && !allReviewed && (
                <p className="text-xs text-slate-400 mt-2">Every system needs a decision before you can move on.</p>
              )}
            </div>
          )}
          {c.stage === "COMPLETE" && (
            <div className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <CheckCircle2 size={15} /> Offboarding complete — access removal is fully recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
