/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ReportConfigModal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Allows users to view and edit a report config's schedule settings:
 *   • Report name
 *   • Data sources (checklist)
 *   • Interval type (Daily, Weekly, Monthly, Quarterly, Yearly, Custom)
 *   • Interval value (for Custom types)
 *   • Active toggle
 *
 * Calls PATCH /api/reports/config/:id/active for toggle-only changes.
 * Calls POST /api/reports/config for creating new configs.
 * For full edits it deletes + recreates (backend has no PUT config endpoint).
 *
 * Props:
 *   config      – existing ReportConfig object | null (null = create mode)
 *   organization – string
 *   userId      – string
 *   availableSources – string[]
 *   onSave      – (savedConfig) => void
 *   onClose     – () => void
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, CalendarDays, RefreshCw, ToggleLeft, ToggleRight,
  Database, ChevronDown, Save, Trash2, Plus
} from "lucide-react";

const BASE_URL = "https://api.calvant.com/reports-service/api/reports";

function getToken() {
  try { return sessionStorage.getItem("token") || ""; } catch { return ""; }
}

// ─── interval options ─────────────────────────────────────────────────────────
const INTERVAL_OPTIONS = [
  { value: "DAILY",    label: "Daily",    needsValue: false },
  { value: "WEEKLY",   label: "Weekly",   needsValue: false },
  { value: "MONTHLY",  label: "Monthly",  needsValue: false },
  { value: "QUARTERLY",label: "Quarterly",needsValue: false },
  { value: "YEARLY",   label: "Yearly",   needsValue: false },
  { value: "HOURLY",   label: "Hourly",   needsValue: false },
  { value: "CUSTOM_DAYS",   label: "Every N days",   needsValue: true, unit: "days"   },
  { value: "CUSTOM_MONTHS", label: "Every N months", needsValue: true, unit: "months" },
  { value: "CUSTOM_YEARS",  label: "Every N years",  needsValue: true, unit: "years"  },
];

const INTERVAL_ICONS = {
  DAILY: "🗓️", WEEKLY: "📅", MONTHLY: "🗃️", QUARTERLY: "📊",
  YEARLY: "🗓️", HOURLY: "⏰", CUSTOM_DAYS: "⚙️", CUSTOM_MONTHS: "⚙️", CUSTOM_YEARS: "⚙️",
};

// ─── helpers ──────────────────────────────────────────────────────────────────
async function apiCall(method, path, body) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── component ────────────────────────────────────────────────────────────────
export default function ReportConfigModal({
  config,
  organization,
  userId,
  availableSources = [],
  onSave,
  onDelete,
  onClose,
}) {
  const isCreate = !config;

  const [reportName, setReportName] = useState(config?.reportName ?? "");
  const [dataSources, setDataSources] = useState(
    config?.dataSources ?? []
  );
  const [intervalType, setIntervalType] = useState(
    config?.intervalType ?? "DAILY"
  );
  const [intervalValue, setIntervalValue] = useState(
    config?.intervalValue ?? 1
  );
  const [active, setActive] = useState(config?.active ?? true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState(null);

  const selectedInterval = INTERVAL_OPTIONS.find((o) => o.value === intervalType);

  const toggleSource = (src) => {
    setDataSources((prev) =>
      prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]
    );
  };

  // ── save ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!reportName.trim()) { setError("Report name is required."); return; }
    if (dataSources.length === 0) { setError("Select at least one data source."); return; }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        reportName: reportName.trim(),
        organization,
        userId,
        createdBy: userId,
        dataSources,
        intervalType,
        intervalValue: selectedInterval?.needsValue ? Math.max(1, intervalValue) : 1,
        active,
      };

      let saved;
      if (isCreate) {
        const res = await apiCall("POST", "/config", payload);
        saved = res.data;
      } else {
        // Backend has no PUT — delete + recreate preserving org/user
        await apiCall("DELETE", `/config/${config.id}`);
        const res = await apiCall("POST", "/config", payload);
        saved = res.data;
      }
      onSave(saved);
      onClose();
    } catch (e) {
      setError(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }, [reportName, dataSources, intervalType, intervalValue, active, isCreate, config, organization, userId, selectedInterval, onSave, onClose]);

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!config?.id) return;
    setDeleting(true);
    setError(null);
    try {
      await apiCall("DELETE", `/config/${config.id}`);
      onDelete?.(config.id);
      onClose();
    } catch (e) {
      setError(e.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }, [config, onDelete, onClose]);

  // ── toggle active only (quick toggle) ─────────────────────────────────────
  const handleToggleActive = useCallback(async () => {
    if (isCreate) { setActive((v) => !v); return; }
    const next = !active;
    setActive(next);
    try {
      await apiCall("PATCH", `/config/${config.id}/active?active=${next}`);
    } catch (e) {
      setActive(!next); // revert
      setError(e.message);
    }
  }, [active, isCreate, config]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 32, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                {isCreate ? "New Report Schedule" : "Edit Report Schedule"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isCreate
                  ? "Set up what data to collect and how often"
                  : `Editing "${config.reportName}"`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-slate-500 text-2xl leading-none mt-0.5"
            >
              ×
            </button>
          </div>

          {/* active toggle */}
          {!isCreate && (
            <button
              onClick={handleToggleActive}
              className={`mt-3 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold
                border transition-all
                ${active
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
            >
              {active
                ? <ToggleRight size={14} className="text-emerald-500" />
                : <ToggleLeft size={14} />}
              {active ? "Active — running on schedule" : "Paused — not running"}
            </button>
          )}
        </div>

        {/* body */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto space-y-5">

          {/* report name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Report name
            </label>
            <input
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="e.g. Weekly Compliance Summary"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400
                text-slate-700 transition-all"
            />
          </div>

          {/* data sources */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Data sources
            </label>
            {availableSources.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No sources available</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableSources.map((src) => {
                  const active_ = dataSources.includes(src);
                  return (
                    <button
                      key={src}
                      onClick={() => toggleSource(src)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left
                        transition-all text-sm
                        ${active_
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                          : "border-slate-150 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-white"
                        }`}
                    >
                      <Database size={13} className={active_ ? "text-indigo-500" : "text-slate-400"} />
                      <span className="font-medium capitalize">{src}</span>
                      {active_ && (
                        <span className="ml-auto w-4 h-4 rounded-full bg-indigo-500 flex items-center
                          justify-center text-white text-[9px] font-bold">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* interval type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Run schedule
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INTERVAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setIntervalType(opt.value)}
                  className={`px-3 py-2.5 rounded-xl border-2 text-xs font-semibold text-left
                    transition-all
                    ${intervalType === opt.value
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-slate-150 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-white"
                    }`}
                >
                  <span className="block text-base mb-0.5">{INTERVAL_ICONS[opt.value]}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* custom interval value */}
          <AnimatePresence>
            {selectedInterval?.needsValue && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Every how many {selectedInterval.unit}?
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={intervalValue}
                    onChange={(e) => setIntervalValue(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold
                      text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-center"
                  />
                  <span className="text-sm text-slate-500">{selectedInterval.unit}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* next run preview */}
          {!isCreate && config.nextRunAt && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
              <Clock size={13} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-600">Next scheduled run</p>
                <p className="text-xs text-slate-400">
                  {new Date(config.nextRunAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* error */}
          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5 text-xs text-rose-600">
              {error}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isCreate && (
              confirmDelete ? (
                <>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-2 rounded-xl bg-rose-500 text-white text-xs font-semibold
                      hover:bg-rose-600 disabled:opacity-60 transition-colors flex items-center gap-1.5"
                  >
                    {deleting ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Confirm delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold
                      hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                    text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent
                    hover:border-rose-100 transition-all"
                >
                  <Trash2 size={12} /> Delete schedule
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium px-2 py-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold
                hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed
                active:scale-95 transition-all shadow-sm flex items-center gap-2"
            >
              {saving
                ? <RefreshCw size={13} className="animate-spin" />
                : isCreate ? <Plus size={13} /> : <Save size={13} />}
              {isCreate ? "Create schedule" : "Save changes"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}