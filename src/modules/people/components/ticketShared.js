"use client";
import React, { useEffect, useState } from "react";
import { RefreshCw, Plus } from "lucide-react";
import { listTickets, refreshTickets, listPersons, listOrgUsers } from "../services/peopleApi";
import { useEffectiveOrg } from "@/hooks/useEffectiveOrg";
import { getDepartments } from "@/modules/departments/services/userService";

/** Loads one category's tickets + the people list. Shared by DisciplinaryTable and EventLogTable. */
export function useTicketList(category) {
  const [tickets, setTickets] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [t, p] = await Promise.all([listTickets(category), listPersons()]);
      setTickets((Array.isArray(t) ? t : []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setPersons(p || []);
    } catch (err) {
      setError(err.message || "Couldn't load this list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

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

  /** Replace one row in place (after a status change, or a task change on an Event Log entry). */
  const replaceTicket = (updated) =>
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

  return { tickets, setTickets, persons, loading, refreshing, error, setError, pullLatest, replaceTicket };
}

export function TicketListHeader({ title, description, onPull, refreshing, canEdit, onLog, logLabel }) {
  return (
    <div className="flex items-start justify-between mb-4 gap-4">
      <div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onPull}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Pull latest
        </button>
        {canEdit && (
          <button
            onClick={onLog}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-[#007bff] rounded-lg hover:bg-blue-600"
          >
            <Plus size={16} /> {logLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/** "Open" / "In Progress" / "Completed" (task-service wording) → the keys StatusBadge colours by. */
export const statusKey = (s) => String(s || "").trim().toUpperCase().replace(/[\s-]+/g, "_");

export const refCell = (t) =>
  t.ticketRefId ? <span className="font-mono text-xs text-slate-600">{t.ticketRefId}</span> : <span className="text-slate-300">—</span>;

/** Active users of the current organisation — the people a task can be assigned to. */
export function useAssignableUsers() {
  const { effectiveOrgId } = useEffectiveOrg();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    const active = (all) =>
      (Array.isArray(all) ? all : [])
        .filter((u) => !u.status || String(u.status).toLowerCase() === "active")
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    (async () => {
      try {
        let list = [];
        try {
          list = active(await listOrgUsers(effectiveOrgId, true));
        } catch {
          /* fall through to the unfiltered call below */
        }
        // "assignable" can be too strict (it needs canView) — fall back to every active user of the org.
        if (list.length === 0) list = active(await listOrgUsers(effectiveOrgId, false));
        // user.department holds department IDs; the Task module groups by department NAME — resolve them.
        try {
          const depts = await getDepartments();
          const byId = new Map((Array.isArray(depts) ? depts : []).map((d) => [String(d.id || d._id), d.name]));
          const toName = (v) => byId.get(String(v)) || v;
          list = list.map((u) => ({
            ...u,
            department: Array.isArray(u.department) ? u.department.map(toName) : u.department ? toName(u.department) : u.department,
          }));
        } catch {
          /* keep raw values */
        }
        if (alive) setUsers(list);
      } catch (err) {
        if (alive) {
          setUsers([]);
          setError(err.status ? `${err.message} (${err.status})` : err.message || "Couldn't load users.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [effectiveOrgId]);
  return { users, loading, error };
}

/** The assignee part of an add-task request, from a user-service user. */
export const assigneeFields = (u) => ({
  assigneeUserId: u.id,
  assigneeName: u.name || u.email,
  assigneeDepartment: Array.isArray(u.department) ? u.department[0] || null : u.department || null,
});
