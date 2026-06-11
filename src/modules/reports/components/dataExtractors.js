/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DATA EXTRACTORS  (v2 — dimension-aware)
 * ─────────────────────────────────────────────────────────────────────────────
 * All public API is unchanged. The dimension filter is applied transparently
 * inside resolveMapValue and resolveTrendSeries when a `filters` arg is passed.
 *
 * Real API shape (one result entry):
 *   result.data = {
 *     risks:     { total, avgScore, maxScore, byStatus:{…}, byDepartment:{…} }
 *     audit:     { total, totalFindings, byStatus, byDepartment }
 *     tasks:     { total, overdue, byStatus, byDepartment }
 *     dpia:      { total, avgCompletion, byStatus, byDepartment }
 *     documents: { total, approved, pendingApproval }
 *     aiia:      { stage1Total, stage1Draft, stage1Completed,
 *                  stage2Total, stage2Assigned, stage2Completed }
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── safeNum ──────────────────────────────────────────────────────────────────
function safeNum(v) {
  if (v == null) return 0;
  if (typeof v === "object" && "$numberLong" in v) return Number(v.$numberLong);
  return Number(v) || 0;
}

// ─── resolveByPath ────────────────────────────────────────────────────────────
export function resolveByPath(obj, path) {
  if (!path || obj == null) return undefined;
  const val = path.split(".").reduce((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, obj);
  if (val != null && typeof val === "object" && "$numberLong" in val) {
    return Number(val.$numberLong);
  }
  return val;
}

// ─── resolveSingleValue ───────────────────────────────────────────────────────
export function resolveSingleValue(result, path) {
  const data = result?.data;
  if (!data || !path) return { value: null, delta: null };

  const raw = resolveByPath(data, path);
  if (raw == null) return { value: null, delta: null };

  if (typeof raw === "object" && !Array.isArray(raw) && "value" in raw) {
    return { value: safeNum(raw.value), delta: raw.delta ?? null };
  }

  return { value: typeof raw === "number" ? raw : safeNum(raw), delta: null };
}

// ─── resolveTrendSeries ───────────────────────────────────────────────────────
export function resolveTrendSeries(result, seriesConfigs, _labelExtractor) {
  const series_ = result?._series;
  if (!series_?.length || !seriesConfigs?.length) return { points: [] };

  const expandedSeries = [];
  for (const s of seriesConfigs) {
    const extractor = s.extractor ?? s.key;
    const sampleVal = resolveByPath(
      series_[series_.length - 1]?.data,
      extractor
    );
    if (sampleVal && typeof sampleVal === "object" && !Array.isArray(sampleVal)) {
      Object.keys(sampleVal).forEach((dept, i) => {
        expandedSeries.push({
          key: `${extractor.replace(/\./g, "_")}_${dept.replace(/\s+/g, "_")}`,
          label: dept,
          extractor: `${extractor}.${dept}`,
          color: s.color,
          _autoColorIndex: i,
        });
      });
    } else {
      expandedSeries.push(s);
    }
  }

  const AUTO_COLORS = [
    "#6366f1","#ef4444","#10b981","#f59e0b","#3b82f6",
    "#a855f7","#06b6d4","#f97316","#84cc16","#ec4899",
  ];

  const points = series_.map((entry) => {
    const point = { name: fmtDate(entry.generatedAt) };
    for (const s of expandedSeries) {
      const extractor = s.extractor ?? s.key;
      const dataKey = s.key ?? extractor.replace(/\./g, "_");
      point[dataKey] = safeNum(resolveByPath(entry.data, extractor));
    }
    return point;
  });

  const coloredSeries = expandedSeries.map((s) => ({
    ...s,
    color:
      s._autoColorIndex !== undefined
        ? AUTO_COLORS[s._autoColorIndex % AUTO_COLORS.length]
        : s.color,
  }));

  return { points, expandedSeries: coloredSeries };
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

// ─── resolveMapValue ──────────────────────────────────────────────────────────
export function resolveMapValue(result, path) {
  const data = result?.data;
  if (!data || !path) return {};

  const raw = resolveByPath(data, path);
  if (raw == null) return {};

  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "object") {
    const slices = raw
      .map((item) => ({
        name: item.name ?? item.label ?? item.status ?? String(item),
        value: safeNum(item.value ?? item.count ?? 0),
      }))
      .filter((s) => s.value > 0);
    return { slices };
  }

  if (typeof raw === "object" && !Array.isArray(raw)) {
    const map = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, safeNum(v)])
    );
    return { map };
  }

  return {};
}

// ─── resolveTableRows ─────────────────────────────────────────────────────────
export function resolveTableRows(result, path) {
  const data = result?.data;
  if (!data || !path) return { rows: [] };

  const raw = resolveByPath(data, path);
  if (raw == null) return { rows: [] };

  if (Array.isArray(raw)) return { rows: raw };

  if (typeof raw === "object") {
    const rows = Object.entries(raw)
      .map(([department, value]) => ({ department, value: safeNum(value) }))
      .filter((r) => r.value > 0);
    const map = Object.fromEntries(rows.map((r) => [r.department, r.value]));
    return { rows, map };
  }

  return { rows: [] };
}