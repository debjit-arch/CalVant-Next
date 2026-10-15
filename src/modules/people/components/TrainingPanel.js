"use client";
import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, GraduationCap, Plus } from "lucide-react";
import { listTraining, listPersons } from "../services/peopleApi";
import StatusBadge from "./StatusBadge";
import TrainingFormModal from "./TrainingFormModal";
import { humanize } from "../utils/peopleFormat";

const CATEGORIES = ["ALL", "SECURITY", "PRIVACY", "AI"];

export default function TrainingPanel({ canEdit }) {
  const [records, setRecords] = useState([]);
  const [persons, setPersons] = useState([]);
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async (cat) => {
    setLoading(true);
    setError("");
    try {
      const [r, p] = await Promise.all([listTraining(cat === "ALL" ? undefined : cat), listPersons()]);
      setRecords(Array.isArray(r) ? r : []);
      setPersons(p || []);
    } catch (err) {
      setError(err.message || "Couldn't load training records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const personFor = (id) => persons.find((p) => p.id === id);

  const summary = useMemo(() => {
    const total = records.length;
    const completed = records.filter((r) => r.status === "COMPLETED").length;
    const avgAttendance =
      records.length === 0
        ? null
        : Math.round(
            records.reduce((sum, r) => sum + (r.attendancePercent || 0), 0) / records.length,
          );
    return { total, completed, avgAttendance };
  }, [records]);

  return (
    <div>
      <div className="flex items-start justify-between mb-4 gap-4">
        <p className="text-sm text-slate-500 max-w-lg">
          Attendance and completion for courses relevant to security, data privacy and AI — pulled from
          the connected LMS where available, or recorded manually.
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => load(category)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            <RefreshCw size={14} /> Refresh
          </button>
          {canEdit && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-[#007bff] rounded-lg hover:bg-blue-600"
            >
              <Plus size={16} /> Add record
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard label="Records" value={summary.total} />
        <StatCard label="Completed" value={summary.completed} />
        <StatCard label="Avg. attendance" value={summary.avgAttendance != null ? `${summary.avgAttendance}%` : "—"} />
      </div>

      <div className="flex gap-1 mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              category === c ? "bg-[#007bff] text-white border-[#007bff]" : "text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {c === "ALL" ? "All" : humanize(c)}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Person</th>
              <th className="text-left font-semibold px-4 py-3">Course</th>
              <th className="text-left font-semibold px-4 py-3">Category</th>
              <th className="text-left font-semibold px-4 py-3">Attendance</th>
              <th className="text-left font-semibold px-4 py-3">Status</th>
              <th className="text-left font-semibold px-4 py-3">Source</th>
              {canEdit && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading…</td>
              </tr>
            )}
            {!loading && records.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  <GraduationCap size={22} className="mx-auto mb-2 text-slate-300" />
                  No training records for this category yet.
                </td>
              </tr>
            )}
            {!loading &&
              records.map((r) => {
                const person = personFor(r.personId);
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{person?.name || r.personId}</div>
                      <div className="text-xs text-slate-400">{person?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.courseName}</td>
                    <td className="px-4 py-3 text-slate-600">{humanize(r.category)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.attendancePercent != null ? `${r.attendancePercent}%` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={r.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {r.source === "LMS_SYNCED" ? r.lmsProvider || "LMS" : "Manual"}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        {r.source !== "LMS_SYNCED" && (
                          <button
                            onClick={() => setEditing(r)}
                            className="text-xs font-medium text-slate-600 border border-slate-200 bg-white px-2.5 py-1.5 rounded-lg hover:bg-slate-50"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {editing && (
        <TrainingFormModal
          persons={persons}
          training={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null);
            setRecords((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
          }}
        />
      )}

      {showCreate && (
        <TrainingFormModal
          persons={persons}
          onClose={() => setShowCreate(false)}
          onSaved={(created) => {
            setShowCreate(false);
            setRecords((prev) => [created, ...prev]);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="border border-slate-200 rounded-xl px-4 py-3 bg-white">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-xl font-semibold text-slate-800 mt-0.5">{value}</div>
    </div>
  );
}
