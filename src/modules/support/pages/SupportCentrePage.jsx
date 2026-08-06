"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  LifeBuoy,
  Plus,
  X,
  Send,
  Loader2,
  ChevronLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import supportService from "../services/supportService";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const CATEGORIES = ["General", "Billing", "Technical", "Access", "Other"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const STATUS_STYLE = {
  OPEN: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", label: "Open" },
  IN_PROGRESS: { bg: "#fffbeb", text: "#b45309", border: "#fde68a", label: "In Progress" },
  RESOLVED: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0", label: "Resolved" },
  CLOSED: { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0", label: "Closed" },
};

const PRIORITY_STYLE = {
  LOW: { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
  MEDIUM: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  HIGH: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  URGENT: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
};

const fmtDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

// ── Small UI atoms ───────────────────────────────────────────────────────────

const Badge = ({ palette, children }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      background: palette.bg,
      color: palette.text,
      border: `1px solid ${palette.border}`,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

const EmptyState = ({ onNew }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "60px 24px",
      color: "#64748b",
    }}
  >
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 14,
        background: "#eff6ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
      }}
    >
      <LifeBuoy size={26} color="#2563eb" />
    </div>
    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
      No support tickets yet
    </h3>
    <p style={{ margin: "6px 0 20px", fontSize: 14, maxWidth: 320 }}>
      Run into an issue or have a question? Raise a ticket and our team will get back to you.
    </p>
    <button onClick={onNew} style={primaryBtnStyle}>
      <Plus size={16} /> New Ticket
    </button>
  </div>
);

const primaryBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#334155",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 14,
  color: "#0f172a",
  outline: "none",
  fontFamily: "inherit",
};

// ── New Ticket modal ─────────────────────────────────────────────────────────

const NewTicketModal = ({ onClose, onCreated }) => {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError("Subject and description are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const ticket = await supportService.createTicket({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
      });
      onCreated(ticket);
    } catch (err) {
      setError(err.message || "Failed to create ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
            New Support Ticket
          </h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Subject</label>
            <input
              style={inputStyle}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue"
              maxLength={150}
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Priority</label>
              <select style={inputStyle} value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 110, fontFamily: "inherit" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us what's happening — steps to reproduce, error messages, anything that helps."
            />
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#b91c1c", fontSize: 13 }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button type="button" style={secondaryBtnStyle} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" style={primaryBtnStyle} disabled={submitting}>
              {submitting ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#64748b",
  marginBottom: 6,
};

// ── Ticket thread / detail view ──────────────────────────────────────────────

const TicketThread = ({ ticket, currentUserId, onBack, onReply }) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const statusPalette = STATUS_STYLE[ticket.status] || STATUS_STYLE.OPEN;
  const priorityPalette = PRIORITY_STYLE[ticket.priority] || PRIORITY_STYLE.MEDIUM;
  const closed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError("");
    try {
      await onReply(ticket.id, message.trim());
      setMessage("");
    } catch (err) {
      setError(err.message || "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "#2563eb",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          padding: 0,
          marginBottom: 16,
        }}
      >
        <ChevronLeft size={16} /> Back to all tickets
      </button>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            <Badge palette={statusPalette}>{statusPalette.label}</Badge>
            <Badge palette={priorityPalette}>{ticket.priority}</Badge>
            {ticket.category && <Badge palette={PRIORITY_STYLE.LOW}>{ticket.category}</Badge>}
          </div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
            {ticket.subject}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
            {ticket.ticketNumber} &middot; opened {fmtDate(ticket.createdAt)}
          </p>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16, maxHeight: 480, overflowY: "auto" }}>
          {(ticket.messages || []).map((m, i) => {
            const mine = m.senderId === currentUserId || m.senderRole === "user";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: mine ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    background: mine ? "#2563eb" : "#f1f5f9",
                    color: mine ? "#fff" : "#0f172a",
                    padding: "10px 14px",
                    borderRadius: 12,
                    borderBottomRightRadius: mine ? 4 : 12,
                    borderBottomLeftRadius: mine ? 12 : 4,
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.message}
                </div>
                <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                  {m.senderRole === "admin" ? "Support Team" : m.senderName || "You"} &middot; {fmtDate(m.createdAt)}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9" }}>
          {closed ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#64748b",
                fontSize: 13,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <CheckCircle2 size={16} />
              This ticket is {statusPalette.label.toLowerCase()}. Reply to reopen the conversation.
            </div>
          ) : null}
          <form onSubmit={handleSend} style={{ display: "flex", gap: 10, marginTop: closed ? 12 : 0 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Write a reply..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit" style={primaryBtnStyle} disabled={sending || !message.trim()}>
              {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            </button>
          </form>
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#b91c1c", fontSize: 13, marginTop: 8 }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Ticket list row ──────────────────────────────────────────────────────────

const TicketRow = ({ ticket, onOpen }) => {
  const statusPalette = STATUS_STYLE[ticket.status] || STATUS_STYLE.OPEN;
  const priorityPalette = PRIORITY_STYLE[ticket.priority] || PRIORITY_STYLE.MEDIUM;

  return (
    <button
      onClick={() => onOpen(ticket)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        textAlign: "left",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{ticket.ticketNumber}</span>
          {ticket.lastMessageBy === "admin" && (
            <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 700 }}>&bull; New reply</span>
          )}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#0f172a",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {ticket.subject}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
          <Clock size={12} /> updated {fmtDate(ticket.updatedAt)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <Badge palette={priorityPalette}>{ticket.priority}</Badge>
        <Badge palette={statusPalette}>{statusPalette.label}</Badge>
      </div>
    </button>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const SupportCentrePage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await supportService.listTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openTicket = async (ticket) => {
    try {
      const fresh = await supportService.getTicket(ticket.id);
      setSelected(fresh);
    } catch (err) {
      setSelected(ticket);
    }
  };

  const handleReply = async (id, message) => {
    const updated = await supportService.replyToTicket(id, message);
    setSelected(updated);
    setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const handleCreated = (ticket) => {
    setTickets((prev) => [ticket, ...prev]);
    setShowNew(false);
    setSelected(ticket);
  };

  const filtered = tickets.filter((t) => {
    if (filter === "ALL") return true;
    if (filter === "OPEN") return t.status === "OPEN" || t.status === "IN_PROGRESS";
    return t.status === filter;
  });

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 60px" }}>
      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {!selected && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LifeBuoy size={22} color="#2563eb" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
                  Support Centre
                </h1>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                  {user?.organizationName ? `${user.organizationName} · ` : ""}
                  Raise a ticket and track replies from our team
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button style={secondaryBtnStyle} onClick={load} title="Refresh">
                <RefreshCw size={16} />
              </button>
              <button style={primaryBtnStyle} onClick={() => setShowNew(true)}>
                <Plus size={16} /> New Ticket
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { key: "ALL", label: "All" },
              { key: "OPEN", label: "Open" },
              { key: "RESOLVED", label: "Resolved" },
              { key: "CLOSED", label: "Closed" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: `1px solid ${filter === f.key ? "#2563eb" : "#e2e8f0"}`,
                  background: filter === f.key ? "#eff6ff" : "#fff",
                  color: filter === f.key ? "#2563eb" : "#475569",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#b91c1c",
                fontSize: 13,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 16,
              }}
            >
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: "#94a3b8" }}>
              <Loader2 size={22} className="spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onNew={() => setShowNew(true)} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((t) => (
                <TicketRow key={t.id} ticket={t} onOpen={openTicket} />
              ))}
            </div>
          )}
        </>
      )}

      {selected && (
        <TicketThread
          ticket={selected}
          currentUserId={user?.id || user?._id}
          onBack={() => {
            setSelected(null);
            load();
          }}
          onReply={handleReply}
        />
      )}

      {showNew && <NewTicketModal onClose={() => setShowNew(false)} onCreated={handleCreated} />}
    </div>
  );
};

export default SupportCentrePage;
