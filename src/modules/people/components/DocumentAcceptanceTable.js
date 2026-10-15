"use client";
import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, ExternalLink, FileDown, Plus } from "lucide-react";
import { listPersons, listPolicyAcceptances } from "../services/peopleApi";
import StatusBadge from "./StatusBadge";
import DocumentAcceptanceFormModal from "./DocumentAcceptanceFormModal";
import { formatDate } from "../utils/peopleFormat";
import { documentDownloadUrl } from "../services/peopleApi";

/**
 * policyType: TERMS_OF_EMPLOYMENT | NDA | POST_TERMINATION
 * restrictToLinkedUsers: true only for TERMS_OF_EMPLOYMENT — "table showcasing
 * all employees (only those registered on our website)", per the requirements
 * doc and PolicyAcceptance's javadoc.
 */
export default function DocumentAcceptanceTable({ policyType, title, description, canEdit, restrictToLinkedUsers }) {
  const [persons, setPersons] = useState([]);
  const [acceptances, setAcceptances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editTarget, setEditTarget] = useState(null); // { person, acceptance | null }

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [p, a] = await Promise.all([listPersons(), listPolicyAcceptances(policyType)]);
      setPersons(p || []);
      setAcceptances(a || []);
    } catch (err) {
      setError(err.message || "Couldn't load this table.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [policyType]);

  const rows = useMemo(() => {
    const byPerson = new Map();
    acceptances.forEach((a) => {
      const existing = byPerson.get(a.personId);
      if (!existing || new Date(a.updatedAt) > new Date(existing.updatedAt)) {
        byPerson.set(a.personId, a);
      }
    });
    return (persons || [])
      .filter((p) => !restrictToLinkedUsers || !!p.linkedUserId)
      .map((p) => ({ person: p, acceptance: byPerson.get(p.id) || null }));
  }, [persons, acceptances, restrictToLinkedUsers]);

  return (
    <div>
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
          {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 flex-shrink-0">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Employee</th>
              <th className="text-left font-semibold px-4 py-3">Status</th>
              <th className="text-left font-semibold px-4 py-3">Version</th>
              <th className="text-left font-semibold px-4 py-3">Accepted on</th>
              <th className="text-left font-semibold px-4 py-3">Document</th>
              <th className="text-right font-semibold px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading…</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  {restrictToLinkedUsers ? "No registered app users yet." : "No one in the directory yet."}
                </td>
              </tr>
            )}
            {!loading &&
              rows.map(({ person, acceptance }) => (
                <tr key={person.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{person.name}</div>
                    <div className="text-xs text-slate-400">{person.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      value={acceptance?.accepted}
                      label={acceptance?.accepted ? "Accepted" : "Not accepted"}
                      style={
                        acceptance?.accepted
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{acceptance?.version || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(acceptance?.acceptedAt)}</td>
                  <td className="px-4 py-3">
                    {acceptance?.documentSource === "HRMS_LINK" && acceptance?.documentUrl && (
                      <a href={acceptance.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                        <ExternalLink size={13} /> Open in HRMS
                      </a>
                    )}
                    {acceptance?.documentSource === "MANUAL_UPLOAD" && acceptance?.documentFileId && (
                      <a href={documentDownloadUrl(acceptance.documentFileId)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                        <FileDown size={13} /> Download copy
                      </a>
                    )}
                    {!acceptance?.documentSource && <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canEdit && (
                      <button
                        onClick={() => setEditTarget({ person, acceptance })}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50"
                      >
                        <Plus size={13} /> {acceptance ? "Update" : "Record"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <DocumentAcceptanceFormModal
          policyType={policyType}
          person={editTarget.person}
          acceptance={editTarget.acceptance}
          onClose={() => setEditTarget(null)}
          onSaved={(saved) => {
            setEditTarget(null);
            setAcceptances((prev) => {
              const withoutOld = prev.filter((a) => a.id !== saved.id);
              return [...withoutOld, saved];
            });
          }}
        />
      )}
    </div>
  );
}
