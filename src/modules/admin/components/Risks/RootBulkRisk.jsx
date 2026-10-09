'use client'

import React, { useState, useRef } from "react";
import axios from "../../api/adminAxios";
import Papa from "papaparse";
import { jwtDecode } from "jwt-decode";
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Chip,
  Stack,
  Snackbar,
  Alert
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// ── Auth helper for fetch() calls ────────────────────────────────────────
const getAdminFetchHeaders = (extra = {}) => {
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  return {
    Authorization: token ? `Bearer ${token}` : undefined,
    "x-org": user.organization || undefined,
    "x-region": user.region || "US",
    ...extra,
  };
};
// ─────────────────────────────────────────────────────────────────────────

const CSV_COLUMNS = [
  "riskId",
  "department",
  "date",
  "riskType",
  "assetType",
  "threat",
  "vulnerabilities",
  "riskDescription",
  "confidentiality",
  "integrity",
  "availability",
  "impact",
  "likelihood",
  "riskScore",
  "riskLevel",
  "existingControls",
  "treatmentDays",
  "likelihoodAfterTreatment",
  "impactAfterTreatment",
  "gdpr",
  "iso27001",
  "iso27701",
  "iso42001",
  "ksaPdpl",
  "soc2",
];

// const UPLOAD_URL = `${process.env.NEXT_PUBLIC_SP}/risk-service/api/risks/upload`;
const UPLOAD_URL = "http://localhost:4003/api/risks/upload";

// ─── Styled components ───────────────────────────────────────────────────────
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
}));

const UploadButton = styled(Button)(() => ({
  borderRadius: "8px",
  height: "44px",
  fontSize: "14px",
  fontWeight: 600,
  color: "#ffffff",
  textTransform: "none",
  background: "#7c3aed",
  "&:hover": { background: "#6d28d9" },
  "&:disabled": { background: "#e5e7eb" },
}));

const ToggleButton = styled(Button)(() => ({
  borderRadius: "8px",
  height: "44px",
  fontSize: "14px",
  fontWeight: 600,
  textTransform: "none",
  background: "#f1f5f9",
  color: "#475569",
  "&:hover": { background: "#e2e8f0" },
}));

const FileInputWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  padding: theme.spacing(4),
  border: "2px dashed #cbd5e1",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": { borderColor: "#7c3aed", backgroundColor: "#f8fafc" },
  "&.dragging": { borderColor: "#7c3aed", backgroundColor: "#f5f3ff" },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderBottom: "1px solid #e5e7eb",
  fontSize: "13px",
  minWidth: "150px",
  "&:focus": {
    outline: "2px solid #7c3aed",
    outlineOffset: "-2px",
    backgroundColor: "#f5f3ff",
  },
}));

const StyledTableHeadCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1.5),
  backgroundColor: "#f8fafc",
  fontWeight: 600,
  fontSize: "13px",
  color: "#475569",
  borderBottom: "1px solid #cbd5e1",
  position: "sticky",
  top: 0,
  zIndex: 10,
}));

// ─── Animation variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0.1 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

const MotionTableRow = motion(TableRow);

// ─── Helper: get organization from JWT ──────────────────────────────────────
function getOrgFromToken() {
  try {
    const token = sessionStorage.getItem("token");
    if (!token) return null;
    const decoded = jwtDecode(token);
    return decoded.organization || null;
  } catch {
    return null;
  }
}

// ─── Helper: Basic Auth header for risk-service ──────────────────────────────
function getBasicAuthHeader() {
  const username = "username";
  const password = "password";
  return `Basic ${btoa(`${username}:${password}`)}`;
}

// ─── Component ───────────────────────────────────────────────────────────────
function RootBulkRisk() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragRowIndex, setDragRowIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(true);
  const [fileName, setFileName] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const fileInputRef = useRef(null);

  /* ── Reset ── */
  const resetState = () => {
    setRows([]);
    setDragRowIndex(null);
    setIsDragging(false);
    setIsFileDragging(false);
    setShowUploadSection(true);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Parse CSV (Smart Parsing) ── */
  const parseFile = (file) => {
    if (!file) return;
    setFileName(file.name);

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (res) => {
        let rawRows = res.data;
        if (!rawRows || rawRows.length === 0) {
          setSnackbar({ open: true, message: "No data found in the file", severity: "warning" });
          return;
        }

        // Try to identify if the first row is a header row by looking for keywords
        const firstRow = rawRows[0];
        const isHeaderRow = firstRow.some(cell => {
           const text = String(cell).toLowerCase().replace(/[^a-z]/g, '');
           return ["riskid", "department", "date", "risktype", "assettype", "threat", "vulnerabilities", "likelihood"].includes(text);
        });

        let columnMapping = {}; // column index -> expected field name
        
        if (isHeaderRow) {
           // Dynamic mapping: Match headers to our internal CSV_COLUMNS based on aliases
           firstRow.forEach((cell, index) => {
             const h = String(cell).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
             const aliases = {
               'riskid': 'riskId', 'id': 'riskId',
               'department': 'department', 'dept': 'department',
               'date': 'date',
               'risktype': 'riskType', 'type': 'riskType',
               'assettype': 'assetType',
               'threat': 'threat',
               'vulnerabilities': 'vulnerabilities', 'vulnerability': 'vulnerabilities', 'vuln': 'vulnerabilities',
               'riskdescription': 'riskDescription', 'description': 'riskDescription', 'desc': 'riskDescription',
               'confidentiality': 'confidentiality', 'conf': 'confidentiality', 'c': 'confidentiality',
               'integrity': 'integrity', 'integ': 'integrity', 'i': 'integrity',
               'availability': 'availability', 'avail': 'availability', 'a': 'availability',
               'impact': 'impact',
               'likelihood': 'likelihood', 'probability': 'likelihood', 'prob': 'likelihood',
               'currentriskscore': 'riskScore', 'riskscore': 'riskScore', 'score': 'riskScore',
               'currentrisklevel': 'riskLevel', 'risklevel': 'riskLevel', 'level': 'riskLevel',
               'existingcontrols': 'existingControls',
               'noofdaystoimplementtreatment': 'treatmentDays', 'treatmentdays': 'treatmentDays',
               'likelihoodaftertreatment': 'likelihoodAfterTreatment', 'residualprobability': 'likelihoodAfterTreatment',
               'impactaftertreatment': 'impactAfterTreatment', 'residualimpact': 'impactAfterTreatment',
               'gdpr': 'gdpr',
               'iso27001': 'iso27001',
               'iso27701': 'iso27701',
               'iso42001': 'iso42001',
               'ksapdpl': 'ksaPdpl', 'pdpl': 'ksaPdpl',
               'soc2': 'soc2'
             };
             if (aliases[h]) {
               columnMapping[index] = aliases[h];
             }
           });
           rawRows = rawRows.slice(1); // Drop the header row
        } else {
           // No header row detected, fallback to strict positional mapping
           CSV_COLUMNS.forEach((col, index) => {
              columnMapping[index] = col;
           });
        }

        // Map each row array -> named object
        const mappedData = rawRows.map((row) => {
          const obj = {};
          // Initialize all expected columns to empty strings
          CSV_COLUMNS.forEach(col => { obj[col] = ""; });
          
          // Fill based on the mapping (ignores unrecognized extra columns)
          row.forEach((val, index) => {
             const colName = columnMapping[index];
             if (colName) {
                obj[colName] = val ?? "";
             }
          });
          return obj;
        });

        setRows(mappedData);
        setShowUploadSection(false);
        setSnackbar({
          open: true,
          message: `Successfully loaded ${mappedData.length} rows from ${file.name} (Smart Parsed)`,
          severity: "success",
        });
      },
      error: () => {
        setSnackbar({ open: true, message: "Failed to parse CSV file", severity: "error" });
      },
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (rows.length > 0) {
      const ok = window.confirm("You have unsaved data. Loading a new file will replace it. Continue?");
      if (!ok) { if (fileInputRef.current) fileInputRef.current.value = ""; return; }
    }
    parseFile(file);
  };

  const handleFileDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsFileDragging(true); };
  const handleFileDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsFileDragging(false); };
  const handleFileDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleFileDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsFileDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (rows.length > 0) {
        const ok = window.confirm("You have unsaved data. Continue?");
        if (!ok) return;
      }
      parseFile(files[0]);
    }
  };

  /* ── Edit / Delete rows ── */
  const handleCellChange = (rowIndex, key, value) => {
    const updated = [...rows];
    updated[rowIndex][key] = value;
    setRows(updated);
  };

  const handleDeleteRow = (rowIndex) => {
    setRows(rows.filter((_, idx) => idx !== rowIndex));
    setSnackbar({ open: true, message: "Row deleted", severity: "info" });
  };

  /* ── Row drag-to-reorder ── */
  const handleDragStart = (index) => { setDragRowIndex(index); setIsDragging(true); };
  const handleDragEnd = () => setIsDragging(false);
  const handleDrop = (dropIndex) => {
    if (dragRowIndex === null || dragRowIndex === dropIndex) return;
    const updated = [...rows];
    const moved = updated.splice(dragRowIndex, 1)[0];
    updated.splice(dropIndex, 0, moved);
    setRows(updated);
    setDragRowIndex(null);
  };


  /* ── Upload (root: includes organization + Basic Auth) ── */
  const handleUpload = async () => {
    if (!rows.length) {
      setSnackbar({ open: true, message: "No data to upload", severity: "warning" });
      return;
    }

    const organization = getOrgFromToken();
    if (!organization) {
      setSnackbar({ open: true, message: "Could not detect organization from token. Please re-login.", severity: "error" });
      return;
    }

    setLoading(true);
    try {
      const username = "username";
      const password = "password";
      const basicToken = btoa(`${username}:${password}`);

      // Sanitize and validate rows before uploading
      let cleanRows;
      const seenRiskIds = new Set();
      try {
        cleanRows = rows.map((row, index) => {
          const newRow = { ...row };
          const rowRiskId = (row.riskId || "").toString().trim();
          if (rowRiskId) {
            if (seenRiskIds.has(rowRiskId.toLowerCase())) {
              throw new Error(`Row ${index + 1}: Duplicate Risk ID "${rowRiskId}" found in the list.`);
            }
            seenRiskIds.add(rowRiskId.toLowerCase());
          }

          CSV_COLUMNS.forEach(col => {
            const val = row[col];
            if (col === "treatmentDays" && val && isNaN(Number(val))) {
              throw new Error(`Row ${index + 1} has invalid number for Treatment Days: "${val}".`);
            }
            newRow[col] = val !== undefined && val !== null ? val : "";
          });
          return newRow;
        });
      } catch (validationError) {
        setSnackbar({ open: true, message: validationError.message, severity: "error" });
        setLoading(false);
        return;
      }

      const csvContent = Papa.unparse(cleanRows);
      const blob = new Blob([csvContent], { type: "text/csv" });
      const file = new File([blob], "bulk_risks.csv", { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("org", organization);

      const token = sessionStorage.getItem("token");
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      const region = user.region || sessionStorage.getItem("selected_region") || "US";

      const uploadUrl = `${UPLOAD_URL}`;

      // Use fetch — do NOT set Content-Type manually for FormData
      // The browser sets it automatically with the correct multipart boundary
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Upload failed: ${response.statusText}`);
      }

      setSnackbar({ open: true, message: "Bulk risks uploaded successfully ✅", severity: "success" });
      setTimeout(() => resetState(), 1500);
    } catch (err) {
      console.error("Upload failed:", err);
      const errorMessage = err.message || err.response?.data?.message || "Upload failed ❌";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ── UI ── */
  return (
    <div>
      <Box sx={{ p: 3, maxWidth: 1400, margin: "auto", minHeight: "100vh", backgroundColor: "#ffffff" }}>
        <StyledPaper elevation={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b", mb: 0.5 }}>
              Bulk Risk Upload
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mb: 2 }}>
              Upload multiple risks via CSV — organization is auto-detected from your session.<br />
              The template can be downloaded from <a href="/Risk_Register_Bulk_Upload_Template.xlsx" download style={{ color: "#7c3aed", textDecoration: "underline", fontWeight: "bold" }}>here</a> and filled and uploaded.
            </Typography>

            {/* Info tip */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, p: 2, backgroundColor: "#f5f3ff", borderLeft: "4px solid #7c3aed", borderRadius: "4px" }}>
              <InfoOutlinedIcon sx={{ fontSize: 20, mt: 0.2, color: "#7c3aed" }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Required CSV columns (in order)
                </Typography>
                <Typography variant="body2" sx={{ fontSize: "13px", color: "#475569" }}>
                  Risk ID · Department · Date · Risk Type · Asset Type · Threat · Vulnerabilities · Likelihood · Existing Controls · Treatment Days · GDPR · ISO 27001 · ISO 27701 · ISO 42001 · KSA PDPL · SOC 2
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* File Upload Zone */}
          <AnimatePresence>
            {showUploadSection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              >
                <Box sx={{ mb: 3 }}>
                  <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: "none" }} />
                  <FileInputWrapper
                    className={isFileDragging ? "dragging" : ""}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleFileDragEnter}
                    onDragLeave={handleFileDragLeave}
                    onDragOver={handleFileDragOver}
                    onDrop={handleFileDrop}
                    component={motion.div}
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                  >
                    <CloudUploadIcon sx={{ fontSize: 48, color: "#7c3aed", mb: 1 }} />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "#1e293b", mb: 0.5 }}>
                      {fileName ? "Re-upload CSV file" : "Click to upload CSV file"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b", fontSize: "13px" }}>
                      or drag and drop your file here
                    </Typography>
                    {fileName && (
                      <Typography variant="caption" sx={{ color: "#7c3aed", mt: 1, display: "block" }}>
                        Current file: {fileName}
                      </Typography>
                    )}
                  </FileInputWrapper>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats bar + Upload button */}
          {rows.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={`${rows.length} rows loaded`}
                    size="small"
                    sx={{ backgroundColor: "#f5f3ff", color: "#7c3aed", fontWeight: 600, fontSize: "13px" }}
                  />
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <ToggleButton
                      onClick={() => setShowUploadSection(!showUploadSection)}
                      startIcon={showUploadSection ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      size="small"
                      sx={{ height: "32px" }}
                    >
                      {showUploadSection ? "Hide" : "Show"} Upload
                    </ToggleButton>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <ToggleButton
                      onClick={() => { resetState(); setSnackbar({ open: true, message: "Ready to load a new file", severity: "info" }); }}
                      startIcon={<RefreshIcon />}
                      size="small"
                      sx={{ height: "32px" }}
                    >
                      Reload New File
                    </ToggleButton>
                  </motion.div>
                </Stack>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <UploadButton
                    onClick={handleUpload}
                    disabled={loading || rows.length === 0}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                  >
                    {loading ? "Uploading..." : "Upload All to Database"}
                  </UploadButton>
                </motion.div>
              </Stack>
            </motion.div>
          )}

          {/* Editable table */}
          <AnimatePresence>
            {rows.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              >
                <TableContainer component={Paper} sx={{ borderRadius: "8px", maxHeight: 600, overflow: "auto", border: "1px solid #e5e7eb" }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <StyledTableHeadCell sx={{ width: 40 }}>
                          <DragIndicatorIcon sx={{ color: "#94a3b8", fontSize: 18 }} />
                        </StyledTableHeadCell>
                        {rows[0] && Object.keys(rows[0]).map((key) => (
                          <StyledTableHeadCell key={key}>
                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                          </StyledTableHeadCell>
                        ))}
                        <StyledTableHeadCell sx={{ width: 60 }}>Actions</StyledTableHeadCell>
                      </TableRow>
                    </TableHead>
                    <TableBody component={motion.tbody} variants={containerVariants} initial="hidden" animate="visible">
                      {rows.map((row, rowIndex) => (
                        <MotionTableRow
                          key={rowIndex}
                          variants={rowVariants}
                          draggable
                          onDragStart={() => handleDragStart(rowIndex)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(rowIndex)}
                          sx={{
                            cursor: "move",
                            backgroundColor: dragRowIndex === rowIndex ? "#f5f3ff" : "transparent",
                            opacity: dragRowIndex === rowIndex && isDragging ? 0.5 : 1,
                            "&:hover": { backgroundColor: "#f8fafc" },
                          }}
                        >
                          <StyledTableCell>
                            <DragIndicatorIcon sx={{ color: "#cbd5e1", cursor: "grab", fontSize: 18 }} />
                          </StyledTableCell>
                          {Object.keys(row).map((key) => (
                            <StyledTableCell
                              key={key}
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleCellChange(rowIndex, key, e.target.innerText)}
                            >
                              {row[key]}
                            </StyledTableCell>
                          ))}
                          <StyledTableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteRow(rowIndex)}
                              sx={{ color: "#ef4444", padding: "4px", "&:hover": { backgroundColor: "#fee2e2" } }}
                            >
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </StyledTableCell>
                        </MotionTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="caption" sx={{ display: "block", mt: 2, fontSize: "12px", color: "#64748b" }}>
                  💡 Tip: Click cells to edit, drag rows to reorder, or click delete to remove a row
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
        </StyledPaper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%", whiteSpace: "pre-wrap" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </div>
  );
}

export default RootBulkRisk;
