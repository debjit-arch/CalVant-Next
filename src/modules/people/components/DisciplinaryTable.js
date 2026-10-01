"use client";
import React, { useState } from "react";
import { ExternalLink, Eye, AlertTriangle } from "lucide-react";
import { updateTicketStatus } from "../services/peopleApi";
import StatusBadge from "./StatusBadge";
import CreateTicketModal from "./CreateTicketModal";
import DisciplinaryViewModal from "./DisciplinaryViewModal";
import { TicketListHeader, useTicketList, refCell } from "./ticketShared";
import { formatDateTime } from "../utils/peopleFormat";

/** Disciplinary actions — its own section: form with "action taken", plus a View button per case. */
export default function DisciplinaryTable({ title, description, canEdit }) {
  const category = "DISCIPLINARY";
  const { tickets, setTickets, persons, loading, refreshing, error, setError, pullLatest, replaceTicket } =
    useTicketList(category);
  const [showCreate, setShowCreate] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);

  const personFor = (id) => persons.find((p) => p.id === id);

  const resolve = async (ticket) => {
    const summary = window.prompt("Resolution summary (how was this handled?)");
    if (summary === null) return;
    setResolvingId(ticket.id);
    try {
      replaceTicket(await updateTicketStatus(ticket.id, "RESOLVED", summary));
    } catch (err) {
      setError(err.message || "Couldn't update this case.");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div>
      <TicketListHeader
        title={title}
        description={description}
        onPull={pullLatest}
        refreshing={refreshing}
        canEdit={canEdit}
        onLog={() => setShowCreate(true)}
        logLabel="Log case"
      />

      {error && <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Ref</th>
              <th className="text-left font-semibold px-4 py-3">Summary</th>
              <th className="text-left font-semibold px-4 py-3">Person</th>
              <th className="text-left font-semibold px-4 py-3">Action taken</th>
              <th className="text-left font-semibold px-4 py-3">Status</th>
              <th className="text-left font-semibold px-4 py-3">Logged</th>
              <th className="text-left font-semibold px-4 py-3">Source</th>
              <th className="text-right font-semibold px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            )}
            {!loading && tickets.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  <AlertTriangle size={22} className="mx-auto mb-2 text-slate-300" />
                  No disciplinary cases logged yet.
                </td>
              </tr>
            )}
            {!loading &&
              tickets.map((t) => {
                const person = personFor(t.personId);
                const open = t.status !== "RESOLVED" && t.status !== "CLOSED" && t.status !== "COMPLETED";
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">{refCell(t)}</td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800">{t.summary}</div>
                      {t.resolutionSummary && <div className="text-xs text-slate-400 mt-0.5">Resolution: {t.resolutionSummary}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{person?.name || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[220px]">
                      <div className="truncate" title={t.actionTaken || ""}>{t.actionTaken || "—"}</div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge value={t.status} /></td>
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
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setViewing(t)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50"
                        >
                          <Eye size={13} /> View
                        </button>
                        {canEdit && t.source === "MANUAL" && open && (
                          <button
                            onClick={() => resolve(t)}
                            disabled={resolvingId === t.id}
                            className="text-xs font-medium text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-60"
                          >
                            Mark resolved
                          </button>
                        )}
                      </div>
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
      {viewing && <DisciplinaryViewModal ticket={viewing} person={personFor(viewing.personId)} onClose={() => setViewing(null)} />}
    </div>
  );
}
