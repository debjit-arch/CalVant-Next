"use client";
import React, { useState } from "react";
import { ExternalLink, ListChecks, AlertTriangle } from "lucide-react";
import { updateTicketStatus } from "../services/peopleApi";
import StatusBadge from "./StatusBadge";
import CreateTicketModal from "./CreateTicketModal";
import EventLogTasksModal from "./EventLogTasksModal";
import { TicketListHeader, useTicketList, refCell } from "./ticketShared";
import { formatDateTime, ticketDisplayStatus } from "../utils/peopleFormat";

/** Event log — its own section: each entry carries tasks; completing them completes the entry. */
export default function EventLogTable({ title, description, canEdit }) {
  const category = "SECURITY_EVENT";
  const { tickets, setTickets, persons, loading, refreshing, error, setError, pullLatest, replaceTicket } =
    useTicketList(category);
  const [showCreate, setShowCreate] = useState(false);
  const [managing, setManaging] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);

  const personFor = (id) => persons.find((p) => p.id === id);

  // Only for an entry with no tasks — once tasks exist, they decide the status.
  const completeManually = async (ticket) => {
    const summary = window.prompt("Resolution summary (how was this handled?)");
    if (summary === null) return;
    setResolvingId(ticket.id);
    try {
      replaceTicket(await updateTicketStatus(ticket.id, "COMPLETED", summary));
    } catch (err) {
      setError(err.message || "Couldn't update this event.");
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
        logLabel="Log event"
      />

      {error && <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Ref</th>
              <th className="text-left font-semibold px-4 py-3">Event</th>
              <th className="text-left font-semibold px-4 py-3">Person</th>
              <th className="text-left font-semibold px-4 py-3">Tasks</th>
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
                  No events logged yet.
                </td>
              </tr>
            )}
            {!loading &&
              tickets.map((t) => {
                const person = personFor(t.personId);
                const total = t.tasksTotal || 0;
                const done = t.tasksCompleted || 0;
                const open = t.status !== "RESOLVED" && t.status !== "CLOSED" && t.status !== "COMPLETED";
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">{refCell(t)}</td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800">{t.summary}</div>
                      {t.resolutionSummary && <div className="text-xs text-slate-400 mt-0.5">Resolution: {t.resolutionSummary}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{person?.name || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {total === 0 ? (
                        <span className="text-slate-400">No tasks</span>
                      ) : (
                        <span className={`text-xs font-semibold ${done === total ? "text-emerald-600" : "text-slate-600"}`}>
                          {done}/{total} done
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge value={ticketDisplayStatus(t)} /></td>
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
                          onClick={() => setManaging(t)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50"
                        >
                          <ListChecks size={13} /> {canEdit ? "Tasks" : "View tasks"}
                        </button>
                        {canEdit && t.source === "MANUAL" && open && total === 0 && (
                          <button
                            onClick={() => completeManually(t)}
                            disabled={resolvingId === t.id}
                            className="text-xs font-medium text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-60"
                          >
                            Mark completed
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
          onCreated={(created, info) => {
            setShowCreate(false);
            setTickets((prev) => [created, ...prev]);
            // Only open the Tasks popup when no task was added in the form, or some failed.
            if (!created.tasksTotal || info?.failed) setManaging(created);
          }}
        />
      )}
      {managing && (
        <EventLogTasksModal
          ticket={managing}
          persons={persons}
          canEdit={canEdit}
          onClose={() => setManaging(null)}
          onChanged={replaceTicket}
        />
      )}
    </div>
  );
}
