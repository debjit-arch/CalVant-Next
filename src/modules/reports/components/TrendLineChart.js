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
  // blend toward #cbd5e1 (slate-300) by 50% to create a muted variant
  try {
    const r1 = parseInt(hex.slice(1, 3), 16);
    const g1 = parseInt(hex.slice(3, 5), 16);
    const b1 = parseInt(hex.slice(5, 7), 16);
    const r2 = 0xcb; const g2 = 0xd5; const b2 = 0xe1;
    const r  = Math.round((r1 + r2) / 2);
    const g  = Math.round((g1 + g2) / 2);
    const b  = Math.round((b1 + b2) / 2);
    return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
  } catch {
    return "#cbd5e1";
  }
}

// ── Merge primary + comparison points into a single data array ────────────────
// Primary keys stay as-is (e.g. "risks_total").
// Comparison keys get a "__cmp" suffix (e.g. "risks_total__cmp").
// Both share the same x-axis by index position so the chart aligns them.
function mergePoints(primaryPoints, compPoints, series) {
  const len = Math.max(primaryPoints.length, compPoints.length);
  return Array.from({ length: len }, (_, i) => {
    const p = primaryPoints[i] ?? {};
    const c = compPoints[i]   ?? {};
    const merged = { name: p.name ?? c.name ?? String(i + 1) };
    for (const s of series) {
      if (p[s.key] != null) merged[s.key] = p[s.key];
      if (c[s.key] != null) merged[`${s.key}__cmp`] = c[s.key];
    }
    return merged;
  });
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
    if (!hasComp) return primaryPts;
    return mergePoints(primaryPts, compPts, series);
  }, [primaryPts, compPts, series, hasComp]);

  return (
    <ChartShell title={kpiConfig.title} loading={loading} hasData={points.length > 0}>
      {points.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              axisLine={false} tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
              interval={points.length > 6 ? Math.floor(points.length / 6) : 0}
              angle={-25} textAnchor="end" height={44}
            />
            <YAxis
              axisLine={false} tickLine={false} width={30}
              allowDecimals={false}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
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
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
                activeDot={{ r: 3, fill: muteColor(s.color ?? "#6366f1"), stroke: "#fff", strokeWidth: 1 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
});

export default TrendLineChart;