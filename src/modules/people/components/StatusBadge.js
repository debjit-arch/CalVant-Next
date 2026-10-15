"use client";
import React from "react";
import { statusStyle, humanize } from "../utils/peopleFormat";

/** style overrides the auto-mapped color when the caller knows better (e.g. a
 * boolean "Accepted"/"Not accepted" chip that isn't in STATUS_MAP). */
export default function StatusBadge({ value, style, label }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
        style || statusStyle(value)
      }`}
    >
      {label || humanize(value)}
    </span>
  );
}
