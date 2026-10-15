"use client";
import React from "react";

const TONES = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
];

const initialsOf = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Same name always gets the same colour, so people are easy to spot in a list. */
const toneOf = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return TONES[Math.abs(hash) % TONES.length];
};

export default function PersonAvatar({ name, size = 36 }) {
  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold flex-shrink-0 ${toneOf(name)}`}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.34)) }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </div>
  );
}
