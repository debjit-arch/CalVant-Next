"use client";
import React from "react";
import DisciplinaryTable from "./DisciplinaryTable";
import EventLogTable from "./EventLogTable";

/**
 * Thin switch kept so existing callers (PeopleSection, TicketsPage) don't change.
 * Disciplinary actions and the Event log are separate sections with their own tables,
 * forms and actions — they only share the same backend endpoint, split by category.
 *
 * category: DISCIPLINARY | SECURITY_EVENT
 */
export default function TicketsTable(props) {
  return props.category === "SECURITY_EVENT" ? <EventLogTable {...props} /> : <DisciplinaryTable {...props} />;
}
