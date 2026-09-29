"use client";
import React from "react";

export default function PeopleTabs({ tabs, active, onChange }) {
  return (
    <div className="border-b border-slate-200 mb-6 overflow-x-auto">
      <div className="flex gap-1 min-w-max px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                isActive
                  ? "border-[#007bff] text-[#007bff]"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {Icon && <Icon size={16} className="flex-shrink-0" />}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
