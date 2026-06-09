'use client'

// import React, { useEffect, useState, useMemo } from "react";
// import { useHistory } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
// import axios from "axios"; // raw axios — NOT adminAxios (avoids logout interceptor)
// import api from "../../api/adminApi"; // user-service only
// import {
//   Box, Typography, Grid, Card, CardContent, Stack,
//   CircularProgress, Chip, Table, TableBody, TableCell,
//   TableContainer, TableHead, TableRow, Avatar, LinearProgress,
//   IconButton, Tooltip,
// } from "@mui/material";
// import GroupIcon from "@mui/icons-material/Group";
// import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
// import StorefrontIcon from "@mui/icons-material/Storefront";
// import WarningAmberIcon from "@mui/icons-material/WarningAmber";
// import HistoryIcon from "@mui/icons-material/History";
// import SecurityIcon from "@mui/icons-material/Security";
// import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
// import MoreVertIcon from "@mui/icons-material/MoreVert";
// import ShieldIcon from "@mui/icons-material/Shield";

// // ── Endpoints — same as working components ─────────────────────────────────────
// const RISK_URL   = process.env.NEXT_PUBLIC_SP + "/risk-service/api/risks";
// const VENDOR_URL = process.env.NEXT_PUBLIC_SP + "/tprm-service/api/tprm/vendors";
// const BASIC_TOKEN = btoa("username:password");

// // ── Palette ────────────────────────────────────────────────────────────────────
// const P = {
//   bg: "#f0f4f8", surface: "#ffffff", border: "#e2e8f0",
//   text: "#0f172a", textSub: "#475569", textMuted: "#94a3b8",
//   blue: "#2563eb", blueLight: "#eff6ff",
//   green: "#059669", greenLight: "#ecfdf5",
//   red: "#dc2626", redLight: "#fef2f2",
//   amber: "#d97706", amberLight: "#fffbeb",
//   slate: "#64748b", slateLight: "#f8fafc",
// };

// // ── Reusable components ────────────────────────────────────────────────────────
// const SurfaceCard = ({ children, sx = {} }) => (
//   <Card elevation={0} sx={{ borderRadius: "16px", background: P.surface, border: `1px solid ${P.border}`, height: "100%", transition: "box-shadow 0.2s, transform 0.2s", "&:hover": { boxShadow: "0 8px 30px rgba(0,0,0,0.07)", transform: "translateY(-1px)" }, ...sx }}>
//     {children}
//   </Card>
// );

// const SectionHeader = ({ title, subtitle, action, icon }) => (
//   <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
//     <Stack direction="row" spacing={1.5} alignItems="center">
//       {icon && <Box sx={{ color: P.blue, display: "flex" }}>{React.cloneElement(icon, { sx: { fontSize: 18 } })}</Box>}
//       <Box>
//         <Typography sx={{ fontWeight: 700, color: P.text, fontSize: "0.95rem", letterSpacing: "-0.2px" }}>{title}</Typography>
//         {subtitle && <Typography sx={{ color: P.textMuted, fontSize: "0.72rem", fontWeight: 500, mt: 0.2 }}>{subtitle}</Typography>}
//       </Box>
//     </Stack>
//     {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
//   </Stack>
// );

// const MetricCard = ({ title, value, icon, color, colorLight }) => (
//   <SurfaceCard>
//     <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
//       <Box sx={{ p: 1.25, borderRadius: "12px", backgroundColor: colorLight || `${color}15`, color, display: "inline-flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
//         {React.cloneElement(icon, { sx: { fontSize: 20 } })}
//       </Box>
//       <Typography sx={{ fontSize: "1.85rem", fontWeight: 800, color: P.text, lineHeight: 1, letterSpacing: "-1px" }}>{value ?? "—"}</Typography>
//       <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: P.textSub, mt: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</Typography>
//     </CardContent>
//   </SurfaceCard>
// );

// const StyledTHead = ({ columns }) => (
//   <TableHead>
//     <TableRow sx={{ bgcolor: P.slateLight }}>
//       {columns.map((col, i) => (
//         <TableCell key={i} align={col.align || "left"} sx={{ fontWeight: 700, color: P.textSub, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.6px", borderBottom: `1px solid ${P.border}`, py: 1.25, px: 2, whiteSpace: "nowrap" }}>
//           {col.label}
//         </TableCell>
//       ))}
//     </TableRow>
//   </TableHead>
// );

// const StyledTRow = ({ children }) => (
//   <TableRow hover sx={{ "& td": { borderBottom: `1px solid ${P.border}`, py: 1.25, px: 2, fontSize: "0.82rem", color: P.text }, "&:last-child td": { border: 0 }, "&:hover": { bgcolor: "#f8fafc" } }}>
//     {children}
//   </TableRow>
// );

// const NavBtn = ({ onClick }) => (
//   <IconButton onClick={onClick} size="small" sx={{ border: `1px solid ${P.border}`, borderRadius: "8px", p: 0.75, color: P.textSub, "&:hover": { bgcolor: P.blueLight, color: P.blue, borderColor: P.blue } }}>
//     <ArrowForwardIcon sx={{ fontSize: 15 }} />
//   </IconButton>
// );

// const RoleBadge = ({ role }) => {
//   const c = { root: { bg: "#fef3c7", color: "#92400e" }, super_admin: { bg: "#ede9fe", color: "#5b21b6" }, ciso: { bg: "#dbeafe", color: "#1e40af" }, risk_manager: { bg: "#dcfce7", color: "#166534" } };
//   const s = c[role] || { bg: P.slateLight, color: P.slate };
//   return <Chip label={role?.replace(/_/g, " ")} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: "0.65rem", height: 22, borderRadius: "6px", textTransform: "capitalize" }} />;
// };

// const renderRiskStatus = (status) => {
//   const l = status?.toLowerCase();
//   let bg = P.slateLight, color = P.slate;
//   if (l === "open") { bg = P.redLight; color = P.red; }
//   else if (l === "closed") { bg = P.greenLight; color = P.green; }
//   else if (l === "in progress") { bg = P.amberLight; color = P.amber; }
//   return <Chip label={status?.replace("_", " ") || "N/A"} size="small" sx={{ backgroundColor: bg, color, fontWeight: 700, fontSize: "0.65rem", borderRadius: "6px", height: "22px", border: `1px solid ${color}40` }} />;
// };

// const getRiskLevelColor = (level) => {
//   const l = String(level || "").toLowerCase();
//   if (l === "critical") return P.red;
//   if (l === "high") return "#ea580c";
//   if (l === "medium") return P.amber;
//   if (l === "low") return P.green;
//   return P.slate;
// };

// // ── Main Component ─────────────────────────────────────────────────────────────
// export default function AdminDashboard() {
//   const history = useHistory();
//   // CalVant uses sessionStorage (not localStorage)
//   const token      = sessionStorage.getItem("token");
//   const user       = JSON.parse(sessionStorage.getItem("user") || "{}");
//   const decoded    = token ? jwtDecode(token) : null;
//   const orgId      = user.organization || decoded?.organization || "";
//   const loggedInRole = (Array.isArray(decoded?.role) ? decoded.role[0] : decoded?.role || "root").toLowerCase();

//   const [loading, setLoading] = useState(true);
//   const [data, setData] = useState({ users: [], departments: [], vendors: [], risks: [] });

//   useEffect(() => {
//     if (!token) return;
//     const load = async () => {
//       setLoading(true);
//       try {
//         // user-service — safe via adminApi
//         const [usersRes, deptsRes] = await Promise.allSettled([
//           api.get("/users").catch(() => ({ data: [] })),
//           api.get("/departments").catch(() => ({ data: [] })),
//         ]);
//         const users = Array.isArray(usersRes.value?.data) ? usersRes.value.data : [];
//         const depts = Array.isArray(deptsRes.value?.data) ? deptsRes.value.data : [];

//         // risk-service — Basic auth (same as RootRiskList)
//         const risksRaw = await fetch(RISK_URL, {
//           headers: { Authorization: `Basic ${BASIC_TOKEN}`, "Content-Type": "application/json" },
//         }).then(r => r.ok ? r.json() : []).catch(() => []);
//         const risks = Array.isArray(risksRaw) ? risksRaw : (risksRaw?.content ?? []);

//         // tprm-service — Bearer + org param (same as VendorList)
//         const vendors = await axios.get(VENDOR_URL, {
//           headers: { Authorization: `Bearer ${token}` },
//           params: { organization: orgId },
//         }).then(r => Array.isArray(r.data) ? r.data : (r.data?.content ?? [])).catch(() => []);

//         setData({ users, departments: depts, vendors, risks });
//       } catch (err) {
//         console.error("Dashboard load error", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, [token, orgId]);

//   // Dept workforce — resolve dept id → name (same logic as working old code)
//   const deptWorkforce = useMemo(() => {
//     const orgUsers = data.users.filter(u => String(u.organization) === String(orgId));
//     const orgDepts = data.departments.filter(d => String(d.organization) === String(orgId));
//     return orgDepts.map(dept => {
//       const deptId = String(dept._id || dept.id);
//       const count = orgUsers.filter(u => {
//         const d = u.department || u.dept;
//         if (Array.isArray(d)) return d.some(id => String(id) === deptId);
//         return String(d) === deptId;
//       }).length;
//       return { id: deptId, name: dept.name || "Unnamed", count, share: orgUsers.length > 0 ? ((count / orgUsers.length) * 100).toFixed(1) : "0.0" };
//     }).sort((a, b) => b.count - a.count);
//   }, [data.users, data.departments, orgId]);

//   const metrics = [
//     { title: "Total Users",   value: data.users.length,       icon: <GroupIcon />,       color: P.blue,  colorLight: P.blueLight },
//     { title: "Departments",   value: data.departments.length, icon: <AccountBalanceIcon />, color: "#0891b2", colorLight: "#ecfeff" },
//     { title: "Active Vendors",value: data.vendors.length,     icon: <StorefrontIcon />,  color: P.green, colorLight: P.greenLight },
//     { title: "Global Risks",  value: data.risks.length,       icon: <WarningAmberIcon />,color: P.red,   colorLight: P.redLight },
//   ];

//   if (loading) {
//     return (
//       <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="90vh" gap={2} sx={{ bgcolor: P.bg }}>
//         <CircularProgress size={44} thickness={4} sx={{ color: P.blue }} />
//         <Typography sx={{ color: P.textMuted, fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Loading Dashboard</Typography>
//       </Box>
//     );
//   }

//   return (
//     <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, bgcolor: P.bg, minHeight: "100vh" }}>

//       {/* Header */}
//       <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={{ xs: 1.5, sm: 0 }} sx={{ mb: 3 }}>
//         <Stack direction="row" spacing={1.5} alignItems="center">
//           <Box sx={{ p: 1, borderRadius: "10px", bgcolor: P.blue, color: "#fff", display: "flex" }}>
//             <ShieldIcon sx={{ fontSize: 18 }} />
//           </Box>
//           <Box>
//             <Typography sx={{ fontWeight: 800, color: P.text, fontSize: { xs: "1.3rem", md: "1.5rem" }, letterSpacing: "-0.5px", lineHeight: 1 }}>Admin Dashboard</Typography>
//             <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
//               <Typography sx={{ color: P.textMuted, fontSize: "0.7rem", fontWeight: 500 }}>Session</Typography>
//               <RoleBadge role={loggedInRole} />
//             </Stack>
//           </Box>
//         </Stack>
//         <Stack direction="row" spacing={0.75} alignItems="center" sx={{ px: 1.5, py: 0.75, bgcolor: P.greenLight, borderRadius: "10px", border: `1px solid ${P.green}30` }}>
//           <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: P.green }} />
//           <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: P.green }}>Primary Access</Typography>
//         </Stack>
//       </Stack>

//       {/* Metric Cards */}
//       <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ mb: 3 }}>
//         {metrics.map((m, i) => (
//           <Grid item xs={6} sm={3} key={i}><MetricCard {...m} /></Grid>
//         ))}
//       </Grid>

//       {/* Users Table */}
//       <SurfaceCard sx={{ mb: 3 }}>
//         <CardContent sx={{ p: 0 }}>
//           <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
//             <SectionHeader title="Users" subtitle="Members & access control" icon={<GroupIcon />} action={<NavBtn onClick={() => history.push("/admin/users")} />} />
//           </Box>
//           <TableContainer>
//             <Table size="small">
//               <StyledTHead columns={[{ label: "Member" }, { label: "Role" }, { label: "Department" }, { label: "Status", align: "center" }]} />
//               <TableBody>
//                 {data.users.slice(0, 8).map((u, i) => (
//                   <StyledTRow key={i}>
//                     <TableCell>
//                       <Stack direction="row" spacing={1.5} alignItems="center">
//                         <Avatar sx={{ width: 30, height: 30, bgcolor: P.blueLight, color: P.blue, fontSize: "0.75rem", fontWeight: 800, border: `1px solid ${P.border}` }}>
//                           {(u.username || u.name || u.email || "U")[0].toUpperCase()}
//                         </Avatar>
//                         <Box sx={{ minWidth: 0 }}>
//                           <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.82rem" }}>{u.username || u.name || "—"}</Typography>
//                           <Typography noWrap sx={{ color: P.textMuted, fontSize: "0.68rem" }}>{u.email || "—"}</Typography>
//                         </Box>
//                       </Stack>
//                     </TableCell>
//                     <TableCell><RoleBadge role={Array.isArray(u.role) ? u.role[0] : u.role || "user"} /></TableCell>
//                     <TableCell>
//                       <Chip label={u.department || u.dept || "Global"} size="small" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700, bgcolor: P.slateLight, borderRadius: "5px" }} />
//                     </TableCell>
//                     <TableCell align="center">
//                       <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: P.green, mx: "auto", boxShadow: `0 0 0 4px ${P.green}20` }} />
//                     </TableCell>
//                   </StyledTRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         </CardContent>
//       </SurfaceCard>

//       {/* Risk Ledger */}
//       <SurfaceCard sx={{ mb: 3 }}>
//         <CardContent sx={{ p: 0 }}>
//           <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
//             <SectionHeader title="Risk Ledger" subtitle={`${data.risks.length} risks in scope`} icon={<SecurityIcon />} action={<NavBtn onClick={() => history.push("/admin/risks")} />} />
//           </Box>
//           {data.risks.length === 0 ? (
//             <Box sx={{ py: 5, textAlign: "center" }}>
//               <Typography sx={{ color: P.textMuted, fontWeight: 700, fontSize: "0.82rem", textTransform: "uppercase" }}>No Risks Found</Typography>
//             </Box>
//           ) : (
//             <TableContainer sx={{ overflowX: "auto" }}>
//               <Table size="small" sx={{ minWidth: 750 }}>
//                 <StyledTHead columns={[{ label: "Risk ID" }, { label: "Department" }, { label: "Category" }, { label: "Description" }, { label: "Score", align: "center" }, { label: "Status" }, { label: "Updated", align: "right" }]} />
//                 <TableBody>
//                   {data.risks.slice(0, 10).map((r, i) => {
//                     const scoreColor = getRiskLevelColor(r.riskLevel || r.level);
//                     const dt = r.updatedAt || r.createdAt ? new Date(r.updatedAt || r.createdAt) : null;
//                     return (
//                       <StyledTRow key={i}>
//                         <TableCell><Typography sx={{ fontWeight: 800, fontSize: "0.8rem", fontFamily: "monospace" }}>{r.riskId || `RK-${String(i + 1).padStart(3, "0")}`}</Typography></TableCell>
//                         <TableCell>
//                           <Typography sx={{ fontWeight: 700, fontSize: "0.8rem" }}>{r.department || r.dept || "Global"}</Typography>
//                           <Typography sx={{ color: P.textMuted, fontSize: "0.68rem" }}>{r.organization || "—"}</Typography>
//                         </TableCell>
//                         <TableCell><Chip label={r.riskType || "General"} size="small" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700, bgcolor: P.slateLight, color: P.textSub, borderRadius: "6px", border: `1px solid ${P.border}` }} /></TableCell>
//                         <TableCell sx={{ maxWidth: 260 }}>
//                           <Typography sx={{ fontSize: "0.78rem", color: P.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
//                             {r.riskDescription || r.description || "No description provided."}
//                           </Typography>
//                         </TableCell>
//                         <TableCell align="center">
//                           <Box sx={{ px: 1.25, py: 0.4, borderRadius: "6px", bgcolor: `${scoreColor}12`, color: scoreColor, display: "inline-block", border: `1px solid ${scoreColor}30` }}>
//                             <Typography sx={{ fontWeight: 800, fontSize: "0.72rem" }}>{r.riskScore || r.score || r.riskLevel || "—"}</Typography>
//                           </Box>
//                         </TableCell>
//                         <TableCell>{renderRiskStatus(r.status || "Open")}</TableCell>
//                         <TableCell align="right">
//                           <Typography sx={{ fontWeight: 600, fontSize: "0.72rem", color: P.textSub, whiteSpace: "nowrap" }}>
//                             {dt ? dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
//                           </Typography>
//                         </TableCell>
//                       </StyledTRow>
//                     );
//                   })}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           )}
//         </CardContent>
//       </SurfaceCard>

//       {/* Vendor Ledger + Workforce Share */}
//       <Grid container spacing={{ xs: 2.5, md: 3 }} sx={{ mb: 3 }} alignItems="stretch">
//         {/* Vendor Ledger */}
//         <Grid item xs={12} lg={6}>
//           <SurfaceCard sx={{ height: "100%" }}>
//             <CardContent sx={{ p: 0, height: "100%", display: "flex", flexDirection: "column" }}>
//               <Box sx={{ px: 2, pt: 2, pb: 1 }}>
//                 <SectionHeader title="Vendor Ledger" subtitle={`${data.vendors.length} vendors onboarded`} icon={<StorefrontIcon />} action={<NavBtn onClick={() => history.push("/admin/vendors")} />} />
//               </Box>
//               {data.vendors.length === 0 ? (
//                 <Box sx={{ py: 5, px: 3, textAlign: "center" }}>
//                   <Typography sx={{ color: P.textMuted, fontWeight: 700, fontSize: "0.82rem", textTransform: "uppercase" }}>No Vendor Data Available</Typography>
//                 </Box>
//               ) : (
//                 <TableContainer sx={{ flex: 1 }}>
//                   <Table size="small">
//                     <StyledTHead columns={[{ label: "Vendor" }, { label: "Point of Contact" }, { label: "Status" }, { label: "", align: "right" }]} />
//                     <TableBody>
//                       {data.vendors.slice(0, 10).map((v, i) => (
//                         <StyledTRow key={i}>
//                           <TableCell>
//                             <Stack direction="row" spacing={1.5} alignItems="center">
//                               <Avatar sx={{ width: 28, height: 28, bgcolor: P.greenLight, color: P.green, fontSize: "0.65rem" }}>
//                                 <StorefrontIcon sx={{ fontSize: 14 }} />
//                               </Avatar>
//                               <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.82rem", maxWidth: 120 }}>{v.vendorName || v.name || "—"}</Typography>
//                             </Stack>
//                           </TableCell>
//                           <TableCell>
//                             <Typography noWrap sx={{ fontWeight: 600, fontSize: "0.78rem", maxWidth: 110 }}>{v.poc || "N/A"}</Typography>
//                             <Typography noWrap sx={{ fontSize: "0.65rem", color: P.textMuted, maxWidth: 110 }}>{v.pocEmail || "No email"}</Typography>
//                           </TableCell>
//                           <TableCell>
//                             <Chip label={v.active === false ? "Inactive" : "Active"} size="small" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700, bgcolor: v.active === false ? P.redLight : P.greenLight, color: v.active === false ? P.red : P.green, borderRadius: "6px" }} />
//                           </TableCell>
//                           <TableCell align="right">
//                             <IconButton size="small" onClick={() => history.push("/admin/vendors")} sx={{ border: `1px solid ${P.border}`, borderRadius: "8px", p: 0.75 }}>
//                               <MoreVertIcon sx={{ fontSize: 16 }} />
//                             </IconButton>
//                           </TableCell>
//                         </StyledTRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </TableContainer>
//               )}
//             </CardContent>
//           </SurfaceCard>
//         </Grid>

//         {/* Workforce Share */}
//         <Grid item xs={12} lg={6}>
//           <SurfaceCard sx={{ height: "100%" }}>
//             <CardContent sx={{ p: 0, height: "100%", display: "flex", flexDirection: "column" }}>
//               <Box sx={{ px: 2, pt: 2, pb: 1 }}>
//                 <SectionHeader title="Workforce Share" subtitle="Departmental metrics" icon={<AccountBalanceIcon />} action={<NavBtn onClick={() => history.push("/admin/departments")} />} />
//               </Box>
//               {deptWorkforce.length === 0 ? (
//                 <Box sx={{ py: 5, px: 3, textAlign: "center" }}>
//                   <Typography sx={{ color: P.textMuted, fontWeight: 700, fontSize: "0.82rem", textTransform: "uppercase" }}>No Workforce Data</Typography>
//                 </Box>
//               ) : (
//                 <TableContainer sx={{ flex: 1 }}>
//                   <Table size="small">
//                     <StyledTHead columns={[{ label: "Dept Name" }, { label: "Count", align: "center" }, { label: "Share", align: "right" }]} />
//                     <TableBody>
//                       {deptWorkforce.slice(0, 10).map((dept) => (
//                         <StyledTRow key={dept.id}>
//                           <TableCell><Typography noWrap sx={{ fontWeight: 700, fontSize: "0.8rem", maxWidth: 160 }}>{dept.name}</Typography></TableCell>
//                           <TableCell align="center"><Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: P.blue }}>{dept.count}</Typography></TableCell>
//                           <TableCell align="right">
//                             <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="flex-end">
//                               <Box sx={{ width: 50 }}>
//                                 <LinearProgress variant="determinate" value={Number(dept.share)} sx={{ height: 4, borderRadius: 2, bgcolor: P.border, "& .MuiLinearProgress-bar": { bgcolor: P.blue } }} />
//                               </Box>
//                               <Typography sx={{ fontWeight: 700, fontSize: "0.72rem", minWidth: 38 }}>{dept.share}%</Typography>
//                             </Stack>
//                           </TableCell>
//                         </StyledTRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </TableContainer>
//               )}
//             </CardContent>
//           </SurfaceCard>
//         </Grid>
//       </Grid>

//     </Box>
//   );
// }

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation"; 
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import api from "../../api/adminApi";

const RISK_URL   = process.env.NEXT_PUBLIC_SP + "/risk-service/api/risks";
const VENDOR_URL = process.env.NEXT_PUBLIC_SP + "/tprm-service/api/tprm/vendors";
const BASIC_TOKEN = btoa("username:password");

// ── Design tokens (light theme) ────────────────────────────────────────────────
const C = {
  pageBg:      "#f4f6f9",
  white:       "#ffffff",
  border:      "#e2e8f0",
  borderLight: "#f0f4f8",
  text1:       "#1a202c",
  text2:       "#4a5568",
  text3:       "#718096",
  text4:       "#a0aec0",
  tableBg:     "#f8fafc",
  rowHover:    "#fafbfc",

  blue:        "#2563eb",
  blueLight:   "#eff6ff",
  cyan:        "#0891b2",
  cyanLight:   "#ecfeff",
  green:       "#059669",
  greenLight:  "#ecfdf5",
  greenText:   "#166534",
  greenBg:     "#dcfce7",
  amber:       "#d97706",
  amberLight:  "#fffbeb",
  amberText:   "#92400e",
  red:         "#dc2626",
  redLight:    "#fef2f2",
  redText:     "#991b1b",
  violet:      "#7c3aed",
  violetLight: "#f3e8ff",
  violetText:  "#6b21a8",
  orange:      "#ea580c",
};

// ── Shared styles ──────────────────────────────────────────────────────────────
const S = {
  card: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 18px", borderBottom: `1px solid ${C.borderLight}`,
  },
  cardTitle: {
    fontSize: 13, fontWeight: 700, color: C.text1,
    display: "flex", alignItems: "center", gap: 7,
  },
  cardSub: { fontSize: 11, color: C.text4, marginTop: 2 },
  th: {
    background: C.tableBg, color: C.text4, fontSize: 10, fontWeight: 700,
    letterSpacing: "0.9px", textTransform: "uppercase",
    padding: "9px 16px", textAlign: "left", borderBottom: `1px solid ${C.borderLight}`,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 16px", borderBottom: `1px solid #f7fafc`,
    fontSize: 12.5, color: C.text2, verticalAlign: "middle",
  },
};

// ── Reusable components ────────────────────────────────────────────────────────
const Chip = ({ label, bg, color, border, dot }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 10, fontWeight: 700, padding: "3px 9px",
    borderRadius: 20, whiteSpace: "nowrap",
    background: bg, color,
    border: border ? `1px solid ${border}` : "none",
  }}>
    {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: dot, display: "inline-block" }} />}
    {label}
  </span>
);

const ViewBtn = ({ onClick }) => (
  <button onClick={onClick} style={{
    fontSize: 11, fontWeight: 600, color: C.blue, background: C.blueLight,
    border: `1px solid #dbeafe`, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 3,
    padding: "4px 10px", borderRadius: 6,
  }}>
    View all →
  </button>
);

const Avatar = ({ name }) => {
  const letter = (name || "U")[0].toUpperCase();
  const colors = [
    { bg: C.blueLight,   color: "#1d4ed8" },
    { bg: C.violetLight, color: C.violetText },
    { bg: C.greenBg,     color: C.greenText },
    { bg: "#dbeafe",     color: "#1e40af" },
    { bg: "#fef9c3",     color: "#854d0e" },
  ];
  const c = colors[letter.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, background: c.bg, color: c.color,
    }}>
      {letter}
    </div>
  );
};

const RoleBadge = ({ role }) => {
  const map = {
    root:         { bg: "#fef3c7", color: "#92400e" },
    super_admin:  { bg: C.violetLight, color: C.violetText },
    ciso:         { bg: "#dbeafe", color: "#1e40af" },
    risk_manager: { bg: C.greenBg, color: C.greenText },
  };
  const s = map[role] || { bg: "#f3f4f6", color: "#374151" };
  return <Chip label={role?.replace(/_/g, " ") || "user"} bg={s.bg} color={s.color} />;
};

const StatusChip = ({ status }) => {
  const l = status?.toLowerCase();
  if (l === "open")           return <Chip label="Open"        bg={C.redLight}   color={C.redText}   dot={C.red} />;
  if (l === "closed")         return <Chip label="Closed"      bg={C.greenBg}    color={C.greenText} dot={C.green} />;
  if (l?.includes("progress"))return <Chip label="In Progress" bg={C.amberLight} color={C.amberText} dot={C.amber} />;
  return <Chip label={status || "N/A"} bg="#f3f4f6" color="#374151" />;
};

const RiskLevelChip = ({ risk }) => {
  const l = String(risk.riskLevel || risk.level || "").toLowerCase();
  if (l === "critical") return <Chip label="Critical" bg={C.redLight}   color={C.redText}   border="#fecaca" />;
  if (l === "high")     return <Chip label="High"     bg="#fff1f0"      color="#a8071a"     border="#ffa39e" />;
  if (l === "medium")   return <Chip label="Medium"   bg={C.amberLight} color={C.amberText} border="#fde68a" />;
  if (l === "low")      return <Chip label="Low"      bg={C.greenLight} color="#065f46"     border="#a7f3d0" />;
  return <Chip label={risk.riskScore || "—"} bg="#f3f4f6" color="#374151" />;
};

const ProgressBar = ({ pct, color, height = 5 }) => (
  <div style={{ background: "#edf2f7", borderRadius: 100, overflow: "hidden", height }}>
    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 100, background: color, transition: "width .6s ease" }} />
  </div>
);

// ── Risk Severity + Ecosystem Health card ──────────────────────────────────────
function RiskSummaryCard({ risks }) {
  const counts = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0, closed: 0, inProgress: 0, open: 0 };
    risks.forEach(r => {
      const l = String(r.riskLevel || r.level || "").toLowerCase();
      if (l === "critical") c.critical++;
      else if (l === "high") c.high++;
      else if (l === "medium") c.medium++;
      else if (l === "low") c.low++;
      const s = String(r.status || "").toLowerCase();
      if (s === "closed") c.closed++;
      else if (s.includes("progress")) c.inProgress++;
      else c.open++;
    });
    return c;
  }, [risks]);

  const total = risks.length || 1;
  const healthPct = Math.round((counts.closed / total) * 100);
  const healthColor = healthPct >= 70 ? C.green : healthPct >= 40 ? C.amber : C.red;
  const healthLabel = healthPct >= 70 ? "Healthy" : healthPct >= 40 ? "Moderate" : "Needs attention";

  const bars = [
    { label: "Critical", count: counts.critical, color: C.red },
    { label: "High",     count: counts.high,     color: C.orange },
    { label: "Medium",   count: counts.medium,   color: C.amber },
    { label: "Low",      count: counts.low,       color: C.green },
  ];
  const maxCount = Math.max(...bars.map(b => b.count), 1);

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <div>
          <div style={S.cardTitle}>
            <span style={{ color: C.violet, fontSize: 16 }}>▦</span> Risk Severity
          </div>
          <div style={S.cardSub}>Scoped assessment · {risks.length} total</div>
        </div>
        <Chip label="Current cycle" bg="#f3f4f6" color="#6b7280" border="#e5e7eb" />
      </div>

      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {bars.map(b => (
          <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: b.color, width: 52, flexShrink: 0 }}>{b.label}</span>
            <div style={{ flex: 1, height: 10, background: C.borderLight, borderRadius: 100, overflow: "hidden" }}>
              <div style={{ width: `${(b.count / maxCount) * 100}%`, height: "100%", background: b.color, borderRadius: 100 }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.text1, width: 20, textAlign: "right" }}>{b.count}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.borderLight}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: ".8px" }}>
            Ecosystem Health
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, color: healthColor }}>{healthPct}%</span>
        </div>
        <ProgressBar pct={healthPct} color={healthColor} height={8} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 10, color: C.text4, fontWeight: 500 }}>Based on closed / resolved risk ratio</span>
          <span style={{ fontSize: 10, color: healthColor, fontWeight: 700 }}>{healthLabel}</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {[
            { val: counts.closed,     label: "Closed",      color: C.green },
            { val: counts.inProgress, label: "In Progress", color: C.amber },
            { val: counts.open,       label: "Open",        color: C.red },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: C.tableBg, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "7px 10px", textAlign: "center",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: C.text4, fontWeight: 600, letterSpacing: ".5px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Table helpers ──────────────────────────────────────────────────────────────
const THead = ({ cols }) => (
  <thead>
    <tr>
      {cols.map((c, i) => (
        <th key={i} style={{ ...S.th, textAlign: c.right ? "right" : c.center ? "center" : "left" }}>{c.label}</th>
      ))}
    </tr>
  </thead>
);

const TRow = ({ children }) => (
  <tr style={{ transition: "background .15s" }}
    onMouseEnter={e => e.currentTarget.style.background = C.rowHover}
    onMouseLeave={e => e.currentTarget.style.background = ""}
  >
    {children}
  </tr>
);

// ── Loading ────────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "90vh", gap: 14, background: C.pageBg,
    }}>
      <div style={{
        width: 36, height: 36, border: `3px solid ${C.border}`,
        borderTop: `3px solid ${C.blue}`, borderRadius: "50%",
        animation: "spin .8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 12, color: C.text3, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
        Loading Dashboard
      </span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const history = useRouter();
  const token        = sessionStorage.getItem("token");
  const user         = JSON.parse(sessionStorage.getItem("user") || "{}");
  const decoded      = token ? jwtDecode(token) : null;
  const orgId        = user.organization || decoded?.organization || "";
  const loggedInRole = (Array.isArray(decoded?.role) ? decoded.role[0] : decoded?.role || "root").toLowerCase();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ users: [], departments: [], vendors: [], risks: [] });

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      try {
        const [usersRes, deptsRes] = await Promise.allSettled([
          api.get("/users").catch(() => ({ data: [] })),
          api.get("/departments").catch(() => ({ data: [] })),
        ]);
        const users = Array.isArray(usersRes.value?.data) ? usersRes.value.data : [];
        const depts = Array.isArray(deptsRes.value?.data) ? deptsRes.value.data : [];
        const risksRaw = await fetch(RISK_URL, {
          headers: { Authorization: `Basic ${BASIC_TOKEN}`, "Content-Type": "application/json" },
        }).then(r => r.ok ? r.json() : []).catch(() => []);
        const risks = Array.isArray(risksRaw) ? risksRaw : (risksRaw?.content ?? []);
        const vendors = await axios.get(VENDOR_URL, {
          headers: { Authorization: `Bearer ${token}` },
          params: { organization: orgId },
        }).then(r => Array.isArray(r.data) ? r.data : (r.data?.content ?? [])).catch(() => []);
        setData({ users, departments: depts, vendors, risks });
      } catch (err) {
        console.error("Dashboard load error", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, orgId]);

  const deptWorkforce = useMemo(() => {
    const orgUsers = data.users.filter(u => String(u.organization) === String(orgId));
    const orgDepts = data.departments.filter(d => String(d.organization) === String(orgId));
    return orgDepts.map(dept => {
      const deptId = String(dept._id || dept.id);
      const count = orgUsers.filter(u => {
        const d = u.department || u.dept;
        if (Array.isArray(d)) return d.some(id => String(id) === deptId);
        return String(d) === deptId;
      }).length;
      return {
        id: deptId, name: dept.name || "Unnamed", count,
        share: orgUsers.length > 0 ? ((count / orgUsers.length) * 100).toFixed(1) : "0.0",
      };
    }).sort((a, b) => b.count - a.count);
  }, [data.users, data.departments, orgId]);

  const metrics = [
    { title: "Total Users",    value: data.users.length,       icon: "👥", accent: C.blue,  accentLight: C.blueLight,  trend: "+12 this month",    trendColor: C.green },
    { title: "Departments",    value: data.departments.length, icon: "🏛", accent: C.cyan,  accentLight: C.cyanLight,  trend: "Across 3 regions",  trendColor: C.text3 },
    { title: "Active Vendors", value: data.vendors.length,     icon: "🏪", accent: C.green, accentLight: C.greenLight, trend: "+4 onboarded",      trendColor: C.green },
    { title: "Global Risks",   value: data.risks.length,       icon: "⚠️", accent: C.red,   accentLight: C.redLight,   trend: "6 critical open",   trendColor: C.red },
  ];

  const deptAccents = [C.blue, C.cyan, C.violet, C.green, C.amber, C.orange];

  if (loading) return <LoadingScreen />;

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ background: C.pageBg, minHeight: "100vh", padding: "24px", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, background: C.blue, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.text1, letterSpacing: "-.3px" }}>Admin Dashboard</div>
              <div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>Security & Risk Command Centre</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 13px", fontSize: 12, color: C.text2 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, display: "inline-block" }} />
              Primary Access &nbsp;·&nbsp; <strong>{loggedInRole}</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 13px", fontSize: 12, color: C.text2 }}>
              📅 {today}
            </div>
          </div>
        </div>

        {/* ── Metric Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
          {metrics.map((m, i) => (
            <div key={i} style={{ ...S.card, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: m.accent, borderRadius: "4px 0 0 4px" }} />
              <div style={{ width: 36, height: 36, borderRadius: 9, background: m.accentLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 18 }}>{m.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.text1, letterSpacing: "-1px", lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text4, textTransform: "uppercase", letterSpacing: ".8px", marginTop: 4 }}>{m.title}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: m.trendColor, marginTop: 6 }}>{m.trend}</div>
            </div>
          ))}
        </div>

        {/* ── Row 2: Risk Summary + Users ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <RiskSummaryCard risks={data.risks} />

          <div style={S.card}>
            <div style={S.cardHeader}>
              <div>
                <div style={S.cardTitle}>👥 Users</div>
                <div style={S.cardSub}>Members & access control</div>
              </div>
              <ViewBtn onClick={() => history.push("/admin/users")} />
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <THead cols={[{ label: "Member" }, { label: "Role" }, { label: "Status", center: true }]} />
              <tbody>
                {data.users.slice(0, 6).map((u, i) => (
                  <TRow key={i}>
                    <td style={S.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <Avatar name={u.username || u.name || u.email} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 12.5, color: C.text1 }}>{u.username || u.name || "—"}</div>
                          <div style={{ fontSize: 11, color: C.text4 }}>{u.email || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={S.td}><RoleBadge role={Array.isArray(u.role) ? u.role[0] : u.role} /></td>
                    <td style={{ ...S.td, textAlign: "center" }}>
                      <Chip label="Active" bg={C.greenBg} color={C.greenText} dot={C.green} />
                    </td>
                  </TRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Risk Ledger ── */}
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={S.cardHeader}>
            <div>
              <div style={S.cardTitle}>🛡 Risk Ledger</div>
              <div style={S.cardSub}>{data.risks.length} risks in scope · Live tracking</div>
            </div>
            <ViewBtn onClick={() => history.push("/admin/risks")} />
          </div>
          {data.risks.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", fontSize: 12, fontWeight: 700, color: C.text4, textTransform: "uppercase", letterSpacing: "1.5px" }}>No Risks Found</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <THead cols={[{ label: "Risk ID" }, { label: "Department" }, { label: "Category" }, { label: "Description" }, { label: "Level", center: true }, { label: "Status" }, { label: "Updated", right: true }]} />
                <tbody>
                  {data.risks.slice(0, 8).map((r, i) => {
                    const dt = r.updatedAt || r.createdAt ? new Date(r.updatedAt || r.createdAt) : null;
                    return (
                      <TRow key={i}>
                        <td style={S.td}><span style={{ fontFamily: "monospace", fontSize: 12, color: C.blue, fontWeight: 700 }}>{r.riskId || `RK-${String(i + 1).padStart(3, "0")}`}</span></td>
                        <td style={S.td}>
                          <div style={{ fontWeight: 600, fontSize: 12.5, color: C.text1 }}>{r.department || "Global"}</div>
                          <div style={{ fontSize: 11, color: C.text4 }}>{r.organization || "—"}</div>
                        </td>
                        <td style={S.td}><Chip label={r.riskType || "General"} bg={C.violetLight} color={C.violetText} border="#e9d5ff" /></td>
                        <td style={{ ...S.td, maxWidth: 220 }}><div style={{ fontSize: 12, color: C.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.riskDescription || r.description || "No description."}</div></td>
                        <td style={{ ...S.td, textAlign: "center" }}><RiskLevelChip risk={r} /></td>
                        <td style={S.td}><StatusChip status={r.status || "Open"} /></td>
                        <td style={{ ...S.td, textAlign: "right" }}><span style={{ fontSize: 11, color: C.text4, fontFamily: "monospace" }}>{dt ? dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}</span></td>
                      </TRow>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Bottom Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Vendor Ledger */}
          <div style={S.card}>
            <div style={S.cardHeader}>
              <div>
                <div style={S.cardTitle}>🏪 Vendor Ledger</div>
                <div style={S.cardSub}>{data.vendors.length} vendors onboarded</div>
              </div>
              <ViewBtn onClick={() => history.push("/admin/vendors")} />
            </div>
            {data.vendors.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", fontSize: 12, color: C.text4, textTransform: "uppercase", letterSpacing: 1.5 }}>No Vendor Data</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <THead cols={[{ label: "Vendor" }, { label: "Contact" }, { label: "Status" }]} />
                <tbody>
                  {data.vendors.slice(0, 8).map((v, i) => (
                    <TRow key={i}>
                      <td style={S.td}><div style={{ fontWeight: 600, fontSize: 12.5, color: C.text1 }}>{v.vendorName || v.name || "—"}</div></td>
                      <td style={S.td}>
                        <div style={{ fontSize: 12, color: C.text2 }}>{v.poc || "N/A"}</div>
                        <div style={{ fontSize: 11, color: C.text4 }}>{v.pocEmail || "No email"}</div>
                      </td>
                      <td style={S.td}>
                        {v.active === false
                          ? <Chip label="Inactive" bg={C.redLight}  color={C.redText} />
                          : <Chip label="Active"   bg={C.greenBg}   color={C.greenText} />}
                      </td>
                    </TRow>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Workforce Share */}
          <div style={S.card}>
            <div style={S.cardHeader}>
              <div>
                <div style={S.cardTitle}>🏛 Workforce Share</div>
                <div style={S.cardSub}>Departmental distribution</div>
              </div>
              <ViewBtn onClick={() => history.push("/admin/departments")} />
            </div>
            {deptWorkforce.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", fontSize: 12, color: C.text4, textTransform: "uppercase", letterSpacing: 1.5 }}>No Workforce Data</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <THead cols={[{ label: "Department" }, { label: "Count", center: true }, { label: "Share", right: true }]} />
                <tbody>
                  {deptWorkforce.slice(0, 8).map((dept, i) => {
                    const accent = deptAccents[i % deptAccents.length];
                    return (
                      <TRow key={dept.id}>
                        <td style={S.td}>
                          <div style={{ fontWeight: 600, fontSize: 12.5, color: C.text1, marginBottom: 5 }}>{dept.name}</div>
                          <ProgressBar pct={Number(dept.share)} color={accent} height={5} />
                        </td>
                        <td style={{ ...S.td, textAlign: "center" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>{dept.count}</span>
                        </td>
                        <td style={{ ...S.td, textAlign: "right" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.text2 }}>{dept.share}%</span>
                        </td>
                      </TRow>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}