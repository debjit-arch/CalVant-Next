/**
 * ─────────────────────────────────────────────────────────────────────────────
 * WIDGET: TrendLineChart
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-series recharts LineChart with optional comparison period overlay.
 *
 * resolvedData.points    – [{ name, seriesKey1, seriesKey2, … }]
 * comparisonData.points  – same shape, comparison period (dashed, muted)
 * kpiConfig.props.series – [{ key, label, color }]
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { memo, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { ChartShell, CustomTooltip, EmptyChart } from "./ChartShell";

// ── Mute a hex colour for comparison lines ────────────────────────────────────
function muteColor(hex) {
  // blend toward #94a3b8 (slate-400) by 40% — more visible than before
  try {
    const r1 = parseInt(hex.slice(1, 3), 16);
    const g1 = parseInt(hex.slice(3, 5), 16);
    const b1 = parseInt(hex.slice(5, 7), 16);
    const r2 = 0x94; const g2 = 0xa3; const b2 = 0xb8;
    const r  = Math.round(r1 * 0.6 + r2 * 0.4);
    const g  = Math.round(g1 * 0.6 + g2 * 0.4);
    const b  = Math.round(b1 * 0.6 + b2 * 0.4);
    return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
  } catch {
    return "#94a3b8";
  }
}

// ── Merge primary + comparison points into a single data array ────────────────
// Primary keys stay as-is (e.g. "risks_total").
// Comparison keys get a "__cmp" suffix (e.g. "risks_total__cmp").
// Both share the same x-axis by index position so the chart aligns them.
function mergePoints(primaryPoints, compPoints, series) {
  if (!compPoints.length) return primaryPoints.map((p) => ({ name: p.name, __cmpName: null, ...Object.fromEntries(series.map(s => [s.key, p[s.key]])) }));

  // Downsample compPoints to same length as primaryPoints by even spacing
  const ratio = compPoints.length / primaryPoints.length;

  return primaryPoints.map((p, i) => {
    // Pick the comp point that proportionally matches this primary slot
    const compIdx = Math.min(Math.round(i * ratio), compPoints.length - 1);
    const c = compPoints[compIdx] ?? {};

    const merged = {
      name:      p.name,
      __cmpName: c.name ?? null,
    };
    for (const s of series) {
      if (p[s.key] != null) merged[s.key] = p[s.key];
      if (c[s.key] != null) merged[`${s.key}__cmp`] = c[s.key];
    }
    return merged;
  });
}

// ── Comparison-aware tooltip ──────────────────────────────────────────────────
function ComparisonTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const cmpName = payload[0]?.payload?.__cmpName;
  const primary = payload.filter((p) => !p.dataKey?.endsWith("__cmp"));
  const comp    = payload.filter((p) =>  p.dataKey?.endsWith("__cmp"));
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-xs min-w-[160px]">
      {primary.length > 0 && (
        <>
          <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
          {primary.map((p, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
              <span className="text-slate-500 flex-1">{p.name}</span>
              <span className="font-bold text-slate-800">{p.value}</span>
            </div>
          ))}
        </>
      )}
      {comp.length > 0 && (
        <>
          <p className="font-semibold text-slate-400 mt-2 mb-1.5 pt-1.5 border-t border-slate-100">
            {cmpName ?? "Comparison"}
          </p>
          {comp.map((p, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0 opacity-60" style={{ background: p.color }} />
              <span className="text-slate-400 flex-1">{p.name?.replace(" (prev)", "")}</span>
              <span className="font-bold text-slate-500">{p.value}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const TrendLineChart = memo(function TrendLineChart({
  kpiConfig,
  resolvedData,
  comparisonData,
  loading,
}) {
  const series      = resolvedData?.expandedSeries ?? kpiConfig.props?.series ?? [];
  const primaryPts  = resolvedData?.points  ?? [];
  const compPts     = comparisonData?.points ?? [];
  const hasComp     = compPts.length > 0;

const points = useMemo(() => {
  console.log("[TrendLine] primary:", primaryPts.length, "comp:", compPts.length);
  if (!hasComp) return primaryPts;
  return mergePoints(primaryPts, compPts, series);
}, [primaryPts, compPts, series, hasComp]);

  return (
    <ChartShell title={kpiConfig.title} loading={loading} hasData={points.length > 0}>
      {points.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              axisLine={false} tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 500 }}
              interval={Math.max(0, Math.ceil(points.length / 5) - 1)}
              angle={-40} textAnchor="end" height={50}
            />
            <YAxis
              axisLine={false} tickLine={false} width={30}
              allowDecimals={false}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
            />
            <Tooltip content={hasComp ? <ComparisonTooltip /> : <CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 10, color: "#64748b", paddingTop: 4 }}
              iconType="circle" iconSize={7}
            />

            {/* Primary series — solid lines */}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: s.color, stroke: "#fff", strokeWidth: 2 }}
              />
            ))}

            {/* Comparison series — dashed muted lines */}
            {hasComp && series.map((s) => (
              <Line
                key={`${s.key}__cmp`}
                type="monotone"
                dataKey={`${s.key}__cmp`}
                name={`${s.label} (prev)`}
                stroke={muteColor(s.color ?? "#6366f1")}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 4, fill: muteColor(s.color ?? "#6366f1"), stroke: "#fff", strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
});

export default TrendLineChart;