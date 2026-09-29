"use client";
import React, { useEffect, useState } from "react";
import { RefreshCw, LogOut, Plus } from "lucide-react";
import { listOffboardingCases, listPersons } from "../services/peopleApi";
import StatusBadge from "./StatusBadge";
import InitiateOffboardingModal from "./InitiateOffboardingModal";
import OffboardingCaseDetail from "./OffboardingCaseDetail";
import { formatDate } from "../utils/peopleFormat";

export default function OffboardingList({ canEdit }) {
  const [cases, setCases] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInitiate, setShowInitiate] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [c, p] = await Promise.all([listOffboardingCases(), listPersons()]);
      setCases(Array.isArray(c) ? c : []);
      setPersons(Array.isArray(p) ? p : []);
    } catch (err) {
      setError(err.message || "Couldn't load offboarding cases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const personFor = (id) => persons.find((p) => p.id === id);

  // Only people not already mid-offboarding can have a new case started —
  // mirrors the backend's 409 in OffboardingService.initiate.
  const eligiblePersons = persons.filter((p) => !p.activeOffboardingCaseId && p.lifecycleStatus !== "TERMINATED");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          Offboarding is tracked as STARTED → ACCOUNTS_REVIEWED → ACCOUNTS_DEACTIVATED → COMPLETE —
          every linked account has to be reviewed and, where flagged, deactivated before a case can advance.
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            <RefreshCw size={14} /> Refresh
          </button>
          {canEdit && (
            <button
              onClick={() => setShowInitiate(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-[#007bff] rounded-lg hover:bg-blue-600"
            >
              <Plus size={16} /> Start offboarding
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Person</th>
              <th className="text-left font-semibold px-4 py-3">Stage</th>
              <th className="text-left font-semibold px-4 py-3">Accounts</th>
              <th className="text-left font-semibold px-4 py-3">Initiated</th>
              <th className="text-left font-semibold px-4 py-3">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading…</td>
              </tr>
            )}
            {!loading && cases.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  <LogOut size={24} className="mx-auto mb-2 text-slate-300" />
                  No offboarding cases yet.
                </td>
              </tr>
            )}
            {!loading &&
              cases.map((c) => {
                const person = personFor(c.personId);
                const reviewed = (c.linkedAccounts || []).filter((a) => a.status !== "PENDING_REVIEW").length;
                return (
                  <tr key={c.id} onClick={() => setSelectedCase(c)} className="hover:bg-slate-50 cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{person?.name || c.personId}</div>
                      <div className="text-xs text-slate-400">{person?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={c.stage} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {reviewed}/{(c.linkedAccounts || []).length} reviewed
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(c.initiatedAt)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{(c.taskRefIds || [])[0] || "—"}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {showInitiate && (
        <InitiateOffboardingModal
          persons={eligiblePersons}
          onClose={() => setShowInitiate(false)}
          onCreated={(created) => {
            setShowInitiate(false);
            setCases((prev) => [created, ...prev]);
            setPersons((prev) =>
              prev.map((p) => (p.id === created.personId ? { ...p, activeOffboardingCaseId: created.id, lifecycleStatus: "OFFBOARDING" } : p)),
            );
          }}
        />
      )}

      {selectedCase && (
        <OffboardingCaseDetail
          offboardingCase={selectedCase}
          person={personFor(selectedCase.personId)}
          canEdit={canEdit}
          onClose={() => setSelectedCase(null)}
          onUpdated={(updated) => {
            setSelectedCase(updated);
            setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            if (updated.stage === "COMPLETE") {
              setPersons((prev) =>
                prev.map((p) => (p.id === updated.personId ? { ...p, activeOffboardingCaseId: null, lifecycleStatus: "TERMINATED" } : p)),
              );
            }
          }}
        />
      )}
    </div>
  );
}
