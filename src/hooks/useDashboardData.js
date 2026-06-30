/**
 * ─────────────────────────────────────────────────────────────────────────────
 * useDashboardData  (v6 — grouping-driven panel windows, no polling)
 * ─────────────────────────────────────────────────────────────────────────────
 * v6 changes:
 *   - getResultsForWindow(granularity, maxGrouping, overrideDimensionFilters)
 *     drives CHART/MAP panels — the window is "the last `maxGrouping`
 *     buckets of `granularity` size, counting back from today". E.g.
 *     granularity="week", maxGrouping=75 → the last 75 weeks.
 *   - getKpiResultsForWindow(duration, overrideDimensionFilters) drives
 *     KPI panels (StatCard/ScoreGauge/TargetMeter) — duration is a plain
 *     {key: "7d"|"14d"|"90d"|"custom", customFrom, customTo} date-range,
 *     so the KPI's value (and its Comparison Period) reflects "latest
 *     snapshot within the last N days" rather than the all-time latest.
 *   - applyDateWindow / the old interval-based panel windowing is gone.
 *     The page-level `filters.interval` (7d/14d/90d/custom) still drives
 *     the *primary* `results`/`comparisonResults` used by the header —
 *     that's unrelated to per-panel duration and untouched here.
 *   - REMOVED: the 60s background poll and the 10s SSE-error poll fallback.
 *     Data only refreshes via the SSE "report-update" push or an explicit
 *     refetch() call (manual refresh button) — no silent interval polling,
 *     so numbers on screen never change mid-meeting on their own.
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
// Exported so DashboardEngine can apply a PER-PANEL criteria filter (set via
// the panel builder's "Criteria filter" rows) without duplicating this logic.
export function applyDimensionFilters(rawResults, dimensionFilters) {
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

      // ── Recompute scalar totals from the pruned breakdown map ──────────
      // Without this, Criteria filter only pruned byDepartment/byClient/
      // byBranch maps — but most KPI panels (StatCard/ScoreGauge/
      // TargetMeter) read a scalar like "risks.total", which was never
      // touched, so the filter silently did nothing for them. Re-derive
      // count-like scalar fields (total/overdue/totalFindings — anything
      // summable, not avg/max/percentage/score) from whichever dimension
      // map was actually filtered.
      const prunedMapForRecompute =
        (department.length > 0 && prunedMod.byDepartment) ||
        (client.length > 0 && prunedMod.byClient) ||
        (branch.length > 0 && prunedMod.byBranch);

      if (prunedMapForRecompute) {
        const filteredSum = Object.values(prunedMapForRecompute).reduce(
          (sum, v) => sum + (Number(v) || 0),
          0,
        );
        for (const fieldKey of Object.keys(prunedMod)) {
          const isCountField =
            typeof prunedMod[fieldKey] === "number" &&
            /^(total|count|overdue)/i.test(fieldKey) &&
            !/avg|max|percentage|score/i.test(fieldKey);
          if (isCountField) {
            prunedMod[fieldKey] = filteredSum;
          }
        }
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

// ─── date window filter (page-level header filter only) ──────────────────────
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

// ─── period bucketing (day / week / month / year) ────────────────────────────
// Buckets `results` by the requested granularity. Last snapshot written to a
// given period wins — i.e. for "month" we keep the most recent generatedAt
// within that month, which is also the correct "running total" value (a
// running total's last value IS its sum-to-date — nothing more to sum).
function periodKeyAndLabel(generatedAt, granularity) {
  const d = new Date(generatedAt);
  switch (granularity) {
    case "year": {
      const y = d.getFullYear();
      return { key: `${y}`, label: `${y}` };
    }
    case "month": {
      const y = d.getFullYear();
      const m = d.getMonth();
      const label = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
      return { key: `${y}-${String(m).padStart(2, "0")}`, label };
    }
    case "week": {
      // ISO-ish week bucket: Monday-start week, keyed by that Monday's date.
      const monday = new Date(d);
      const day = (monday.getDay() + 6) % 7; // 0 = Monday
      monday.setDate(monday.getDate() - day);
      monday.setHours(0, 0, 0, 0);
      const key = monday.toISOString().slice(0, 10);
      const label = `Wk of ${monday.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
      return { key, label };
    }
    case "day":
    default: {
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      return { key, label };
    }
  }
}

function bucketByPeriod(results, granularity = "day") {
  const map = new Map();
  for (const r of results) {
    const { key, label } = periodKeyAndLabel(r.generatedAt, granularity);
    // last write wins — most recent snapshot within that period
    map.set(key, { ...r, _periodLabel: label });
  }
  return [...map.values()].sort(
    (a, b) => new Date(a.generatedAt) - new Date(b.generatedAt),
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

  // ── ad-hoc comparison window (per-panel KPI "Compare to") ──────────────────
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
    return toResultsShape(bucketByPeriod(dimFiltered, "day"), dimensionFilters);
  }, [rawResults, dimensionFilters]);

  // ── per-panel PRIMARY window (grouping-driven) — CHARTS / MAPS ─────────────
  // granularity: "day" | "week" | "month" | "year" — how points are bucketed.
  // maxGrouping: how many of the most-recent buckets to keep (5..75).
  // overrideDimensionFilters: a single panel's own Criteria Filter
  // (department/client/branch), independent of the dashboard-wide FilterBar.
  const getResultsForWindow = useCallback((
    granularity = "day",
    maxGrouping,
    overrideDimensionFilters,
  ) => {
    const effectiveDimFilters = overrideDimensionFilters ?? dimensionFilters;
    const dimFiltered = applyDimensionFilters(rawResults, effectiveDimFilters);
    let bucketed = bucketByPeriod(dimFiltered, granularity);
    if (maxGrouping) {
      bucketed = bucketed.slice(-maxGrouping);
    }
    return toResultsShape(bucketed, effectiveDimFilters);
  }, [rawResults, dimensionFilters]);

  // ── per-panel PRIMARY window — KPIs ─────────────────────────────────────────
  // KPIs (StatCard/ScoreGauge/TargetMeter) need their own duration so the
  // "current value" and its Comparison Period actually mean something —
  // e.g. "7D" = the latest snapshot within the last 7 days. This is a plain
  // date-range filter (mirrors the old applyDateWindow), independent of the
  // chart grouping/maxGrouping concept above.
  // duration: { key: "7d"|"14d"|"90d"|"custom", customFrom, customTo }
  const getKpiResultsForWindow = useCallback((
    duration,
    overrideDimensionFilters,
  ) => {
    const effectiveDimFilters = overrideDimensionFilters ?? dimensionFilters;
    const windowed = applyDateWindow(rawResults, {
      interval: duration?.key ?? "7d",
      customFrom: duration?.customFrom,
      customTo: duration?.customTo,
    });
    const dimFiltered = applyDimensionFilters(windowed, effectiveDimFilters);
    return toResultsShape(bucketByPeriod(dimFiltered, "day"), effectiveDimFilters);
  }, [rawResults, dimensionFilters]);

  // ── SSE subscription (the ONLY source of "live" updates — no polling) ─────
  useEffect(() => {
    if (!orgId) return;
    const url = `${BASE_URL}/stream?organization=${encodeURIComponent(orgId)}`;
    const es = new EventSource(url);

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
      // No interval-based reconnect/poll — connection just goes idle.
      // Data stays exactly as last fetched until the user hits refresh.
      setOnline(false);
      es.close();
    };

    return () => es.close();
  }, [orgId, configId, bumpLastFetched]);

  // ── Primary results (page-level date window + dimension filter, day-grouped) ─
  const filteredResults = useMemo(
    () => applyDateWindow(rawResults, filters),
    [rawResults, filters],
  );

  const dimensionFiltered = useMemo(
    () => applyDimensionFilters(filteredResults, dimensionFilters),
    [filteredResults, dimensionFilters],
  );

  const results = useMemo(
    () => toResultsShape(bucketByPeriod(dimensionFiltered, "day"), dimensionFilters),
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

    return toResultsShape(bucketByPeriod(dimFiltered, "day"), dimensionFilters);
  }, [rawResults, comparisonFilters, dimensionFilters]);

  // ── Available dimension options for FilterBar / Criteria Filter dropdowns ─
  const dimensionOptions = useMemo(
    () => extractDimensionOptions(rawResults),
    [rawResults],
  );

  return {
    results,
    getComparisonForWindow,
    getResultsForWindow,
    getKpiResultsForWindow,
    comparisonResults,
    dimensionOptions,
    loading,
    error,
    refetch: fetch_,
    lastFetched,
    online,
    orgId,
  };
}