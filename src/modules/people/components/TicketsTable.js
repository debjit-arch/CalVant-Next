"use client";
import React, { useEffect, useState } from "react";
import { RefreshCw, ExternalLink, Plus, AlertTriangle } from "lucide-react";
import { listTickets, refreshTickets, listPersons, updateTicketStatus } from "../services/peopleApi";
import StatusBadge from "./StatusBadge";
import CreateTicketModal from "./CreateTicketModal";
import { formatDateTime } from "../utils/peopleFormat";

/** category: DISCIPLINARY | SECURITY_EVENT */
export default function TicketsTable({ category, title, description, canEdit }) {
  const [tickets, setTickets] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [t, p] = await Promise.all([listTickets(category), listPersons()]);
      setTickets(
        (Array.isArray(t) ? t : []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      );
      setPersons(p || []);
    } catch (err) {
      setError(err.message || "Couldn't load this list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [category]);

  const personFor = (id) => persons.find((p) => p.id === id);

  const pullLatest = async () => {
    setRefreshing(true);
    setError("");
    try {
      await refreshTickets(category);
      await load();
    } catch (err) {
      setError(err.message || "Couldn't pull the latest status.");
    } finally {
      setRefreshing(false);
    }
  };

  const resolve = async (ticket) => {
    const summary = window.prompt("Resolution summary (how was this handled?)");
    if (summary === null) return;
    setResolvingId(ticket.id);
    try {
      const updated = await updateTicketStatus(ticket.id, "RESOLVED", summary);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(err.message || "Couldn't update this ticket.");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
          {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={pullLatest} disabled={refreshing} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Pull latest
          </button>
          {canEdit && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-[#007bff] rounded-lg hover:bg-blue-600"
            >
              <Plus size={16} /> Log ticket
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
              <th className="text-left font-semibold px-4 py-3">Summary</th>
              <th className="text-left font-semibold px-4 py-3">Person</th>
              <th className="text-left font-semibold px-4 py-3">Status</th>
              <th className="text-left font-semibold px-4 py-3">Logged</th>
              <th className="text-left font-semibold px-4 py-3">Source</th>
              <th className="text-right font-semibold px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading…</td>
              </tr>
            )}
            {!loading && tickets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  <AlertTriangle size={22} className="mx-auto mb-2 text-slate-300" />
                  Nothing logged yet.
                </td>
              </tr>
            )}
            {!loading &&
              tickets.map((t) => {
                const person = personFor(t.personId);
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="text-slate-800">{t.summary}</div>
                      {t.resolutionSummary && (
                        <div className="text-xs text-slate-400 mt-0.5">Resolution: {t.resolutionSummary}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{person?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge value={t.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(t.createdAt)}</td>
                    <td className="px-4 py-3">
                      {t.source === "TICKETING_SYNCED" ? (
                        t.ticketUrl ? (
                          <a href={t.ticketUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                            <ExternalLink size={13} /> {t.ticketSystem || "Ticketing system"}
                          </a>
                        ) : (
                          <span className="text-slate-500">{t.ticketSystem || "Ticketing system"}</span>
                        )
                      ) : (
                        <span className="text-slate-500">Tracked in CalVant</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canEdit && t.source === "MANUAL" && t.status !== "RESOLVED" && t.status !== "CLOSED" && (
                        <button
                          onClick={() => resolve(t)}
                          disabled={resolvingId === t.id}
                          className="text-xs font-medium text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-60"
                        >
                          Mark resolved
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateTicketModal
          category={category}
          persons={persons}
          onClose={() => setShowCreate(false)}
          onCreated={(created) => {
            setShowCreate(false);
            setTickets((prev) => [created, ...prev]);
          }}
        />
      )}
    </div>
  );
}
