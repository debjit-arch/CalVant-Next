// useDocChecker.js
import { useState, useCallback, useRef } from "react";

const DOC_CHECKER_BASE = "https://api.calvant.com/doc-checker-service/api/doc-checker";

export const APPROVAL_THRESHOLD = 75;

function authHeaders() {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function postCheck(payload) {
  const res = await fetch(`${DOC_CHECKER_BASE}/check`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Doc check failed (HTTP ${res.status})`);
  }
  return res.json();
}

async function getLatest(docId) {
  const res = await fetch(`${DOC_CHECKER_BASE}/results/latest/${docId}`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch latest result (HTTP ${res.status})`);
  return res.json();
}

export function useDocChecker() {
  const [results,   setResults]   = useState({});
  const [verifying, setVerifying] = useState({});
  const [errors,    setErrors]    = useState({});

  // Only used to deduplicate hydration calls — NOT used to guard state updates
  const hydratedRef = useRef(new Set());

  const hydrateDocs = useCallback(async (docIds) => {
    const pending = docIds.filter((id) => id && !hydratedRef.current.has(id));
    if (pending.length === 0) return;
    pending.forEach((id) => hydratedRef.current.add(id));

    const settled = await Promise.allSettled(
      pending.map((id) => getLatest(id).then((r) => ({ id, result: r })))
    );

    const updates = {};
    settled.forEach((s) => {
      if (s.status === "fulfilled" && s.value.result) {
        updates[s.value.id] = s.value.result;
      } else if (s.status === "rejected") {
        console.warn("[useDocChecker] hydrateDocs error:", s.reason?.message);
      }
      // 404 → result is null → silent, row shows Verify button
    });

    if (Object.keys(updates).length > 0) {
      setResults((prev) => ({ ...prev, ...updates }));
    }
  }, []);

  const verify = useCallback(async (row) => {
    const { docId } = row;
    if (!docId) {
      console.error("[useDocChecker] verify() called without docId", row);
      return null;
    }

    setVerifying((prev) => ({ ...prev, [docId]: true }));
    setErrors((prev)    => ({ ...prev, [docId]: null }));

    try {
      const payload = {
        docId,
        docUrl:         row.docUrl,
        mldDocName:     row.docName,
        organizationId: row.organizationId,
        soaId:          row.soaId,
        controlId:      row.controlId,
      };
      const result = await postCheck(payload);
      // No mountedRef guard — React 18 handles unmounted updates as no-ops
      setResults((prev) => ({ ...prev, [docId]: result }));
      hydratedRef.current.add(docId);
      return result;
    } catch (e) {
      setErrors((prev) => ({ ...prev, [docId]: e.message }));
      return null;
    } finally {
      // This ALWAYS runs — no mountedRef to block it
      setVerifying((prev) => ({ ...prev, [docId]: false }));
    }
  }, []);

  const getResult   = useCallback((docId) => results[docId],     [results]);
  const isVerifying = useCallback((docId) => !!verifying[docId], [verifying]);
  const getError    = useCallback((docId) => errors[docId],      [errors]);

  const canApprove = useCallback((docId) => {
    const r = results[docId];
    if (!r) return false;
    return r.titleMatch === true && (r.overallScore ?? 0) >= APPROVAL_THRESHOLD;
  }, [results]);

  const getBlockReason = useCallback((docId) => {
    const r = results[docId];
    if (!r) return "This document has not been verified yet. Click Verify in the Quality Check column to run the check.";
    const reasons = [];
    if (!r.titleMatch) {
      reasons.push(
        `Title mismatch: the MLD expects "${r.mldDocName}" but the document title is "${r.extractedDocTitle}" (${r.titleMatchScore}% similarity).`
      );
    }
    if ((r.overallScore ?? 0) < APPROVAL_THRESHOLD) {
      reasons.push(
        `Score is ${r.overallScore}% — below the required ${APPROVAL_THRESHOLD}% to approve.`
      );
    }
    return reasons.join(" ");
  }, [results]);

  return {
    verify,
    hydrateDocs,
    getResult,
    isVerifying,
    getError,
    canApprove,
    getBlockReason,
  };
}