"use client";
import React from "react";
import { ExternalLink } from "lucide-react";
import ModalShell, { Section } from "./ModalShell";
import StatusBadge from "./StatusBadge";
import { formatDateTime } from "../utils/peopleFormat";

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <div className="text-slate-500">{label}</div>
      <div className="col-span-2 text-slate-800 break-words">{children}</div>
    </div>
  );
}

const Text = ({ value, empty }) =>
  value ? <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{value}</p> : <p className="text-sm text-slate-400">{empty}</p>;

/** Read-only view of everything that was filled in on the disciplinary form. */
export default function DisciplinaryViewModal({ ticket, person, onClose, hideStatus = false }) {
  const synced = ticket.source === "TICKETING_SYNCED";
  return (
    <ModalShell
      title="Disciplinary case"
      subtitle={ticket.ticketRefId || undefined}
      onClose={onClose}
      maxWidth="max-w-lg"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          Close
        </button>
      }
    >
      <Section title="Details">
        <div className="space-y-2.5">
          <Row label="Reference">{ticket.ticketRefId || "—"}</Row>
          <Row label="Person">{person ? `${person.name}${person.email ? ` — ${person.email}` : ""}` : "Not tied to a specific person"}</Row>
          {!hideStatus && <Row label="Status"><StatusBadge value={ticket.status} /></Row>}
          <Row label="Logged">{formatDateTime(ticket.createdAt)}</Row>
          <Row label="Source">
            {synced ? (
              ticket.ticketUrl ? (
                <a href={ticket.ticketUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                  <ExternalLink size={13} /> {ticket.ticketSystem || "Ticketing system"}
                </a>
              ) : (
                ticket.ticketSystem || "Ticketing system"
              )
            ) : (
              "Tracked in CalVant"
            )}
          </Row>
        </div>
      </Section>

      <Section title="What happened">
        <Text value={ticket.summary} empty="—" />
      </Section>

      <Section title="Disciplinary action taken">
        <Text value={ticket.actionTaken} empty="No action recorded." />
      </Section>

      {(ticket.resolutionSummary || ticket.resolvedAt) && (
        <Section title="Resolution">
          <Text value={ticket.resolutionSummary} empty="—" />
          {ticket.resolvedAt && <p className="text-xs text-slate-400 mt-1">Resolved {formatDateTime(ticket.resolvedAt)}</p>}
        </Section>
      )}
    </ModalShell>
  );
}
