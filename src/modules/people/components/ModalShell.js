"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Paperclip, AlertTriangle } from "lucide-react";

/**
 * ModalShell + small form primitives shared by every People popup (Add/Edit
 * person, background check, document, training, ticket, offboarding).
 *
 * Why this exists: each modal used to carry its own header markup, its own
 * <style jsx> input styles and bare-bones fields. Doing it once here means
 * every popup gets the same friendly layout — a clear title with one line of
 * plain-language help, fields grouped under short headings, and one obvious
 * primary button — and future forms only need to compose these pieces.
 */

export const inputClass =
  "w-full text-sm text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-2 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 " +
  "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";

export default function ModalShell({
  title,
  subtitle,
  onClose,
  onSubmit,
  footer,
  maxWidth = "max-w-md",
  children,
}) {
  // Escape closes the popup — but only the topmost one is ever mounted here.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeRef.current?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Render into <body>, above the app's top bar and side nav. Inside the page layout the popup sat under
  // the sticky header (its title was hidden) and a transformed ancestor could shrink "fixed" to a box.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // the page behind shouldn't scroll while the popup is open
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  if (!mounted) return null;

  const Body = onSubmit ? "form" : "div";

  return createPortal(
    <div className="fixed inset-0 z-[2147483000] flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[calc(100dvh-3rem)] flex flex-col`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            {subtitle && <p className="text-[13px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <Body onSubmit={onSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="px-6 pb-5 pt-1 space-y-5 overflow-y-auto">{children}</div>
          {footer && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl flex justify-end gap-2">
              {footer}
            </div>
          )}
        </Body>
      </div>
    </div>,
    document.body,
  );
}

/** A short heading + the fields that belong together ("Who are they", …). */
export function Section({ title, children }) {
  return (
    <div>
      {title && <p className="text-xs font-semibold text-slate-400 mb-2">{title}</p>}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-medium text-slate-600 mb-1">
          {label}
          {required && <span className="text-rose-500"> *</span>}
        </span>
      )}
      {children}
      {hint && <span className="block text-[11px] text-slate-400 mt-1 leading-snug">{hint}</span>}
    </label>
  );
}

/** Same as Field but for controls that aren't a single input (chip groups). */
export function FieldGroup({ label, hint, children }) {
  return (
    <div>
      {label && <span className="block text-xs font-medium text-slate-600 mb-1.5">{label}</span>}
      {children}
      {hint && <span className="block text-[11px] text-slate-400 mt-1 leading-snug">{hint}</span>}
    </div>
  );
}

/**
 * ChipGroup — a row of mutually-exclusive choices. Friendlier than a dropdown
 * for short lists (status, category, yes/no) because every option is visible.
 */
export function ChipGroup({ options, value, onChange, disabled = false, ariaLabel }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const selected = o.value === value;
        const isDisabled = disabled || !!o.disabled;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={isDisabled}
            title={o.disabled ? o.disabledReason : undefined}
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 ${
              selected
                ? "bg-blue-50 border-[#007bff] text-[#007bff]"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** A "Choose a file" button that shows what's already attached / uploading. */
export function FileButton({ onChange, uploading, fileName, existingUrl, existingLabel = "Current file on record", accept }) {
  return (
    <div className="space-y-2">
      {existingUrl && (
        <a
          href={existingUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
        >
          <Paperclip size={13} /> {fileName || existingLabel}
        </a>
      )}
      <div>
        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 bg-white px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer">
          <Paperclip size={13} />
          {existingUrl ? "Replace file" : "Choose a file"}
          <input type="file" accept={accept} onChange={onChange} className="sr-only" />
        </label>
        {uploading && <span className="ml-2 text-xs text-slate-400">Uploading…</span>}
      </div>
    </div>
  );
}

export function ModalError({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
      <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function InfoNote({ tone = "slate", children }) {
  const tones = {
    slate: "text-slate-600 bg-slate-50 border-slate-100",
    blue: "text-blue-700 bg-blue-50 border-blue-100",
    amber: "text-amber-800 bg-amber-50 border-amber-100",
  };
  return <div className={`text-xs leading-relaxed border rounded-lg px-3 py-2 ${tones[tone] || tones.slate}`}>{children}</div>;
}

/** Cancel + one clear primary button. */
export function ModalButtons({ onCancel, submitLabel, busyLabel, busy = false, disabled = false }) {
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={busy || disabled}
        className="px-4 py-2 text-sm font-semibold text-white bg-[#007bff] rounded-lg hover:bg-blue-600 disabled:opacity-60"
      >
        {busy ? busyLabel || "Saving…" : submitLabel}
      </button>
    </>
  );
}
