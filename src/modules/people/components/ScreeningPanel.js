"use client";
import React, { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, UploadCloud } from "lucide-react";
import { listPersons, listBackgroundChecksForPerson, initiateBackgroundCheck, refreshBackgroundCheck } from "../services/peopleApi";
import StatusBadge from "./StatusBadge";
import BgvFormModal from "./BgvFormModal";
import { formatDate } from "../utils/peopleFormat";

/** No bulk "list all background checks" endpoint exists on the backend
 * (BackgroundCheckController only exposes GET .../person/{id} and GET .../{id}),
 * so this view is built by listing persons and fetching each one's checks —
 * the same shape the "screening" requirement in the architecture doc describes
 * ("accessible from this module"), just assembled client-side. */
export default function ScreeningPanel({ canEdit }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // { person, check }

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const persons = await listPersons();
      const checks = await Promise.all(
        (persons || []).map((p) => listBackgroundChecksForPerson(p.id).catch(() => [])),
      );
      setRows(
        (persons || []).map((p, i) => ({
          person: p,
          check: (checks[i] || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] || null,
        })),
      );
    } catch (err) {
      setError(err.message || "Couldn't load screening status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const initiate = async (person) => {
    setBusyId(person.id);
    try {
      const check = await initiateBackgroundCheck(person.id, person.name, person.email);
      setRows((prev) => prev.map((r) => (r.person.id === person.id ? { ...r, check } : r)));
    } catch (err) {
      setError(err.message || "Couldn't initiate the background check.");
    } finally {
      setBusyId(null);
    }
  };

  const refresh = async (row) => {
    setBusyId(row.person.id);
    try {
      const check = await refreshBackgroundCheck(row.check.id);
      setRows((prev) => prev.map((r) => (r.person.id === row.person.id ? { ...r, check } : r)));
    } catch (err) {
      setError(err.message || "Couldn't refresh from the vendor.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          Background-verification status per person — initiated with the connected BGV vendor where
          one is configured, otherwise recorded manually by HR.
        </p>
        <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
          {error.toLowerCase().includes("framework") && (
            <span className="block mt-1 text-rose-500">
              Background checks aren't required for this tenant's currently selected framework.
            </span>
          )}
        </div>
      )}

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Person</th>
              <th className="text-left font-semibold px-4 py-3">Status</th>
              <th className="text-left font-semibold px-4 py-3">Vendor / source</th>
              <th className="text-left font-semibold px-4 py-3">Checked</th>
              <th className="text-right font-semibold px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading…</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">No one in the directory yet.</td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr key={row.person.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{row.person.name}</div>
                    <div className="text-xs text-slate-400">{row.person.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {row.check ? <StatusBadge value={row.check.status} /> : <StatusBadge value={null} label="Not started" />}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.check ? row.check.vendor || "Manual" : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.check ? formatDate(row.check.checkedAt) : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {canEdit && !row.check && (
                      <button
                        onClick={() => initiate(row.person)}
                        disabled={busyId === row.person.id}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#007bff] px-3 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-60"
                      >
                        <ShieldCheck size={13} /> Initiate
                      </button>
                    )}
                    {canEdit && row.check && (
                      <div className="inline-flex items-center gap-2">
                        {row.check.source === "VENDOR_SYNCED" ? (
                          <button
                            onClick={() => refresh(row)}
                            disabled={busyId === row.person.id}
                            className="text-xs font-medium text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50"
                          >
                            Refresh
                          </button>
                        ) : null}
                        <button
                          onClick={() => setEditTarget(row)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50"
                        >
                          <UploadCloud size={13} /> Update
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {editTarget && (
        <BgvFormModal
          check={editTarget.check}
          person={editTarget.person}
          onClose={() => setEditTarget(null)}
          onSaved={(check) => {
            setEditTarget(null);
            setRows((prev) => prev.map((r) => (r.person.id === editTarget.person.id ? { ...r, check } : r)));
          }}
        />
      )}
    </div>
  );
}
