// Talks to support-service via the gateway. Matches the pattern used by the
// admin panel's supportApi.js, but hits the customer-facing endpoints
// (/api/support-tickets — not /api/admin/support-tickets). Visibility rule
// (enforced server-side): a regular user sees only tickets they raised;
// root/super_admin see every ticket raised within their organization.

const SUPPORT_URL = `${process.env.NEXT_PUBLIC_SP}/support-service`;
const BASE = `${SUPPORT_URL}/api/support-tickets`;

const getToken = () =>
  (typeof window !== "undefined" && sessionStorage.getItem("token")) || "";

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

const jsonHeaders = () => ({
  ...authHeaders(),
  "Content-Type": "application/json",
});

const handle = async (res) => {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.error || body.message || message;
    } catch (_) {
      // no JSON body
    }
    throw new Error(message);
  }
  return res.json();
};

class SupportService {
  // ── List all tickets visible to the current user ──
  async listTickets() {
    const res = await fetch(BASE, { headers: authHeaders() });
    return handle(res);
  }

  // ── Get a single ticket (with its full message thread) ──
  async getTicket(id) {
    const res = await fetch(`${BASE}/${id}`, { headers: authHeaders() });
    return handle(res);
  }

  // ── Raise a new ticket ──
  async createTicket({ subject, description, category, priority }) {
    const res = await fetch(BASE, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ subject, description, category, priority }),
    });
    return handle(res);
  }

  // ── Reply on an existing ticket ──
  async replyToTicket(id, message) {
    const res = await fetch(`${BASE}/${id}/reply`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ message }),
    });
    return handle(res);
  }
}

export default new SupportService();
