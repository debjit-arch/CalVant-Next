"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  RefreshCw,
  UserCircle2,
  AlertTriangle,
  Users,
  UserPlus,
  CheckCircle2,
  LogOut,
  UserX,
  AlertOctagon,
  X,
} from "lucide-react";
import {
  listPersons,
  listBackgroundChecksForPerson,
  listPolicyAcceptances,
  listTickets,
  listTraining,
} from "../services/peopleApi";
import StatusBadge from "./StatusBadge";
import PersonAvatar from "./PersonAvatar";
import StatFilterCard from "./StatFilterCard";
import PersonFormModal from "./PersonFormModal";
import { getAttention, attentionLabel } from "../utils/peopleFormat";

const LIFECYCLE_VIEWS = ["ONBOARDING", "ACTIVE", "OFFBOARDING", "TERMINATED"];

const STAT_CARDS = [
  { key: "ALL", label: "Total", icon: Users, tone: "blue" },
  { key: "ONBOARDING", label: "Onboarding", icon: UserPlus, tone: "violet" },
  { key: "ACTIVE", label: "Active", icon: CheckCircle2, tone: "emerald" },
  { key: "OFFBOARDING", label: "Offboarding", icon: LogOut, tone: "amber" },
  { key: "TERMINATED", label: "Terminated", icon: UserX, tone: "slate" },
  { key: "ATTENTION", label: "Needs attention", icon: AlertOctagon, tone: "rose" },
];

/**
 * The single People view. The stat cards along the top are the filters (same
 * pattern as the Action Plan page), and each row folds screening, documents,
 * learning and tickets into one plain "needs attention" signal — open a person
 * to see and act on the detail.
 *
 * Two ways to use it:
 *  • Driven by a page header (PeopleDirectoryPage): pass `showCreate`,
 *    `onCloseCreate` and `refreshKey`, and the page's header owns the
 *    "Add person" and refresh buttons.
 *  • Standalone (PeopleSection tab): pass only `canEdit` and it shows its own
 *    Refresh / Add person buttons, exactly like before.
 */
export default function PersonDirectory({ canEdit, showCreate: showCreateProp, onCloseCreate, refreshKey }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const controlled = typeof showCreateProp === "boolean";
  const [internalCreate, setInternalCreate] = useState(false);
  const showCreate = controlled ? showCreateProp : internalCreate;
  const closeCreate = () => (controlled ? onCloseCreate?.() : setInternalCreate(false));

  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  // view: ALL | a lifecycle status | ATTENTION | SCREENING (URL-only, no card)
  const [view, setView] = useState(() => {
    const focus = (searchParams.get("focus") || "").toLowerCase();
    if (focus === "attention") return "ATTENTION";
    if (focus === "screening") return "SCREENING";
    const status = (searchParams.get("status") || "").toUpperCase();
    return LIFECYCLE_VIEWS.includes(status) ? status : "ALL";
  });

  // Compliance snapshot per person id — each folded into "needs attention".
  const [screening, setScreening] = useState({});
  const [docs, setDocs] = useState({});
  const [training, setTraining] = useState({});
  const [tickets, setTickets] = useState({});

  const loadScreening = async (list) => {
    const checks = await Promise.all(
      (list || []).map((p) => listBackgroundChecksForPerson(p.id).catch(() => [])),
    );
    setScreening((prev) => {
      const next = { ...prev };
      (list || []).forEach((p, i) => {
        next[p.id] = (checks[i] || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] || null;
      });
      return next;
    });
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [personsData, acceptances, disciplinary, events, trainingData] = await Promise.all([
        listPersons(),
        listPolicyAcceptances().catch(() => []),
        listTickets("DISCIPLINARY").catch(() => []),
        listTickets("SECURITY_EVENT").catch(() => []),
        listTraining().catch(() => []),
      ]);
      const list = Array.isArray(personsData) ? personsData : [];
      setPersons(list);
      loadScreening(list);

      const docsMap = {};
      (acceptances || []).forEach((a) => {
        docsMap[a.personId] = docsMap[a.personId] || new Set();
        if (a.accepted) docsMap[a.personId].add(a.policyType);
      });
      setDocs(docsMap);

      const trainingMap = {};
      (trainingData || []).forEach((t) => {
        trainingMap[t.personId] = trainingMap[t.personId] || { total: 0, pending: 0 };
        trainingMap[t.personId].total += 1;
        if ((t.status || "").toUpperCase() !== "COMPLETED") trainingMap[t.personId].pending += 1;
      });
      setTraining(trainingMap);

      const ticketsMap = {};
      [...(disciplinary || []), ...(events || [])].forEach((t) => {
        ticketsMap[t.personId] = ticketsMap[t.personId] || 0;
        if ((t.status || "").toUpperCase() === "OPEN") ticketsMap[t.personId] += 1;
      });
      setTickets(ticketsMap);
    } catch (err) {
      setError(err.message || "Couldn't load the people directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The page header's refresh button bumps refreshKey.
  useEffect(() => {
    if (refreshKey) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const attentionById = useMemo(() => {
    const map = {};
    persons.forEach((p) => {
      map[p.id] = getAttention({
        person: p,
        screening: screening[p.id], // undefined until loaded
        docsAccepted: docs[p.id]?.size || 0,
        trainingPending: training[p.id]?.pending || 0,
        openTickets: tickets[p.id] || 0,
      });
    });
    return map;
  }, [persons, screening, docs, training, tickets]);

  const counts = useMemo(() => {
    const c = { ALL: persons.length, ONBOARDING: 0, ACTIVE: 0, OFFBOARDING: 0, TERMINATED: 0, ATTENTION: 0 };
    persons.forEach((p) => {
      const status = (p.lifecycleStatus || "").toUpperCase();
      if (c[status] !== undefined) c[status] += 1;
      if ((attentionById[p.id]?.count || 0) > 0) c.ATTENTION += 1;
    });
    return c;
  }, [persons, attentionById]);

  // Newest first: createdAt, falling back to the Mongo ObjectId timestamp (first 8 hex chars of the id).
  const addedAt = (p) => {
    const t = p.createdAt ? new Date(p.createdAt).getTime() : NaN;
    if (!Number.isNaN(t)) return t;
    const hex = String(p.id || "").slice(0, 8);
    return /^[0-9a-f]{8}$/i.test(hex) ? parseInt(hex, 16) * 1000 : 0;
  };

  const filtered = useMemo(() => {
    return [...persons].sort((a, b) => addedAt(b) - addedAt(a)).filter((p) => {
      const status = (p.lifecycleStatus || "").toUpperCase();
      if (sourceFilter !== "ALL" && p.source !== sourceFilter) return false;
      if (LIFECYCLE_VIEWS.includes(view) && status !== view) return false;
      if (view === "ATTENTION" && (attentionById[p.id]?.count || 0) === 0) return false;
      if (view === "SCREENING") {
        const check = screening[p.id];
        const pending = check !== undefined && (check?.status || "").toUpperCase() !== "CLEARED";
        if (!pending || status === "TERMINATED") return false;
      }
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.department || "").toLowerCase().includes(q) ||
        (p.designation || "").toLowerCase().includes(q)
      );
    });
  }, [persons, search, sourceFilter, view, attentionById, screening]);

  const clearFilters = () => {
    setSearch("");
    setSourceFilter("ALL");
    setView("ALL");
  };

  const go = (id) => router.push(`/people/directory/${id}`);

  return (
    <div>
      {/* Stat cards = filters */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 18 }}>
        {STAT_CARDS.map((c) => (
          <StatFilterCard
            key={c.key}
            icon={c.icon}
            tone={c.tone}
            label={c.label}
            count={counts[c.key]}
            loading={loading}
            selected={view === c.key}
            onClick={() => setView(view === c.key && c.key !== "ALL" ? "ALL" : c.key)}
          />
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-2.5 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, department…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>

        <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Source
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-sm normal-case font-normal tracking-normal text-slate-700 border border-slate-200 rounded-lg px-2.5 py-2 bg-white"
          >
            <option value="ALL">All sources</option>
            <option value="KEKA_SYNCED">Synced from Keka</option>
            <option value="MANUAL">Added manually</option>
          </select>
        </label>

        <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">
          {loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "person" : "people"}`}
        </span>

        {!controlled && (
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            {canEdit && (
              <button
                onClick={() => setInternalCreate(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-[#007bff] rounded-lg hover:bg-blue-600"
              >
                <Plus size={16} /> Add person
              </button>
            )}
          </div>
        )}
      </div>

      {view === "SCREENING" && (
        <div className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-full pl-3 pr-1.5 py-1">
          Showing people whose background check isn't cleared yet
          <button
            onClick={() => setView("ALL")}
            aria-label="Clear this filter"
            className="p-0.5 rounded-full hover:bg-amber-100"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>
      )}

      {/* People list */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {loading && (
          <div className="divide-y divide-slate-100">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 rounded bg-slate-100" />
                  <div className="h-2.5 w-28 rounded bg-slate-100" />
                </div>
                <div className="h-5 w-20 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="px-5 py-14 text-center">
            <UserCircle2 size={32} className="mx-auto mb-2 text-slate-300" />
            {persons.length === 0 ? (
              <>
                <p className="text-sm font-semibold text-slate-700">No one here yet</p>
                <p className="text-[13px] text-slate-400 mt-1">Add your first person to start tracking their onboarding.</p>
                {canEdit && (
                  <button
                    onClick={() => (controlled ? onCloseCreate && setInternalCreate(false) : setInternalCreate(true))}
                    className="hidden"
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-700">No one matches these filters</p>
                <p className="text-[13px] text-slate-400 mt-1">Try a different search, or clear the filters.</p>
                <button
                  onClick={clearFilters}
                  className="mt-3 text-xs font-semibold text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {filtered.map((p) => {
              const attention = attentionById[p.id] || { count: 0, reasons: [] };
              const terminated = (p.lifecycleStatus || "").toUpperCase() === "TERMINATED";
              const subtitle = [p.department, p.designation].filter(Boolean).join(" · ") || p.email;
              return (
                <li
                  key={p.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => go(p.id)}
                  onKeyDown={(e) => e.key === "Enter" && go(p.id)}
                  className="flex items-center gap-3 px-4 sm:px-5 py-3.5 cursor-pointer hover:bg-slate-50/80 focus:outline-none focus:bg-slate-50 transition-colors"
                >
                  <PersonAvatar name={p.name} size={38} />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400 truncate">{subtitle}</p>
                    <div className="sm:hidden mt-1.5">
                      <StatusBadge value={p.lifecycleStatus} />
                    </div>
                  </div>

                  <div className="hidden sm:block w-28 flex-shrink-0">
                    <StatusBadge value={p.lifecycleStatus} />
                  </div>

                  <div className="hidden md:block w-40 flex-shrink-0">
                    {terminated ? (
                      <span className="text-xs text-slate-300">—</span>
                    ) : attention.count > 0 ? (
                      <span
                        title={attention.reasons.join(" · ")}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600"
                      >
                        <AlertTriangle size={14} className="flex-shrink-0" />
                        {attentionLabel(attention.count)}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600">All clear</span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      go(p.id);
                    }}
                    className="flex-shrink-0 text-xs font-semibold text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50"
                  >
                    Open
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showCreate && (
        <PersonFormModal
          onClose={closeCreate}
          onSaved={(created) => {
            closeCreate();
            setPersons((prev) => [created, ...prev]);
            loadScreening([created]);
          }}
        />
      )}
    </div>
  );
}
