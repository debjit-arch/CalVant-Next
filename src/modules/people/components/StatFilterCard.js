"use client";
import React from "react";

// Same look as the Task module's stat cards: gradient icon tile with a white
// icon, 12px radius, 1.5px border that turns blue when selected.
const TONES = {
  blue: "linear-gradient(135deg,#4f8ef7,#2563eb)",
  violet: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
  emerald: "linear-gradient(135deg,#10b981,#059669)",
  amber: "linear-gradient(135deg,#f59e0b,#d97706)",
  rose: "linear-gradient(135deg,#ef4444,#dc2626)",
  slate: "linear-gradient(135deg,#94a3b8,#64748b)",
};

/**
 * StatFilterCard — icon tile + number + label, and it doubles as a filter
 * button (selected card gets the blue outline, like "Total" on the Action Plan page).
 */
export default function StatFilterCard({ icon: Icon, count, label, tone = "blue", selected = false, loading = false, onClick }) {
  const gradient = TONES[tone] || TONES.blue;
  const rest = selected ? "0 4px 14px rgba(37,99,235,0.15)" : "0 1px 4px rgba(0,0,0,0.05)";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        background: "white",
        border: `1.5px solid ${selected ? "#3b82f6" : "#f1f5f9"}`,
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: rest,
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        textAlign: "left",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.09)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = rest)}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
        }}
      >
        {Icon && <Icon size={16} color="white" strokeWidth={2} />}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 18, fontWeight: 700, color: "#1e293b", lineHeight: 1.1 }}>
          {loading ? "—" : count}
        </span>
        <span
          style={{
            display: "block",
            fontSize: 10,
            fontWeight: 600,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </span>
      </span>
    </button>
  );
}
