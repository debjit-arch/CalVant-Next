//--------------------------------------------=-----------------------+++++-----------------------------------------------------
//Working Model
// import React, { useState } from "react";
// import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Shield } from "lucide-react";
// import { APPROVAL_THRESHOLD } from "./useDocChecker";

// // ── Criteria config ───────────────────────────────────────────────────────────
// const CRITERIA_CONFIG = [
//   { key: "policyStatements",         label: "Policy Statements",        max: 80 },
//   { key: "purposeAndScope",          label: "Purpose & Scope",          max:  5 },
//   { key: "rolesAndResponsibilities", label: "Roles & Responsibilities", max:  5 },
//   { key: "reviewAndApproval",        label: "Review & Approval",        max:  5 },
//   { key: "documentControl",          label: "Document Control",         max:  5 },
// ];

// // ── ✅ CHANGE 1: Grade system ─────────────────────────────────────────────────
// const GRADE_BANDS = [
//   { min: 95, grade: "A+", color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", label: "Excellent" },
//   { min: 85, grade: "A",  color: "#0f766e", bg: "#ccfbf1", border: "#5eead4", label: "Very Good" },
//   { min: 75, grade: "B+", color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd", label: "Good"      },
//   { min: 65, grade: "B",  color: "#4338ca", bg: "#e0e7ff", border: "#a5b4fc", label: "Fair"      },
//   { min: 55, grade: "C+", color: "#854d0e", bg: "#fef9c3", border: "#fde047", label: "Marginal"  },
//   { min: 40, grade: "C",  color: "#92400e", bg: "#fef3c7", border: "#fcd34d", label: "Weak"      },
//   { min:  0, grade: "D",  color: "#991b1b", bg: "#fee2e2", border: "#fca5a5", label: "Poor"      },
// ];

// function getGrade(score) {
//   return GRADE_BANDS.find(b => score >= b.min) || GRADE_BANDS[GRADE_BANDS.length - 1];
// }

// function getPct(score) {
//   return Math.round(score);
// }

// function scoreColor(score, titleMatch) {
//   if (!titleMatch) return { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" };
//   const g = getGrade(score);
//   return { bg: g.bg, color: g.color, border: g.border };
// }

// function criterionColor(score, max) {
//   const pct = max > 0 ? score / max : 0;
//   if (pct >= 0.85) return "#065f46";
//   if (pct >= 0.60) return "#854d0e";
//   return "#991b1b";
// }

// // ── ✅ CHANGE 2+3: bullet splitter ───────────────────────────────────────────
// function splitFeedbackIntoBullets(fb) {
//   if (!fb) return [];
//   const markers = [
//     "Missing:", "Logic issue:", "Present but weak:",
//     "Recommendation:", "Control gap:"
//   ];
//   const regex = new RegExp(
//     `(?=${markers.map(m => m.replace(":", "\\:")).join("|")})`, "g"
//   );
//   return fb
//     .split(regex)
//     .map(s => s.trim().replace(/\.$/, "").trim())
//     .filter(Boolean);
// }

// // ── VerifyCell ────────────────────────────────────────────────────────────────
// export function VerifyCell({ row, onVerify, result, busy, error }) {
//   const [showBreakdown, setShowBreakdown] = useState(false);

//   if (busy) {
//     return (
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
//         <RefreshCw size={14} style={{ color: "#667eea", animation: "spin 0.9s linear infinite" }} />
//         <span style={{ fontSize: 11, color: "#667eea", fontWeight: 600 }}>Checking…</span>
//         <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//       </div>
//     );
//   }

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

//   // ✅ CHANGE 1: grade badge in table cell
//   const grade  = getGrade(result.overallScore);
//   const pct    = getPct(result.overallScore);
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
//         <span style={{ fontWeight: 900 }}>{grade.grade}</span>
//         <span style={{ fontWeight: 500, opacity: 0.8 }}>· {pct}%</span>
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

// // ── Score Breakdown Modal ─────────────────────────────────────────────────────
// function ScoreBreakdownModal({ result, onClose }) {
//   const breakdown    = result.scoreBreakdown || {};
//   const maxBreakdown = result.maxBreakdown   || {};
//   const feedback     = result.feedback       || {};
//   const passed       = result.titleMatch && result.overallScore >= APPROVAL_THRESHOLD;
//   const grade        = getGrade(result.overallScore);
//   const pct          = getPct(result.overallScore);

//   return (
//     <div
//       onClick={onClose}
//       style={{
//         position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
//         display: "flex", alignItems: "center", justifyContent: "center",
//         zIndex: 10010, padding: 20,
//       }}
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         style={{
//           background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
//           maxHeight: "88vh", overflowY: "auto",
//           boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
//           fontFamily: "'DM Sans', 'Inter', sans-serif",
//         }}
//       >
//         {/* ── Header ─────────────────────────────────────────────────────── */}
//         <div style={{
//           padding: "20px 24px 16px",
//           borderBottom: "1px solid #f0f0f0",
//           display: "flex", justifyContent: "space-between", alignItems: "flex-start",
//         }}>
//           <div>
//             <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
//               <Shield size={18} style={{ color: "#667eea" }} />
//               <span style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>
//                 Document Quality Check
//               </span>
//             </div>
//             <div style={{ fontSize: 12, color: "#9ca3af" }}>
//               Checked {result.checkedAt ? new Date(result.checkedAt).toLocaleString() : "—"}
//             </div>
//           </div>

//           {/* ✅ CHANGE 1: grade + % replaces raw score */}
//           <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
//             <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
//               <span style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, color: grade.color }}>
//                 {grade.grade}
//               </span>
//               <span style={{ fontSize: 16, fontWeight: 700, color: "#6b7280" }}>
//                 {pct}%
//               </span>
//             </div>
//             <span style={{
//               fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
//               padding: "2px 10px", borderRadius: 20,
//               background: grade.bg, color: grade.color, border: `1.5px solid ${grade.border}`,
//             }}>
//               {grade.label}
//             </span>
//           </div>
//         </div>

//         <div style={{ padding: "18px 24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

//           {/* ── Title Score ─────────────────────────────────────────────── */}
//           <Section label="Title Score">
//             <div style={{
//               display: "flex", alignItems: "flex-start", gap: 10,
//               padding: "12px 14px", borderRadius: 10,
//               background: result.titleMatch ? "#f0fdf4" : "#fff5f5",
//               border: `1.5px solid ${result.titleMatch ? "#86efac" : "#fca5a5"}`,
//             }}>
//               <div style={{
//                 width: 28, height: 28, borderRadius: 8, flexShrink: 0,
//                 background: result.titleMatch ? "#dcfce7" : "#fee2e2",
//                 display: "flex", alignItems: "center", justifyContent: "center",
//               }}>
//                 {result.titleMatch
//                   ? <CheckCircle2 size={15} style={{ color: "#16a34a" }} />
//                   : <XCircle      size={15} style={{ color: "#dc2626" }} />}
//               </div>
//               <div style={{ flex: 1, minWidth: 0 }}>
//                 <div style={{
//                   fontSize: 13, fontWeight: 700,
//                   color: result.titleMatch ? "#15803d" : "#b91c1c", marginBottom: 4,
//                 }}>
//                   {result.titleMatch ? "Title Matched" : "Title Mismatch"}
//                 </div>
//                 <div style={{ fontSize: 11.5, color: "#4b5563", lineHeight: 1.5 }}>
//                   <span style={{ fontWeight: 600 }}>MLD:</span>{" "}
//                   <span style={{ color: "#111827" }}>"{result.mldDocName}"</span>
//                 </div>
//                 <div style={{ fontSize: 11.5, color: "#4b5563", lineHeight: 1.5, marginTop: 1 }}>
//                   <span style={{ fontWeight: 600 }}>Extracted:</span>{" "}
//                   <span style={{ color: "#111827" }}>"{result.extractedDocTitle || "—"}"</span>
//                 </div>
//                 {!result.titleMatch && (
//                   <div style={{
//                     marginTop: 6, fontSize: 11, color: "#b91c1c",
//                     background: "#fee2e2", borderRadius: 6, padding: "4px 8px",
//                     display: "inline-block",
//                   }}>
//                     Document cannot be approved until title matches.
//                   </div>
//                 )}
//               </div>
//             </div>
//           </Section>

//           {/* ── Content Score ───────────────────────────────────────────── */}
//           <Section label="Content Score">

//             {/* ✅ CHANGE 1: show % not raw pts */}
//             <div style={{
//               display: "flex", alignItems: "center", justifyContent: "space-between",
//               marginBottom: 10,
//             }}>
//               <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
//                 Overall content score
//               </span>
//               <span style={{ fontSize: 14, fontWeight: 800, color: grade.color }}>
//                 {pct}%
//               </span>
//             </div>

//             <div style={{
//               height: 6, borderRadius: 99, background: "#f3f4f6",
//               marginBottom: 14, overflow: "hidden",
//             }}>
//               <div style={{
//                 height: "100%", borderRadius: 99,
//                 width: `${Math.min(result.overallScore, 100)}%`,
//                 background: result.overallScore >= APPROVAL_THRESHOLD ? "#10b981"
//                            : result.overallScore >= 60 ? "#f59e0b" : "#ef4444",
//                 transition: "width 0.4s ease",
//               }} />
//             </div>

//             {/* ✅ CHANGE 1 + 2 + 3: per-criterion rows */}
//             <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//               {CRITERIA_CONFIG.map(({ key, label, max: defaultMax }) => {
//                 const achieved         = breakdown[key] ?? 0;
//                 const maxPts           = maxBreakdown[key] ?? defaultMax;
//                 const pctCrit          = maxPts > 0 ? achieved / maxPts : 0;
//                 const color            = criterionColor(achieved, maxPts);
//                 const fb               = feedback[key];
//                 const isFullScore      = achieved >= maxPts;          // ✅ CHANGE 3
//                 const isPolicyStmt     = key === "policyStatements";
//                 const bulletPoints     = (!isFullScore && isPolicyStmt)
//                   ? splitFeedbackIntoBullets(fb)
//                   : [];

//                 return (
//                   <div key={key} style={{
//                     padding: "10px 12px", borderRadius: 8,
//                     background: "#f9fafb", border: "1px solid #f3f4f6",
//                   }}>
//                     <div style={{
//                       display: "flex", justifyContent: "space-between",
//                       alignItems: "center",
//                       marginBottom: (!isFullScore && fb) ? 6 : 0,
//                     }}>
//                       <span style={{ fontSize: 12.5, fontWeight: 700, color: "#374151" }}>
//                         {label}
//                       </span>
//                       <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                         <div style={{
//                           width: 60, height: 4, borderRadius: 99,
//                           background: "#e5e7eb", overflow: "hidden",
//                         }}>
//                           <div style={{
//                             height: "100%", borderRadius: 99,
//                             width: `${Math.round(pctCrit * 100)}%`,
//                             background: color,
//                           }} />
//                         </div>
//                         {/* ✅ CHANGE 1: % instead of X/Y */}
//                         <span style={{
//                           fontSize: 12, fontWeight: 800, color,
//                           minWidth: 40, textAlign: "right",
//                         }}>
//                           {Math.round(pctCrit * 100)}%
//                         </span>
//                       </div>
//                     </div>

//                     {/* ✅ CHANGE 3: full-score → no feedback, just green tick */}
//                     {isFullScore ? (
//                       <div style={{
//                         fontSize: 11, color: "#16a34a", marginTop: 4,
//                         display: "flex", alignItems: "center", gap: 4,
//                       }}>
//                         <CheckCircle2 size={11} />
//                         No issues found
//                       </div>
//                     ) : fb && (
//                       /* ✅ CHANGE 2: left-aligned bullets for policyStatements; plain text for others */
//                       isPolicyStmt && bulletPoints.length > 1 ? (
//                         <ul style={{
//                           margin: 0, paddingLeft: 18,
//                           display: "flex", flexDirection: "column", gap: 4,
//                         }}>
//                           {bulletPoints.map((point, i) => (
//                             <li key={i} style={{
//                               fontSize: 11.5, color: "#6b7280",
//                               lineHeight: 1.55, listStyleType: "disc",
//                               textAlign: "left",
//                             }}>
//                               {point}
//                             </li>
//                           ))}
//                         </ul>
//                       ) : (
//                         <div style={{
//                           fontSize: 11.5, color: "#6b7280",
//                           lineHeight: 1.5, marginTop: 2, textAlign: "left",
//                         }}>
//                           {fb}
//                         </div>
//                       )
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           </Section>

//           {/* ── ✅ CHANGE 5: clean pass/fail banner ─────────────────────── */}
//           <div style={{
//             padding: "10px 14px", borderRadius: 8,
//             background: passed ? "#f0fdf4" : "#fff5f5",
//             border: `1.5px solid ${passed ? "#86efac" : "#fca5a5"}`,
//             fontSize: 12.5, fontWeight: 600,
//             color: passed ? "#15803d" : "#b91c1c",
//             display: "flex", alignItems: "center", gap: 8,
//           }}>
//             {passed
//               ? <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
//               : <XCircle      size={15} style={{ flexShrink: 0 }} />}
//             {passed
//               ? "Passes approval — title matched and content score meets the required threshold."
//               : `Cannot approve — content score ${pct}% is below the required threshold, or title does not match.`}
//           </div>

//           {/* ── ✅ CHANGE 4: grade range reference table ─────────────────── */}
//           <div style={{ borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
//             <div style={{
//               padding: "8px 14px", background: "#f8f9fa",
//               borderBottom: "1px solid #e5e7eb",
//               fontSize: 11, fontWeight: 700,
//               letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af",
//             }}>
//               Grade Reference
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
//               {GRADE_BANDS.map((band, i) => {
//                 const isCurrentGrade =
//                   result.overallScore >= band.min &&
//                   (i === 0 || result.overallScore < GRADE_BANDS[i - 1].min);
//                 return (
//                   <div key={band.grade} style={{
//                     padding: "8px 4px", textAlign: "center",
//                     background: isCurrentGrade ? band.bg : "#fff",
//                     borderRight: i < GRADE_BANDS.length - 1 ? "1px solid #f3f4f6" : "none",
//                   }}>
//                     <div style={{
//                       fontSize: 15, fontWeight: 900,
//                       color: isCurrentGrade ? band.color : "#9ca3af",
//                     }}>
//                       {band.grade}
//                     </div>
//                     <div style={{
//                       fontSize: 9, fontWeight: 600, marginTop: 2,
//                       color: isCurrentGrade ? band.color : "#c4c9d4",
//                     }}>
//                       {band.min === 0 ? "<40%" : `≥${band.min}%`}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* ── AI Disclaimer ────────────────────────────────────────────── */}
//           <div style={{
//             padding: "10px 14px", borderRadius: 8,
//             background: "#fffbeb", border: "1.5px solid #fde68a",
//             display: "flex", gap: 10, alignItems: "flex-start",
//           }}>
//             <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
//             <p style={{ margin: 0, fontSize: 11, color: "#92400e", lineHeight: 1.6 }}>
//               <strong>AI-generated assessment.</strong> This quality check is produced by a large
//               language model and may contain errors or omissions. Scores are indicative, not
//               definitive. Always have a qualified compliance officer or document owner review
//               the findings before making approval decisions.
//             </p>
//           </div>

//         </div>

//         {/* ── Footer ─────────────────────────────────────────────────────── */}
//         <div style={{
//           padding: "14px 24px 18px", 
//           borderTop: "1px solid #f0f0f0",
//           textAlign: "right",
//         }}>
//           <button onClick={onClose} style={{
//             padding: "8px 22px", borderRadius: 8,
//             border: "1.5px solid #e5e7eb", background: "#fff",
//             color: "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer",
//           }}>
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── Section wrapper ───────────────────────────────────────────────────────────
// function Section({ label, children }) {
//   return (
//     <div>
//       <div style={{
//         fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
//         textTransform: "uppercase", color: "#9ca3af", marginBottom: 8,
//       }}>
//         {label}
//       </div>
//       {children}
//     </div>
//   );
// }

// // ── ApproveGateModal ──────────────────────────────────────────────────────────
// export function ApproveGateModal({ docId, checker, onClose }) {
//   const reason = checker.getBlockReason(docId);
//   const result = checker.getResult(docId);
//   const grade  = result ? getGrade(result.overallScore) : null;

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
//           fontFamily: "'DM Sans', 'Inter', sans-serif",
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
//             <div style={{ fontSize: 13, color: "#495057", marginTop: 8, lineHeight: 1.6 }}>
//               {reason}
//             </div>
//             {result && grade && (
//               <div style={{
//                 marginTop: 12, fontSize: 12, color: "#868e96",
//                 padding: "8px 12px", background: "#f9fafb",
//                 borderRadius: 8, border: "1px solid #f3f4f6",
//               }}>
//                 Grade:{" "}
//                 <strong style={{ color: grade.color }}>
//                   {grade.grade} ({getPct(result.overallScore)}%)
//                 </strong>
//                 {" · "}Required: <strong>≥{APPROVAL_THRESHOLD}%</strong> + title match
//                 <br />
//                 Title:{" "}
//                 <strong style={{ color: result.titleMatch ? "#15803d" : "#b91c1c" }}>
//                   {result.titleMatch ? "matched" : "not matched"}
//                 </strong>
//               </div>
//             )}
//           </div>
//         </div>
//         <div style={{ marginTop: 20, textAlign: "right" }}>
//           <button onClick={onClose} style={{
//             padding: "8px 20px", borderRadius: 8, border: "none",
//             background: "#111827", color: "#fff",
//             fontWeight: 700, fontSize: 13, cursor: "pointer",
//           }}>
//             Got it
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

//+=========///////////////////////+++++++++++++++++++++++++++++++++++++++++++++++++++++++----------------------------------------

// import React, { useState } from "react";
// import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Shield } from "lucide-react";
// import { APPROVAL_THRESHOLD } from "./useDocChecker";

// // ── Criteria config ───────────────────────────────────────────────────────────
// const CRITERIA_CONFIG = [
//   { key: "policyStatements",         label: "Policy Statements",        max: 80 },
//   { key: "purposeAndScope",          label: "Purpose & Scope",          max:  5 },
//   { key: "rolesAndResponsibilities", label: "Roles & Responsibilities", max:  5 },
//   { key: "reviewAndApproval",        label: "Review & Approval",        max:  5 },
//   { key: "documentControl",          label: "Document Control",         max:  5 },
// ];

// // ── Grade system ──────────────────────────────────────────────────────────────
// // UAT feedback: A+ = 90–100, A = 80–90, B = 70–80, C+ = 60–70, C = 50–60,
// //               D+ = 40–50, D = 0–40
// const GRADE_BANDS = [
//   { min: 90, grade: "A+", color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", label: "Excellent" },
//   { min: 80, grade: "A",  color: "#0f766e", bg: "#ccfbf1", border: "#5eead4", label: "Very Good" },
//   { min: 70, grade: "B",  color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd", label: "Good"      },
//   { min: 60, grade: "C+", color: "#4338ca", bg: "#e0e7ff", border: "#a5b4fc", label: "Fair"      },
//   { min: 50, grade: "C",  color: "#854d0e", bg: "#fef9c3", border: "#fde047", label: "Marginal"  },
//   { min: 40, grade: "D+", color: "#92400e", bg: "#fef3c7", border: "#fcd34d", label: "Weak"      },
//   { min:  0, grade: "D",  color: "#991b1b", bg: "#fee2e2", border: "#fca5a5", label: "Poor"      },
// ];

// function getGrade(score) {
//   return GRADE_BANDS.find(b => score >= b.min) || GRADE_BANDS[GRADE_BANDS.length - 1];
// }

// function getPct(score) {
//   return Math.round(score);
// }

// function scoreColor(score, titleMatch) {
//   if (!titleMatch) return { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" };
//   const g = getGrade(score);
//   return { bg: g.bg, color: g.color, border: g.border };
// }

// // ── bullet splitter ───────────────────────────────────────────────────────────
// function splitFeedbackIntoBullets(fb) {
//   if (!fb) return [];
//   const markers = [
//     "Missing:", "Logic issue:", "Present but weak:",
//     "Control gap:"
//   ];
//   const regex = new RegExp(
//     `(?=${markers.map(m => m.replace(":", "\\:")).join("|")})`, "g"
//   );
//   return fb
//     .split(regex)
//     .map(s => s.trim().replace(/\.$/, "").trim())
//     .filter(Boolean);
// }

// // ── VerifyCell ────────────────────────────────────────────────────────────────
// export function VerifyCell({ row, onVerify, result, busy, error }) {
//   const [showBreakdown, setShowBreakdown] = useState(false);

//   if (busy) {
//     return (
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
//         <RefreshCw size={14} style={{ color: "#667eea", animation: "spin 0.9s linear infinite" }} />
//         <span style={{ fontSize: 11, color: "#667eea", fontWeight: 600 }}>Checking…</span>
//         <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//       </div>
//     );
//   }

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

//   const grade  = getGrade(result.overallScore);
//   const pct    = getPct(result.overallScore);
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
//         <span style={{ fontWeight: 900 }}>{grade.grade}</span>
//         <span style={{ fontWeight: 500, opacity: 0.8 }}>· {pct}%</span>
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

// // ── Score Breakdown Modal ─────────────────────────────────────────────────────
// function ScoreBreakdownModal({ result, onClose }) {
//   const breakdown    = result.scoreBreakdown || {};
//   const maxBreakdown = result.maxBreakdown   || {};
//   const feedback     = result.feedback       || {};
//   const passed       = result.titleMatch && result.overallScore >= APPROVAL_THRESHOLD;
//   const grade        = getGrade(result.overallScore);
//   const pct          = getPct(result.overallScore);

//   return (
//     <div
//       onClick={onClose}
//       style={{
//         position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
//         display: "flex", alignItems: "center", justifyContent: "center",
//         zIndex: 10010, padding: 20,
//       }}
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         style={{
//           background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
//           maxHeight: "88vh", overflowY: "auto",
//           boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
//           fontFamily: "'DM Sans', 'Inter', sans-serif",
//         }}
//       >
//         {/* ── Header ─────────────────────────────────────────────────────── */}
//         <div style={{
//           padding: "20px 24px 16px",
//           borderBottom: "1px solid #f0f0f0",
//           display: "flex", justifyContent: "space-between", alignItems: "flex-start",
//         }}>
//           <div>
//             <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
//               <Shield size={18} style={{ color: "#667eea" }} />
//               <span style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>
//                 Document Quality Check
//               </span>
//             </div>
//             <div style={{ fontSize: 12, color: "#9ca3af" }}>
//               Checked {result.checkedAt ? new Date(result.checkedAt).toLocaleString() : "—"}
//             </div>
//           </div>

//           {/* Grade + % in header */}
//           <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
//             <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
//               <span style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, color: grade.color }}>
//                 {grade.grade}
//               </span>
//               <span style={{ fontSize: 16, fontWeight: 700, color: "#6b7280" }}>
//                 {pct}%
//               </span>
//             </div>
//             <span style={{
//               fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
//               padding: "2px 10px", borderRadius: 20,
//               background: grade.bg, color: grade.color, border: `1.5px solid ${grade.border}`,
//             }}>
//               {grade.label}
//             </span>
//           </div>
//         </div>

//         <div style={{ padding: "18px 24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

//           {/* ── Title Score ─────────────────────────────────────────────── */}
//           <Section label="Title Score">
//             <div style={{
//               display: "flex", alignItems: "flex-start", gap: 10,
//               padding: "12px 14px", borderRadius: 10,
//               background: result.titleMatch ? "#f0fdf4" : "#fff5f5",
//               border: `1.5px solid ${result.titleMatch ? "#86efac" : "#fca5a5"}`,
//             }}>
//               <div style={{
//                 width: 28, height: 28, borderRadius: 8, flexShrink: 0,
//                 background: result.titleMatch ? "#dcfce7" : "#fee2e2",
//                 display: "flex", alignItems: "center", justifyContent: "center",
//               }}>
//                 {result.titleMatch
//                   ? <CheckCircle2 size={15} style={{ color: "#16a34a" }} />
//                   : <XCircle      size={15} style={{ color: "#dc2626" }} />}
//               </div>
//               <div style={{ flex: 1, minWidth: 0 }}>
//                 <div style={{
//                   fontSize: 13, fontWeight: 700,
//                   color: result.titleMatch ? "#15803d" : "#b91c1c", marginBottom: 4,
//                 }}>
//                   {result.titleMatch ? "Title Matched" : "Title Mismatch"}
//                 </div>
//                 <div style={{ fontSize: 11.5, color: "#4b5563", lineHeight: 1.5 }}>
//                   <span style={{ fontWeight: 600 }}>MLD:</span>{" "}
//                   <span style={{ color: "#111827" }}>"{result.mldDocName}"</span>
//                 </div>
//                 <div style={{ fontSize: 11.5, color: "#4b5563", lineHeight: 1.5, marginTop: 1 }}>
//                   <span style={{ fontWeight: 600 }}>Extracted:</span>{" "}
//                   <span style={{ color: "#111827" }}>"{result.extractedDocTitle || "—"}"</span>
//                 </div>
//                 {!result.titleMatch && (
//                   <div style={{
//                     marginTop: 6, fontSize: 11, color: "#b91c1c",
//                     background: "#fee2e2", borderRadius: 6, padding: "4px 8px",
//                     display: "inline-block",
//                   }}>
//                     Document cannot be approved until title matches.
//                   </div>
//                 )}
//               </div>
//             </div>
//           </Section>

//           {/* ── Content Score ───────────────────────────────────────────── */}
//           <Section label="Content Score">

//             <div style={{
//               display: "flex", alignItems: "center", justifyContent: "space-between",
//               marginBottom: 10,
//             }}>
//               <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
//                 Overall content score
//               </span>
//               <span style={{ fontSize: 14, fontWeight: 800, color: grade.color }}>
//                 {pct}%
//               </span>
//             </div>

//             <div style={{
//               height: 6, borderRadius: 99, background: "#f3f4f6",
//               marginBottom: 14, overflow: "hidden",
//             }}>
//               <div style={{
//                 height: "100%", borderRadius: 99,
//                 width: `${Math.min(result.overallScore, 100)}%`,
//                 background: result.overallScore >= APPROVAL_THRESHOLD ? "#10b981"
//                            : result.overallScore >= 60 ? "#f59e0b" : "#ef4444",
//                 transition: "width 0.4s ease",
//               }} />
//             </div>

//             {/* Per-criterion rows — feedback only, no % or bar per line */}
//             <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//               {CRITERIA_CONFIG.map(({ key, label, max: defaultMax }) => {
//                 const achieved     = breakdown[key] ?? 0;
//                 const maxPts       = maxBreakdown[key] ?? defaultMax;
//                 const isFullScore  = achieved >= maxPts;
//                 const isPolicyStmt = key === "policyStatements";
//                 const fb           = feedback[key];
//                 const bulletPoints = (!isFullScore && isPolicyStmt)
//                   ? splitFeedbackIntoBullets(fb)
//                   : [];

//                 return (
//                   <div key={key} style={{
//                     padding: "10px 12px", borderRadius: 8,
//                     background: "#f9fafb", border: "1px solid #f3f4f6",
//                   }}>
//                     {/* Criterion label — no score/bar on the right */}
//                     <div style={{
//                       fontSize: 12.5, fontWeight: 700, color: "#374151",
//                       marginBottom: (!isFullScore && fb) ? 6 : 0,
//                     }}>
//                       {label}
//                     </div>

//                     {/* Full score → green tick, otherwise show feedback */}
//                     {isFullScore ? (
//                       <div style={{
//                         fontSize: 11, color: "#16a34a", marginTop: 4,
//                         display: "flex", alignItems: "center", gap: 4,
//                       }}>
//                         <CheckCircle2 size={11} />
//                         No issues found
//                       </div>
//                     ) : fb && (
//                       isPolicyStmt && bulletPoints.length > 1 ? (
//                         <ul style={{
//                           margin: 0, paddingLeft: 18,
//                           display: "flex", flexDirection: "column", gap: 4,
//                         }}>
//                           {bulletPoints.map((point, i) => (
//                             <li key={i} style={{
//                               fontSize: 11.5, color: "#6b7280",
//                               lineHeight: 1.55, listStyleType: "disc",
//                               textAlign: "left",
//                             }}>
//                               {point}
//                             </li>
//                           ))}
//                         </ul>
//                       ) : (
//                         <div style={{
//                           fontSize: 11.5, color: "#6b7280",
//                           lineHeight: 1.5, marginTop: 2, textAlign: "left",
//                         }}>
//                           {fb}
//                         </div>
//                       )
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           </Section>

//           {/* ── Pass / Fail banner ──────────────────────────────────────── */}
//           <div style={{
//             padding: "10px 14px", borderRadius: 8,
//             background: passed ? "#f0fdf4" : "#fff5f5",
//             border: `1.5px solid ${passed ? "#86efac" : "#fca5a5"}`,
//             fontSize: 12.5, fontWeight: 600,
//             color: passed ? "#15803d" : "#b91c1c",
//             display: "flex", alignItems: "center", gap: 8,
//           }}>
//             {passed
//               ? <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
//               : <XCircle      size={15} style={{ flexShrink: 0 }} />}
//             {passed
//               ? "Passes approval — title matched and content score meets the required threshold."
//               : `Cannot approve — content score ${pct}% is below the required threshold, or title does not match.`}
//           </div>

//           {/* ── Grade reference table ────────────────────────────────────── */}
//           <div style={{ borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
//             <div style={{
//               padding: "8px 14px", background: "#f8f9fa",
//               borderBottom: "1px solid #e5e7eb",
//               fontSize: 11, fontWeight: 700,
//               letterSpacing: "0.06em", textTransform: "uppercase", color: "#9ca3af",
//             }}>
//               Grade Reference
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
//               {GRADE_BANDS.map((band, i) => {
//                 const isCurrentGrade =
//                   result.overallScore >= band.min &&
//                   (i === 0 || result.overallScore < GRADE_BANDS[i - 1].min);
//                 return (
//                   <div key={band.grade} style={{
//                     padding: "8px 4px", textAlign: "center",
//                     background: isCurrentGrade ? band.bg : "#fff",
//                     borderRight: i < GRADE_BANDS.length - 1 ? "1px solid #f3f4f6" : "none",
//                   }}>
//                     <div style={{
//                       fontSize: 15, fontWeight: 900,
//                       color: isCurrentGrade ? band.color : "#9ca3af",
//                     }}>
//                       {band.grade}
//                     </div>
//                     <div style={{
//                       fontSize: 9, fontWeight: 600, marginTop: 2,
//                       color: isCurrentGrade ? band.color : "#c4c9d4",
//                     }}>
//                       {band.min === 0 ? "<40%" : `≥${band.min}%`}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* ── AI Disclaimer ────────────────────────────────────────────── */}
//           <div style={{
//             padding: "10px 14px", borderRadius: 8,
//             background: "#fffbeb", border: "1.5px solid #fde68a",
//             display: "flex", gap: 10, alignItems: "flex-start",
//           }}>
//             <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
//             <p style={{ margin: 0, fontSize: 11, color: "#92400e", lineHeight: 1.6 }}>
//               <strong>AI-generated assessment.</strong> This quality check is produced by a large
//               language model and may contain errors or omissions. Scores are indicative, not
//               definitive. Always have a qualified compliance officer or document owner review
//               the findings before making approval decisions.
//             </p>
//           </div>

//         </div>

//         {/* ── Footer ─────────────────────────────────────────────────────── */}
//         <div style={{
//           padding: "14px 24px 18px",
//           borderTop: "1px solid #f0f0f0",
//           textAlign: "right",
//         }}>
//           <button onClick={onClose} style={{
//             padding: "8px 22px", borderRadius: 8,
//             border: "1.5px solid #e5e7eb", background: "#fff",
//             color: "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer",
//           }}>
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── Section wrapper ───────────────────────────────────────────────────────────
// function Section({ label, children }) {
//   return (
//     <div>
//       <div style={{
//         fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
//         textTransform: "uppercase", color: "#9ca3af", marginBottom: 8,
//       }}>
//         {label}
//       </div>
//       {children}
//     </div>
//   );
// }

// // ── ApproveGateModal ──────────────────────────────────────────────────────────
// export function ApproveGateModal({ docId, checker, onClose }) {
//   const reason = checker.getBlockReason(docId);
//   const result = checker.getResult(docId);
//   const grade  = result ? getGrade(result.overallScore) : null;

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
//           fontFamily: "'DM Sans', 'Inter', sans-serif",
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
//             <div style={{ fontSize: 13, color: "#495057", marginTop: 8, lineHeight: 1.6 }}>
//               {reason}
//             </div>
//             {result && grade && (
//               <div style={{
//                 marginTop: 12, fontSize: 12, color: "#868e96",
//                 padding: "8px 12px", background: "#f9fafb",
//                 borderRadius: 8, border: "1px solid #f3f4f6",
//               }}>
//                 Grade:{" "}
//                 <strong style={{ color: grade.color }}>
//                   {grade.grade} ({getPct(result.overallScore)}%)
//                 </strong>
//                 {" · "}Required: <strong>≥{APPROVAL_THRESHOLD}%</strong> + title match
//                 <br />
//                 Title:{" "}
//                 <strong style={{ color: result.titleMatch ? "#15803d" : "#b91c1c" }}>
//                   {result.titleMatch ? "matched" : "not matched"}
//                 </strong>
//               </div>
//             )}
//           </div>
//         </div>
//         <div style={{ marginTop: 20, textAlign: "right" }}>
//           <button onClick={onClose} style={{
//             padding: "8px 20px", borderRadius: 8, border: "none",
//             background: "#111827", color: "#fff",
//             fontWeight: 700, fontSize: 13, cursor: "pointer",
//           }}>
//             Got it
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

//////+++++++++++++++++//////////------------------------------------------------------------------????++++++++++++++++++++++++++
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Shield } from "lucide-react";
import { APPROVAL_THRESHOLD } from "./useDocChecker";

// ── Criteria config ───────────────────────────────────────────────────────────
const CRITERIA_CONFIG = [
  { key: "policyStatements",         label: "Policy Statements",        max: 80 },
  { key: "purposeAndScope",          label: "Purpose & Scope",          max:  5 },
  { key: "rolesAndResponsibilities", label: "Roles & Responsibilities", max:  5 },
  { key: "reviewAndApproval",        label: "Review & Approval",        max:  5 },
  { key: "documentControl",          label: "Document Control",         max:  5 },
];

// ── Grade system ──────────────────────────────────────────────────────────────
// UAT v2 feedback: A+ = 90–100, A = 70–90, B = 50–70, C = <50
const GRADE_BANDS = [
  { min: 90, grade: "A+", color: "#065f46", bg: "#d1fae5", border: "#6ee7b7" },
  { min: 70, grade: "A",  color: "#0f766e", bg: "#ccfbf1", border: "#5eead4" },
  { min: 50, grade: "B",  color: "#854d0e", bg: "#fef9c3", border: "#fde047" },
  { min:  0, grade: "C",  color: "#991b1b", bg: "#fee2e2", border: "#fca5a5" },
];

function getGrade(score) {
  return GRADE_BANDS.find(b => score >= b.min) || GRADE_BANDS[GRADE_BANDS.length - 1];
}

function getPct(score) {
  return Math.round(score);
}

function scoreColor(score, titleMatch) {
  if (!titleMatch) return { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" };
  const g = getGrade(score);
  return { bg: g.bg, color: g.color, border: g.border };
}

// ── bullet splitter ───────────────────────────────────────────────────────────
function splitFeedbackIntoBullets(fb) {
  if (!fb) return [];
  const markers = [
    "Missing:", "Logic issue:", "Present but weak:",
    "Control gap:"
  ];
  const regex = new RegExp(
    `(?=${markers.map(m => m.replace(":", "\\:")).join("|")})`, "g"
  );
  return fb
    .split(regex)
    .map(s => s.trim().replace(/\.$/, "").trim())
    // Safety net: strip any stray "Recommendation: ..." clause that may
    // still be embedded inside a bullet from older/cached audit results.
    .map(s => s.replace(/\s*Recommendation:.*$/i, "").trim())
    .filter(Boolean)
    // Cap to top 3 issues so the modal doesn't overwhelm the reviewer.
    .slice(0, 3);
}

// ── VerifyCell ────────────────────────────────────────────────────────────────
export function VerifyCell({ row, onVerify, result, busy, error }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (busy) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <RefreshCw size={14} style={{ color: "#667eea", animation: "spin 0.9s linear infinite" }} />
        <span style={{ fontSize: 11, color: "#667eea", fontWeight: 600 }}>Checking…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

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

  const grade  = getGrade(result.overallScore);
  const pct    = getPct(result.overallScore);
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
        <span style={{ fontWeight: 900 }}>{grade.grade}</span>
        <span style={{ fontWeight: 500, opacity: 0.8 }}>· {pct}%</span>
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
  const breakdown    = result.scoreBreakdown || {};
  const maxBreakdown = result.maxBreakdown   || {};
  const feedback     = result.feedback       || {};
  const passed       = result.titleMatch && result.overallScore >= APPROVAL_THRESHOLD;
  const grade        = getGrade(result.overallScore);
  const pct          = getPct(result.overallScore);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "transparent",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 10010,
        paddingTop: "55px",
        paddingBottom: "20px",
        paddingLeft: "16px",
        paddingRight: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 680,
          height: "calc(100vh - 75px)",
          boxShadow: "0 32px 80px rgba(15,23,42,0.22), 0 8px 24px rgba(15,23,42,0.1)",
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: "24px 28px 20px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          background: "linear-gradient(135deg, #fafbff 0%, #f8fafc 100%)",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(102,126,234,0.35)",
              }}>
                <Shield size={17} style={{ color: "#fff" }} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
                Document Quality Check
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", paddingLeft: 44 }}>
              Checked {result.checkedAt ? new Date(result.checkedAt).toLocaleString() : "—"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <span style={{
              fontSize: 42, fontWeight: 900, lineHeight: 1,
              color: grade.color,
              textShadow: `0 2px 8px ${grade.color}30`,
            }}>
              {grade.grade}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
              padding: "3px 12px", borderRadius: 20,
              background: passed ? "#d1fae5" : "#fee2e2",
              color: passed ? "#065f46" : "#991b1b",
              border: `1.5px solid ${passed ? "#6ee7b7" : "#fca5a5"}`,
            }}>
              {passed ? "Pass" : "Improvement Needed"}
            </span>
          </div>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div style={{
          padding: "22px 28px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          overflowY: "auto",
          flex: 1,
        }}>

          {/* ── Findings ─────────────────────────────────────────────────── */}
          <Section label="Findings">
            <div style={{
              height: 7, borderRadius: 99, background: "#f1f5f9",
              marginBottom: 16, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 99,
                width: `${Math.min(result.overallScore, 100)}%`,
                background: result.overallScore >= APPROVAL_THRESHOLD
                  ? "linear-gradient(90deg, #10b981, #059669)"
                  : result.overallScore >= 50
                  ? "linear-gradient(90deg, #f59e0b, #d97706)"
                  : "linear-gradient(90deg, #ef4444, #dc2626)",
                transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: result.overallScore >= APPROVAL_THRESHOLD
                  ? "0 0 8px rgba(16,185,129,0.4)"
                  : result.overallScore >= 50
                  ? "0 0 8px rgba(245,158,11,0.4)"
                  : "0 0 8px rgba(239,68,68,0.4)",
              }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

              {/* Document Title card */}
              <div style={{
                padding: "13px 16px",
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: "#1e293b",
                  marginBottom: 7, textAlign: "left",
                }}>
                  Document Title
                </div>
                {result.titleMatch ? (
                  <div style={{
                    fontSize: 11.5, color: "#16a34a",
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <CheckCircle2 size={12} />
                    No issues found
                  </div>
                ) : (
                  <div style={{ fontSize: 11.5, color: "#b91c1c", lineHeight: 1.6, textAlign: "left" }}>
                    Mismatch: expected "{result.mldDocName}" but found "{result.extractedDocTitle || "—"}"
                  </div>
                )}
              </div>

              {CRITERIA_CONFIG.map(({ key, label, max: defaultMax }) => {
                const achieved     = breakdown[key] ?? 0;
                const maxPts       = maxBreakdown[key] ?? defaultMax;
                const isFullScore  = achieved >= maxPts;
                const isPolicyStmt = key === "policyStatements";
                const fb           = feedback[key];
                const bulletPoints = (!isFullScore && isPolicyStmt)
                  ? splitFeedbackIntoBullets(fb)
                  : [];

                return (
                  <div key={key} style={{
                    padding: "13px 16px",
                    borderRadius: 12,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
                  }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: "#1e293b", textAlign: "left",
                      marginBottom: (!isFullScore && fb) ? 8 : 0,
                    }}>
                      {label}
                    </div>

                    {isFullScore ? (
                      <div style={{
                        fontSize: 11.5, color: "#16a34a", marginTop: 5,
                        display: "flex", alignItems: "center", gap: 5,
                      }}>
                        <CheckCircle2 size={12} />
                        No issues found
                      </div>
                    ) : fb && (
                      isPolicyStmt && bulletPoints.length > 1 ? (
                        <ul style={{
                          margin: 0, paddingLeft: 20,
                          display: "flex", flexDirection: "column", gap: 5,
                        }}>
                          {bulletPoints.map((point, i) => (
                            <li key={i} style={{
                              fontSize: 12, color: "#64748b",
                              lineHeight: 1.6, listStyleType: "disc",
                              textAlign: "left",
                            }}>
                              {point}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div style={{
                          fontSize: 12, color: "#64748b",
                          lineHeight: 1.6, marginTop: 3, textAlign: "left",
                        }}>
                          {fb}
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── Grade reference table ────────────────────────────────────── */}
          <div style={{ borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
            <div style={{
              padding: "10px 16px",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              fontSize: 11, fontWeight: 700,
              letterSpacing: "0.07em", textTransform: "uppercase", color: "#94a3b8",
            }}>
              Grade Reference
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
              {GRADE_BANDS.map((band, i) => {
                const isCurrentGrade =
                  result.overallScore >= band.min &&
                  (i === 0 || result.overallScore < GRADE_BANDS[i - 1].min);
                const gradeStatus = band.grade === "A+" ? "Pass" : "Improvement Needed";
                const rangeLabel =
                  i === 0 ? `${band.min}–100%`
                  : i === GRADE_BANDS.length - 1 ? `<${GRADE_BANDS[i - 1].min}%`
                  : `${band.min}–${GRADE_BANDS[i - 1].min}%`;
                return (
                  <div key={band.grade} style={{
                    padding: "10px 6px", textAlign: "center",
                    background: isCurrentGrade ? band.bg : "#fff",
                    borderRight: i < GRADE_BANDS.length - 1 ? "1px solid #f1f5f9" : "none",
                    transition: "background 0.2s ease",
                  }}>
                    <div style={{
                      fontSize: 16, fontWeight: 900,
                      color: isCurrentGrade ? band.color : "#9ca3af",
                    }}>
                      {band.grade}
                    </div>
                    <div style={{
                      fontSize: 9.5, fontWeight: 600, marginTop: 3,
                      color: isCurrentGrade ? band.color : "#c4c9d4",
                    }}>
                      {rangeLabel}
                    </div>
                    <div style={{
                      fontSize: 9, fontWeight: 600, marginTop: 2,
                      color: isCurrentGrade ? band.color : "#c4c9d4",
                    }}>
                      {gradeStatus}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── AI Disclaimer ────────────────────────────────────────────── */}
          <div style={{
            padding: "12px 16px", borderRadius: 12,
            background: "#fffbeb", border: "1.5px solid #fde68a",
            display: "flex", gap: 12, alignItems: "flex-start",
            boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
            <p style={{ margin: 0, fontSize: 11.5, color: "#92400e", lineHeight: 1.7, textAlign: "left" }}>
              <strong>AI-generated assessment.</strong> This quality check is produced by a large
              language model and may contain errors or omissions. Scores are indicative, not
              definitive. Always have a qualified compliance officer or document owner review
              the findings before making approval decisions.
            </p>
          </div>

        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: "16px 28px 20px",
          borderTop: "1px solid #f1f5f9",
          textAlign: "right",
          background: "#fafbff",
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 28px", borderRadius: 10,
              border: "1.5px solid #e2e8f0",
              background: "#fff",
              color: "#374151", fontWeight: 700, fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(15,23,42,0.08)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#f8fafc";
              e.target.style.borderColor = "#cbd5e1";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#fff";
              e.target.style.borderColor = "#e2e8f0";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
        textTransform: "uppercase", color: "#9ca3af", marginBottom: 8,
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
  const grade  = result ? getGrade(result.overallScore) : null;

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
            {result && grade && (
              <div style={{
                marginTop: 12, fontSize: 12, color: "#868e96",
                padding: "8px 12px", background: "#f9fafb",
                borderRadius: 8, border: "1px solid #f3f4f6",
              }}>
                Grade:{" "}
                <strong style={{ color: grade.color }}>
                  {grade.grade} ({getPct(result.overallScore)}%)
                </strong>
                {" · "}Required: <strong>≥{APPROVAL_THRESHOLD}%</strong> + title match
                <br />
                Title:{" "}
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