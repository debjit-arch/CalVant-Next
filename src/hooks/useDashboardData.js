/**
 * ─────────────────────────────────────────────────────────────────────────────
 * useDashboardData  (v4 — per-panel duration windows)
 * ─────────────────────────────────────────────────────────────────────────────
 * New params:
 *   comparisonFilters  { enabled, from, to }   — drives comparisonResults
 *   dimensionFilters   { department, client, branch }  — client-side slice
 *
 * New returns:
 *   comparisonResults     — same shape as `results`, covers the comparison window
 *   getComparisonForWindow(from, to)        — ad-hoc comparison window (per-panel)
 *   getResultsForWindow(interval, from, to) — ad-hoc PRIMARY window (per-panel),
 *     mirrors applyDateWindow/INTERVALS so each panel can run its own 7d/14d/
 *     90d/custom duration independently of the (now removed) global selector.
 *
 * FIX: results are now scoped to config.id (configId) so switching between
 * schedules doesn't mix results from other configs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const BASE_URL = "https://api.calvant.com/reports-service/api/reports";
// const BASE_URL ="http://localhost:8085/api/reports"
function getToken() {
  try {
    return sessionStorage.getItem("token") || "";
  } catch {
    return "";
  }
}

function getOrgId(orgId) {
  if (orgId) return orgId;
  try {
    return (
      sessionStorage.getItem("orgId") ||
      JSON.parse(sessionStorage.getItem("user") || "{}").organization ||
      JSON.parse(sessionStorage.getItem("user") || "{}").organizationId ||
      ""
    );
  } catch {
    return "";
  }
}

// ─── dimension filter ─────────────────────────────────────────────────────────
// Prunes byDepartment / byClient / byBranch maps in result.data to only the
// selected values. Scalar totals are left unchanged (they reflect whole-org).
function applyDimensionFilters(rawResults, dimensionFilters) {
  if (!dimensionFilters) return rawResults;
  const { department = [], client = [], branch = [] } = dimensionFilters;
  const hasFilter =
    department.length > 0 || client.length > 0 || branch.length > 0;
  if (!hasFilter) return rawResults;

  return rawResults.map((r) => {
    if (!r.data) return r;
    const filteredData = { ...r.data };

    // For every module key, prune map-type sub-fields
    for (const moduleKey of Object.keys(filteredData)) {
      const mod = filteredData[moduleKey];
      if (!mod || typeof mod !== "object") continue;
      const prunedMod = { ...mod };

      if (department.length > 0 && prunedMod.byDepartment) {
        prunedMod.byDepartment = Object.fromEntries(
          Object.entries(prunedMod.byDepartment).filter(([k]) =>
            department.includes(k),
          ),
        );
      }
      if (client.length > 0 && prunedMod.byClient) {
        prunedMod.byClient = Object.fromEntries(
          Object.entries(prunedMod.byClient).filter(([k]) =>
            client.includes(k),
          ),
        );
      }
      if (branch.length > 0 && prunedMod.byBranch) {
        prunedMod.byBranch = Object.fromEntries(
          Object.entries(prunedMod.byBranch).filter(([k]) =>
            branch.includes(k),
          ),
        );
      }
      filteredData[moduleKey] = prunedMod;
    }
    return { ...r, data: filteredData };
  });
}

// ─── configId scope filter ────────────────────────────────────────────────────
// Ensures results from other schedules' configs never bleed into this view.
function applyConfigScope(rawResults, configId) {
  if (!configId) return rawResults;
  return rawResults.filter((r) => r.configId === configId);
}

// ─── date window filter ───────────────────────────────────────────────────────
function applyDateWindow(rawResults, filters) {
  if (!filters?.interval || filters.interval === "all") return rawResults;

  if (filters.interval === "custom") {
    if (!filters.customFrom) return rawResults;
    const from = new Date(filters.customFrom);
    from.setHours(0, 0, 0, 0);
    const to = filters.customTo ? new Date(filters.customTo) : new Date();
    to.setHours(23, 59, 59, 999);
    return rawResults.filter((r) => {
      const d = new Date(r.generatedAt);
      return d >= from && d <= to;
    });
  }

  const days = { "7d": 7, "14d": 14, "90d": 90 }[filters.interval];
  if (!days) return rawResults;
  const cutoff = new Date(Date.now() - days * 86_400_000);
  return rawResults.filter((r) => new Date(r.generatedAt) >= cutoff);
}

// ─── shape into results array ────────────────────────────────────────────────
function toResultsShape(filtered, dimensionFilters) {
  if (filtered.length === 0) return [];
  const dimFiltered = dimensionFilters
    ? filtered.map((entry) => ({
        ...entry,
        data:
          applyDimensionFilters([entry], dimensionFilters)[0]?.data ??
          entry.data,
      }))
    : filtered;
  const latest = dimFiltered[dimFiltered.length - 1];
  return [
    {
      reportId: "snapshot",
      generatedAt: latest.generatedAt,
      data: latest.data,
      _series: dimFiltered,
    },
  ];
}

// ─── collect available dimension values from all results ────────────────────
function extractDimensionOptions(rawResults) {
  const departments = new Set();
  const clients = new Set();
  const branches = new Set();

  for (const r of rawResults) {
    if (!r.data) continue;
    for (const mod of Object.values(r.data)) {
      if (!mod || typeof mod !== "object") continue;
      if (mod.byDepartment)
        Object.keys(mod.byDepartment).forEach((k) => departments.add(k));
      if (mod.byClient)
        Object.keys(mod.byClient).forEach((k) => clients.add(k));
      if (mod.byBranch)
        Object.keys(mod.byBranch).forEach((k) => branches.add(k));
    }
  }

  return {
    departments: [...departments].sort(),
    clients: [...clients].sort(),
    branches: [...branches].sort(),
  };
}

function bucketByDay(results) {
  const map = new Map();
  for (const r of results) {
    const day = new Date(r.generatedAt).toISOString().slice(0, 10); // "2026-06-08"
    map.set(day, r); // last write wins — most recent snapshot of that day
  }
  return [...map.values()].sort(
    (a, b) => new Date(a.generatedAt) - new Date(b.generatedAt)
  );
}

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useDashboardData(
  config,
  orgIdProp,
  filters,
  comparisonFilters,
  dimensionFilters,
) {
  const orgId = useMemo(() => getOrgId(orgIdProp), [orgIdProp]);
  const configId = config?.id ?? null;

  const [rawResults, setRawResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [online, setOnline] = useState(true);

  const lastFetchedRef = useRef(null);

  const bumpLastFetched = useCallback(() => {
    const now = new Date();
    if (!lastFetchedRef.current || now - lastFetchedRef.current > 1_000) {
      lastFetchedRef.current = now;
      setLastFetched(now);
    }
  }, []);

  // ── REST fetch ───────────────────────────────────────────────────────────
  const fetch_ = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch(
        `${BASE_URL}/results?organization=${encodeURIComponent(orgId)}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
      const json = await res.json();
      const arr = Array.isArray(json.data) ? json.data : [];
      const scoped = applyConfigScope(arr, configId);
      const sorted = [...scoped].sort(
        (a, b) => new Date(a.generatedAt) - new Date(b.generatedAt),
      );
      setRawResults(sorted);
      bumpLastFetched();
      setOnline(true);
    } catch (e) {
      setError(e.message || "Unknown error");
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, [orgId, configId, bumpLastFetched]);

  useEffect(() => {
    if (!orgId) return;
    // Reset results immediately on schedule switch so stale data from the
    // previous config doesn't flash before the new fetch completes.
    setRawResults([]);
    fetch_();
  }, [fetch_]);

  // ── ad-hoc comparison window (per-panel) ──────────────────────────────────
  const getComparisonForWindow = useCallback((from, to) => {
    if (!from) return [];
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = to ? new Date(to) : new Date();
    toDate.setHours(23, 59, 59, 999);

    const windowedRaw = rawResults.filter((r) => {
      const d = new Date(r.generatedAt);
      return d >= fromDate && d <= toDate;
    });

    const dimFiltered = applyDimensionFilters(windowedRaw, dimensionFilters);
    return toResultsShape(bucketByDay(dimFiltered), dimensionFilters);
  }, [rawResults, dimensionFilters]);

  // ── ad-hoc PRIMARY window (per-panel duration: 7d/14d/90d/custom) ─────────
  // Mirrors applyDateWindow, but callable on demand with an arbitrary
  // {interval, customFrom, customTo} so each panel can run its own duration
  // independently of the page-level `filters` state.
  const getResultsForWindow = useCallback((interval, customFrom, customTo) => {
    const windowed = applyDateWindow(rawResults, {
      interval,
      customFrom,
      customTo,
    });
    const dimFiltered = applyDimensionFilters(windowed, dimensionFilters);
    return toResultsShape(bucketByDay(dimFiltered), dimensionFilters);
  }, [rawResults, dimensionFilters]);

  // ── SSE subscription ────────────────────────────────────────────────────
  useEffect(() => {
    if (!orgId) return;
    const url = `${BASE_URL}/stream?organization=${encodeURIComponent(orgId)}`;
    const es = new EventSource(url);
    let pollId = null;

    es.addEventListener("report-update", (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (configId && payload.configId !== configId) return;
        setRawResults((prev) => {
          const alreadyExists = prev.some(
            (r) => r.generatedAt === payload.generatedAt,
          );
          if (alreadyExists) return prev;
          return [...prev, payload].sort(
            (a, b) => new Date(a.generatedAt) - new Date(b.generatedAt),
          );
        });
        bumpLastFetched();
        setOnline(true);
      } catch {}
    });

    es.onerror = () => {
      setOnline(false);
      es.close();
      pollId = setInterval(fetch_, 10_000);
    };

    return () => {
      es.close();
      if (pollId !== null) clearInterval(pollId);
    };
  }, [orgId, configId, fetch_, bumpLastFetched]);

  // ── Periodic background refresh ─────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(fetch_, 60_000);
    return () => clearInterval(id);
  }, [fetch_]);

  // ── Primary results (date window + dimension filter) ─────────────────────
  const filteredResults = useMemo(
    () => applyDateWindow(rawResults, filters),
    [rawResults, filters],
  );

  const dimensionFiltered = useMemo(
    () => applyDimensionFilters(filteredResults, dimensionFilters),
    [filteredResults, dimensionFilters],
  );

  const results = useMemo(
    () => toResultsShape(bucketByDay(dimensionFiltered), dimensionFilters),
    [dimensionFiltered, dimensionFilters],
  );

  // ── Comparison results (separate date window, same dimension filter) ──────
  const comparisonResults = useMemo(() => {
    if (!comparisonFilters?.enabled) return [];

    const { from, to } = comparisonFilters;
    if (!from) return [];

    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = to ? new Date(to) : new Date();
    toDate.setHours(23, 59, 59, 999);

    const windowedRaw = rawResults.filter((r) => {
      const d = new Date(r.generatedAt);
      return d >= fromDate && d <= toDate;
    });

    const dimFiltered = applyDimensionFilters(windowedRaw, dimensionFilters);

    return toResultsShape(bucketByDay(dimFiltered), dimensionFilters);
  }, [rawResults, comparisonFilters, dimensionFilters]);

  // ── Available dimension options for FilterBar dropdowns ──────────────────
  const dimensionOptions = useMemo(
    () => extractDimensionOptions(rawResults),
    [rawResults],
  );

  return {
    results,
    getComparisonForWindow,
    getResultsForWindow,
    comparisonResults,
    dimensionOptions,
    loading,
    error,
    refetch: fetch_,
    lastFetched,
    online,
  };
}