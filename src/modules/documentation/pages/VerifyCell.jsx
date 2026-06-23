// // VerifyCell.jsx
// import React, { useState } from "react";
// import { RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
// import { APPROVAL_THRESHOLD } from "./useDocChecker";

// function scoreColor(score, titleMatch) {
//   if (!titleMatch)                 return { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" };
//   if (score >= APPROVAL_THRESHOLD) return { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" };
//   if (score >= 50)                 return { bg: "#fef9c3", color: "#854d0e", border: "#fde047" };
//   return                                  { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" };
// }

// // ── VerifyCell ────────────────────────────────────────────────────────────────
// // Receives result/busy/error as plain props — no hook reads inside.
// // Parent (MLD) reads from checker state and passes values down, so React's
// // normal prop-diffing guarantees a re-render when verify() resolves.
// export function VerifyCell({ row, onVerify, result, busy, error }) {
//   const [showBreakdown, setShowBreakdown] = useState(false);

//   // ── Spinner ───────────────────────────────────────────────────────────────
//   if (busy) {
//     return (
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
//         <RefreshCw size={14} style={{ color: "#667eea", animation: "spin 0.9s linear infinite" }} />
//         <span style={{ fontSize: 11, color: "#667eea", fontWeight: 600 }}>Checking…</span>
//         <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//       </div>
//     );
//   }

//   // ── No result yet ─────────────────────────────────────────────────────────
//   if (!result) {
//     return (
//       <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
//         <button
//           onClick={(e) => { e.stopPropagation(); onVerify(row); }}
//           style={{
//             padding: "5px 14px", borderRadius: 6,
//             border: "1.5px solid #667eea", background: "#fff",
//             color: "#667eea", fontWeight: 700, fontSize: 11,
//             cursor: "pointer", whiteSpace: "nowrap",
//           }}
//         >
//           Verify
//         </button>
//         {error && (
//           <span style={{ fontSize: 9, color: "#c92a2a", maxWidth: 120, textAlign: "center" }}>
//             {error}
//           </span>
//         )}
//       </div>
//     );
//   }

//   // ── Score badge ───────────────────────────────────────────────────────────
//   const colors = scoreColor(result.overallScore, result.titleMatch);
//   const passed = result.titleMatch && result.overallScore >= APPROVAL_THRESHOLD;

//   return (
//     <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
//       <button
//         onClick={() => setShowBreakdown(true)}
//         title="Click to see score breakdown"
//         style={{
//           display: "flex", alignItems: "center", gap: 5,
//           fontSize: 12, fontWeight: 700,
//           background: colors.bg, color: colors.color,
//           border: `1.5px solid ${colors.border}`,
//           padding: "4px 10px", borderRadius: 12, cursor: "pointer",
//         }}
//       >
//         {passed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
//         {result.overallScore}%
//       </button>

//       <button
//         onClick={(e) => { e.stopPropagation(); onVerify(row); }}
//         style={{
//           fontSize: 9, color: "#868e96", background: "none",
//           border: "none", cursor: "pointer",
//           textDecoration: "underline", padding: 0,
//         }}
//       >
//         Re-verify
//       </button>

//       {showBreakdown && (
//         <ScoreBreakdownModal result={result} onClose={() => setShowBreakdown(false)} />
//       )}
//     </div>
//   );
// }

// // ── Score breakdown modal ─────────────────────────────────────────────────────
// function ScoreBreakdownModal({ result, onClose }) {
//   const breakdown = result.scoreBreakdown || {};
//   const feedback  = result.feedback || {};
//   const passed    = result.titleMatch && result.overallScore >= APPROVAL_THRESHOLD;

//   return (
//     <div
//       onClick={onClose}
//       style={{
//         position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
//         display: "flex", alignItems: "center", justifyContent: "center",
//         zIndex: 10010, padding: 20,
//       }}
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         style={{
//           background: "#fff", borderRadius: 14, width: "100%", maxWidth: 560,
//           maxHeight: "85vh", overflowY: "auto",
//           boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
//           fontFamily: "'DM Sans', sans-serif",
//         }}
//       >
//         {/* Header */}
//         <div style={{
//           padding: "18px 22px", borderBottom: "1px solid #eee",
//           display: "flex", justifyContent: "space-between", alignItems: "center",
//         }}>
//           <div>
//             <div style={{ fontSize: 16, fontWeight: 800 }}>Document Quality Check</div>
//             <div style={{ fontSize: 12, color: "#868e96", marginTop: 2 }}>
//               Checked {result.checkedAt ? new Date(result.checkedAt).toLocaleString() : "—"}
//             </div>
//           </div>
//           <div style={{ fontSize: 22, fontWeight: 800, color: passed ? "#065f46" : "#991b1b" }}>
//             {result.overallScore}%
//           </div>
//         </div>

//         <div style={{ padding: "16px 22px" }}>
//           {/* Title match */}
//           <div style={{
//             display: "flex", alignItems: "flex-start", gap: 8,
//             padding: "10px 12px", borderRadius: 8, marginBottom: 16,
//             background: result.titleMatch ? "#ecfdf5" : "#fff5f5",
//             border: `1px solid ${result.titleMatch ? "#a7f3d0" : "#fca5a5"}`,
//           }}>
//             {result.titleMatch
//               ? <CheckCircle2 size={16} style={{ color: "#065f46", flexShrink: 0, marginTop: 1 }} />
//               : <AlertTriangle size={16} style={{ color: "#991b1b", flexShrink: 0, marginTop: 1 }} />}
//             <div style={{ fontSize: 12.5, color: "#343a40" }}>
//               <strong>Title match: {result.titleMatchScore}%</strong>
//               <div style={{ marginTop: 2, color: "#495057" }}>
//                 MLD: "{result.mldDocName}" {result.titleMatch ? "✓ matches" : "✗ vs"} extracted: "{result.extractedDocTitle}"
//               </div>
//             </div>
//           </div>

//           {/* Criteria */}
//           {Object.keys(breakdown).length > 0 && (
//             <div style={{ display: "grid", gap: 8 }}>
//               {Object.entries(breakdown)
//                 .filter(([key]) => key !== "titleMatch")
//                 .map(([key, score]) => (
//                   <div key={key} style={{ padding: "8px 10px", background: "#f8f9fa", borderRadius: 6 }}>
//                     <div style={{
//                       display: "flex", justifyContent: "space-between",
//                       fontSize: 12, fontWeight: 700, color: "#343a40",
//                     }}>
//                       <span>{labelize(key)}</span>
//                       <span style={{
//                         color: score >= 10 ? "#065f46" : score >= 5 ? "#854d0e" : "#991b1b",
//                         fontWeight: 800,
//                       }}>
//                         {score} pts
//                       </span>
//                     </div>
//                     {feedback[key] && (
//                       <div style={{ fontSize: 11.5, color: "#6c757d", marginTop: 3 }}>
//                         {feedback[key]}
//                       </div>
//                     )}
//                   </div>
//                 ))}
//             </div>
//           )}

//           {/* Pass/fail summary */}
//           <div style={{
//             marginTop: 14, padding: "8px 12px", borderRadius: 6,
//             background: passed ? "#ecfdf5" : "#fff5f5",
//             border: `1px solid ${passed ? "#a7f3d0" : "#fca5a5"}`,
//             fontSize: 12, color: passed ? "#065f46" : "#991b1b", fontWeight: 600,
//           }}>
//             {passed
//               ? `✓ Passes approval threshold (≥${APPROVAL_THRESHOLD}%)`
//               : `✗ Below approval threshold — needs ≥${APPROVAL_THRESHOLD}% (currently ${result.overallScore}%)`}
//           </div>
//         </div>

//         <div style={{ padding: "14px 22px 18px", textAlign: "right" }}>
//           <button onClick={onClose} style={{
//             padding: "8px 18px", borderRadius: 8,
//             border: "1.5px solid #e9ecef", background: "#fff",
//             color: "#495057", fontWeight: 700, fontSize: 13, cursor: "pointer",
//           }}>
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function labelize(key) {
//   return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
// }

// // ── ApproveGateModal ──────────────────────────────────────────────────────────
// export function ApproveGateModal({ docId, checker, onClose }) {
//   const reason = checker.getBlockReason(docId);
//   const result = checker.getResult(docId);

//   return (
//     <div
//       onClick={onClose}
//       style={{
//         position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
//         display: "flex", alignItems: "center", justifyContent: "center",
//         zIndex: 10020, padding: 20,
//       }}
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         style={{
//           background: "#fff", borderRadius: 14, width: "100%", maxWidth: 460,
//           boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
//           fontFamily: "'DM Sans', sans-serif",
//           padding: "24px 26px",
//         }}
//       >
//         <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
//           <div style={{
//             width: 40, height: 40, borderRadius: 10, background: "#fee2e2",
//             display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
//           }}>
//             <AlertTriangle size={20} style={{ color: "#c92a2a" }} />
//           </div>
//           <div>
//             <div style={{ fontSize: 16, fontWeight: 800, color: "#212529" }}>Cannot approve yet</div>
//             <div style={{ fontSize: 13, color: "#495057", marginTop: 8, lineHeight: 1.5 }}>
//               {reason}
//             </div>
//             {result && (
//               <div style={{ marginTop: 12, fontSize: 12, color: "#868e96" }}>
//                 Required: {APPROVAL_THRESHOLD}%+ with matching title.
//                 Current: <strong>{result.overallScore}%</strong>
//               </div>
//             )}
//           </div>
//         </div>
//         <div style={{ marginTop: 20, textAlign: "right" }}>
//           <button onClick={onClose} style={{
//             padding: "8px 20px", borderRadius: 8, border: "none",
//             background: "#212529", color: "#fff",
//             fontWeight: 700, fontSize: 13, cursor: "pointer",
//           }}>
//             Got it
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


// VerifyCell.jsx
import React, { useState } from "react";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Shield } from "lucide-react";
import { APPROVAL_THRESHOLD } from "./useDocChecker";

// Criteria display config — order + labels + max pts
const CRITERIA_CONFIG = [
  { key: "policyStatements",         label: "Policy Statements",          max: 80 },
  { key: "purposeAndScope",          label: "Purpose & Scope",            max:  5 },
  { key: "rolesAndResponsibilities", label: "Roles & Responsibilities",   max:  5 },
  { key: "reviewAndApproval",        label: "Review & Approval",          max:  5 },
  { key: "documentControl",          label: "Document Control",           max:  5 },
];

function scoreColor(score, titleMatch) {
  if (!titleMatch)                 return { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" };
  if (score >= APPROVAL_THRESHOLD) return { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" };
  if (score >= 60)                 return { bg: "#fef9c3", color: "#854d0e", border: "#fde047" };
  return                                  { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" };
}

function criterionColor(score, max) {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.85) return "#065f46";
  if (pct >= 0.60) return "#854d0e";
  return "#991b1b";
}

// ── VerifyCell ────────────────────────────────────────────────────────────────
export function VerifyCell({ row, onVerify, result, busy, error }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  // ── Spinner ───────────────────────────────────────────────────────────────
  if (busy) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <RefreshCw size={14} style={{ color: "#667eea", animation: "spin 0.9s linear infinite" }} />
        <span style={{ fontSize: 11, color: "#667eea", fontWeight: 600 }}>Checking…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── No result yet ─────────────────────────────────────────────────────────
  if (!result) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onVerify(row); }}
          style={{
            padding: "5px 14px", borderRadius: 6,
            border: "1.5px solid #667eea", background: "#fff",
            color: "#667eea", fontWeight: 700, fontSize: 11,
            cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          Verify
        </button>
        {error && (
          <span style={{ fontSize: 9, color: "#c92a2a", maxWidth: 120, textAlign: "center" }}>
            {error}
          </span>
        )}
      </div>
    );
  }

  // ── Score badge ───────────────────────────────────────────────────────────
  const colors = scoreColor(result.overallScore, result.titleMatch);
  const passed = result.titleMatch && result.overallScore >= APPROVAL_THRESHOLD;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <button
        onClick={() => setShowBreakdown(true)}
        title="Click to see score breakdown"
        style={{
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 12, fontWeight: 700,
          background: colors.bg, color: colors.color,
          border: `1.5px solid ${colors.border}`,
          padding: "4px 10px", borderRadius: 12, cursor: "pointer",
        }}
      >
        {passed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
        {result.overallScore} / 100
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onVerify(row); }}
        style={{
          fontSize: 9, color: "#868e96", background: "none",
          border: "none", cursor: "pointer",
          textDecoration: "underline", padding: 0,
        }}
      >
        Re-verify
      </button>

      {showBreakdown && (
        <ScoreBreakdownModal result={result} onClose={() => setShowBreakdown(false)} />
      )}
    </div>
  );
}

// ── Score Breakdown Modal ─────────────────────────────────────────────────────
function ScoreBreakdownModal({ result, onClose }) {
  const breakdown = result.scoreBreakdown || {};
  // Use maxBreakdown from server if available, otherwise fall back to CRITERIA_CONFIG defaults
  const maxBreakdown = result.maxBreakdown || {};
  const feedback     = result.feedback || {};
  const passed       = result.titleMatch && result.overallScore >= APPROVAL_THRESHOLD;

  const totalMax = CRITERIA_CONFIG.reduce((sum, c) => sum + c.max, 0); // 100

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10010, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
          maxHeight: "88vh", overflowY: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
          fontFamily: "'DM Sans', 'Inter', sans-serif",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 4,
            }}>
              <Shield size={18} style={{ color: "#667eea" }} />
              <span style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>
                Document Quality Check
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              Checked {result.checkedAt ? new Date(result.checkedAt).toLocaleString() : "—"}
            </div>
          </div>

          {/* Overall score pill */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4,
          }}>
            <div style={{
              fontSize: 26, fontWeight: 900,
              color: passed ? "#065f46" : result.overallScore >= 60 ? "#854d0e" : "#991b1b",
              lineHeight: 1,
            }}>
              {result.overallScore}
              <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}> / {totalMax}</span>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
              padding: "2px 8px", borderRadius: 20,
              background: passed ? "#d1fae5" : result.overallScore >= 60 ? "#fef9c3" : "#fee2e2",
              color: passed ? "#065f46" : result.overallScore >= 60 ? "#854d0e" : "#991b1b",
            }}>
              {result.status}
            </span>
          </div>
        </div>

        <div style={{ padding: "18px 24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Section 1: Title Score ──────────────────────────────────── */}
          <Section label="Title Score">
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px 14px", borderRadius: 10,
              background: result.titleMatch ? "#f0fdf4" : "#fff5f5",
              border: `1.5px solid ${result.titleMatch ? "#86efac" : "#fca5a5"}`,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: result.titleMatch ? "#dcfce7" : "#fee2e2",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {result.titleMatch
                  ? <CheckCircle2 size={15} style={{ color: "#16a34a" }} />
                  : <XCircle     size={15} style={{ color: "#dc2626" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: result.titleMatch ? "#15803d" : "#b91c1c",
                  marginBottom: 4,
                }}>
                  {result.titleMatch ? "Title Matched" : "Title Mismatch"}
                </div>
                <div style={{ fontSize: 11.5, color: "#4b5563", lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600 }}>MLD:</span>{" "}
                  <span style={{ color: "#111827" }}>"{result.mldDocName}"</span>
                </div>
                <div style={{ fontSize: 11.5, color: "#4b5563", lineHeight: 1.5, marginTop: 1 }}>
                  <span style={{ fontWeight: 600 }}>Extracted:</span>{" "}
                  <span style={{ color: "#111827" }}>
                    "{result.extractedDocTitle || "—"}"
                  </span>
                </div>
                {!result.titleMatch && (
                  <div style={{
                    marginTop: 6, fontSize: 11, color: "#b91c1c",
                    background: "#fee2e2", borderRadius: 6, padding: "4px 8px",
                    display: "inline-block",
                  }}>
                    Document cannot be approved until title matches.
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* ── Section 2: Content Score ────────────────────────────────── */}
          <Section label="Content Score">
            {/* Content total bar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 10,
            }}>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
                Total content score
              </span>
              <span style={{
                fontSize: 13, fontWeight: 800,
                color: result.overallScore >= APPROVAL_THRESHOLD ? "#065f46"
                     : result.overallScore >= 60 ? "#854d0e" : "#991b1b",
              }}>
                {result.overallScore} / {totalMax}
              </span>
            </div>

            {/* Progress bar */}
            <div style={{
              height: 6, borderRadius: 99, background: "#f3f4f6",
              marginBottom: 14, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 99,
                width: `${Math.min(result.overallScore, 100)}%`,
                background: result.overallScore >= APPROVAL_THRESHOLD ? "#10b981"
                           : result.overallScore >= 60 ? "#f59e0b" : "#ef4444",
                transition: "width 0.4s ease",
              }} />
            </div>

            {/* Per-criterion rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CRITERIA_CONFIG.map(({ key, label, max: defaultMax }) => {
                const achieved = breakdown[key] ?? 0;
                const maxPts   = maxBreakdown[key] ?? defaultMax;
                const pct      = maxPts > 0 ? achieved / maxPts : 0;
                const color    = criterionColor(achieved, maxPts);
                const fb       = feedback[key];

                return (
                  <div key={key} style={{
                    padding: "10px 12px", borderRadius: 8,
                    background: "#f9fafb",
                    border: "1px solid #f3f4f6",
                  }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: fb ? 5 : 0,
                    }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#374151" }}>
                        {label}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {/* Mini bar */}
                        <div style={{
                          width: 60, height: 4, borderRadius: 99,
                          background: "#e5e7eb", overflow: "hidden",
                        }}>
                          <div style={{
                            height: "100%", borderRadius: 99,
                            width: `${Math.round(pct * 100)}%`,
                            background: color,
                          }} />
                        </div>
                        {/* Score chip */}
                        <span style={{
                          fontSize: 12, fontWeight: 800, color,
                          minWidth: 46, textAlign: "right",
                        }}>
                          {achieved} / {maxPts}
                        </span>
                      </div>
                    </div>
                    {fb && (
                      <div style={{ fontSize: 11.5, color: "#6b7280", lineHeight: 1.5 }}>
                        {fb}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── Pass / Fail summary ─────────────────────────────────────── */}
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            background: passed ? "#f0fdf4" : "#fff5f5",
            border: `1.5px solid ${passed ? "#86efac" : "#fca5a5"}`,
            fontSize: 12.5, fontWeight: 600,
            color: passed ? "#15803d" : "#b91c1c",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {passed
              ? <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              : <XCircle      size={15} style={{ flexShrink: 0 }} />}
            {passed
              ? `Passes approval threshold — content ≥ ${APPROVAL_THRESHOLD}/100 with matching title.`
              : `Cannot approve — requires content ≥ ${APPROVAL_THRESHOLD}/100 and a matching title.`}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: "14px 24px 18px",
          borderTop: "1px solid #f0f0f0",
          textAlign: "right",
        }}>
          <button onClick={onClose} style={{
            padding: "8px 22px", borderRadius: 8,
            border: "1.5px solid #e5e7eb", background: "#fff",
            color: "#374151", fontWeight: 700, fontSize: 13,
            cursor: "pointer",
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
        textTransform: "uppercase", color: "#9ca3af",
        marginBottom: 8,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

// ── ApproveGateModal ──────────────────────────────────────────────────────────
export function ApproveGateModal({ docId, checker, onClose }) {
  const reason = checker.getBlockReason(docId);
  const result = checker.getResult(docId);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10020, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 14, width: "100%", maxWidth: 460,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          padding: "24px 26px",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: "#fee2e2",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <AlertTriangle size={20} style={{ color: "#c92a2a" }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#212529" }}>Cannot approve yet</div>
            <div style={{ fontSize: 13, color: "#495057", marginTop: 8, lineHeight: 1.6 }}>
              {reason}
            </div>
            {result && (
              <div style={{
                marginTop: 12, fontSize: 12, color: "#868e96",
                padding: "8px 12px", background: "#f9fafb",
                borderRadius: 8, border: "1px solid #f3f4f6",
              }}>
                Required: content ≥ <strong>{APPROVAL_THRESHOLD}/100</strong> + title match.
                <br />
                Current: content <strong>{result.overallScore}/100</strong>
                {" · "}title{" "}
                <strong style={{ color: result.titleMatch ? "#15803d" : "#b91c1c" }}>
                  {result.titleMatch ? "matched" : "not matched"}
                </strong>
              </div>
            )}
          </div>
        </div>
        <div style={{ marginTop: 20, textAlign: "right" }}>
          <button onClick={onClose} style={{
            padding: "8px 20px", borderRadius: 8, border: "none",
            background: "#111827", color: "#fff",
            fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}