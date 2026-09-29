// modules/admin/components/People/data/peopleData.js
//
// Data layer for the People module.
//
// TODO (integration): replace `mockPeople` and the fetch* functions below with
// real calls to the Java Spring backend once the People API endpoints exist,
// e.g.:
//   GET  /api/people                 -> list + stats
//   GET  /api/people/:id             -> single person detail
//   POST /api/people                 -> create person
//   PATCH /api/people/:id/screening  -> update screening status
//   PATCH /api/people/:id/documents  -> update document status
//   POST /api/people/:id/tickets     -> log disciplinary/event ticket
//
// Keeping all data access behind these functions means the UI components
// never need to change when the real API is wired in — only this file does.

export const STATUS = {
  ONBOARDING: 'onboarding',
  ACTIVE: 'active',
  OFFBOARDING: 'offboarding',
}

export const STATUS_LABEL = {
  [STATUS.ONBOARDING]: 'Onboarding',
  [STATUS.ACTIVE]: 'Active',
  [STATUS.OFFBOARDING]: 'Offboarding',
}

export const mockPeople = [
  {
    id: 'p1',
    name: 'Arghya Bandyopadhyay',
    email: 'arghya@consultantsfactory.com',
    department: 'IT',
    designation: 'Software developer',
    status: STATUS.ONBOARDING,
    source: 'Manual',
    joined: '2026-09-10',
    exited: null,
    screening: { status: 'pending', note: 'Sent to verification partner' },
    documents: [
      { id: 'd1', label: 'Employment agreement', signed: false },
      { id: 'd2', label: 'Confidentiality agreement', signed: false },
      { id: 'd3', label: 'Code of conduct', signed: false },
    ],
    trainings: [],
    tickets: [
      { id: 't1', type: 'Disciplinary', title: 'rfrfr', status: 'Open' },
      { id: 't2', type: 'Note', title: 'Follow up on ID proof', status: 'Open' },
    ],
  },
  {
    id: 'p2',
    name: 'Arghya Bandyopadhyay',
    email: 'arghya@consultantsfactory.com',
    department: 'IT',
    designation: 'Software',
    status: STATUS.ONBOARDING,
    source: 'Manual',
    joined: '2026-09-08',
    exited: null,
    screening: { status: 'cleared', note: 'Checked and cleared' },
    documents: [
      { id: 'd1', label: 'Employment agreement', signed: true },
      { id: 'd2', label: 'Confidentiality agreement', signed: true },
      { id: 'd3', label: 'Code of conduct', signed: false },
    ],
    trainings: [{ id: 'tr1', title: 'Security awareness', status: 'pending' }],
    tickets: [],
  },
  {
    id: 'p3',
    name: 'sss',
    email: 'arghya@consultantsfactory.com',
    department: 'ssss',
    designation: 'ssss',
    status: STATUS.ONBOARDING,
    source: 'Manual',
    joined: '2026-09-10',
    exited: null,
    screening: { status: 'pending', note: 'Awaiting background check' },
    documents: [
      { id: 'd1', label: 'Employment agreement', signed: false },
      { id: 'd2', label: 'Confidentiality agreement', signed: false },
      { id: 'd3', label: 'Code of conduct', signed: false },
    ],
    trainings: [],
    tickets: [{ id: 't1', type: 'Disciplinary', title: 'rfrfr', status: 'Open' }],
  },
  {
    id: 'p4',
    name: 'Riya Kapoor',
    email: 'riya.kapoor@company.com',
    department: 'Design',
    designation: 'UI/UX designer',
    status: STATUS.ACTIVE,
    source: 'Keka',
    joined: '2025-11-02',
    exited: null,
    screening: { status: 'cleared', note: 'Checked and cleared' },
    documents: [
      { id: 'd1', label: 'Employment agreement', signed: true },
      { id: 'd2', label: 'Confidentiality agreement', signed: true },
      { id: 'd3', label: 'Code of conduct', signed: true },
    ],
    trainings: [{ id: 'tr1', title: 'Security awareness', status: 'done' }],
    tickets: [],
  },
  {
    id: 'p5',
    name: 'Manav Shah',
    email: 'manav.shah@company.com',
    department: 'Sales',
    designation: 'Account executive',
    status: STATUS.ACTIVE,
    source: 'Keka',
    joined: '2025-06-14',
    exited: null,
    screening: { status: 'cleared', note: 'Checked and cleared' },
    documents: [
      { id: 'd1', label: 'Employment agreement', signed: true },
      { id: 'd2', label: 'Confidentiality agreement', signed: true },
      { id: 'd3', label: 'Code of conduct', signed: true },
    ],
    trainings: [],
    tickets: [],
  },
  {
    id: 'p6',
    name: 'Tara Verma',
    email: 'tara.verma@company.com',
    department: 'Ops',
    designation: 'Analyst',
    status: STATUS.OFFBOARDING,
    source: 'Manual',
    joined: '2024-01-20',
    exited: '2026-09-29',
    screening: { status: 'cleared', note: 'Checked and cleared' },
    documents: [
      { id: 'd1', label: 'Employment agreement', signed: true },
      { id: 'd2', label: 'Confidentiality agreement', signed: true },
      { id: 'd3', label: 'Code of conduct', signed: true },
    ],
    trainings: [],
    tickets: [],
  },
]

// --- Derived helpers -------------------------------------------------

export function getOpenTicketCount(person) {
  return person.tickets.filter((t) => t.status === 'Open').length
}

export function getPendingDocCount(person) {
  return person.documents.filter((d) => !d.signed).length
}

/**
 * "Needs attention" = open tickets, pending screening, or unsigned documents.
 * Returns a short human label plus a count, used for the list/table badge.
 */
export function getAttentionSummary(person) {
  const openTickets = getOpenTicketCount(person)
  const pendingScreening = person.screening.status === 'pending' ? 1 : 0
  const pendingDocs = getPendingDocCount(person)
  const total = openTickets + pendingScreening + pendingDocs

  if (total === 0) {
    return { total: 0, label: 'All clear', tone: 'success' }
  }
  return { total, label: `${total} need${total === 1 ? 's' : ''} attention`, tone: 'danger' }
}

export function getOnboardingProgress(person) {
  // Simple weighted progress: joined (always true) -> screening -> documents -> training
  const steps = [
    true, // joined
    person.screening.status === 'cleared',
    person.documents.every((d) => d.signed),
    person.trainings.length > 0 && person.trainings.every((t) => t.status === 'done'),
  ]
  const done = steps.filter(Boolean).length
  return Math.round((done / steps.length) * 100)
}

export function getStats(people) {
  return {
    total: people.length,
    onboarding: people.filter((p) => p.status === STATUS.ONBOARDING).length,
    active: people.filter((p) => p.status === STATUS.ACTIVE).length,
    offboarding: people.filter((p) => p.status === STATUS.OFFBOARDING).length,
    needsAttention: people.filter((p) => getAttentionSummary(p).total > 0).length,
  }
}

/**
 * Dashboard stat cards — mirrors the Risks Dashboard's 6-card layout
 * (Total / High / Medium / Low / Open / Closed) with People-equivalent
 * metrics.
 */
export function getDashboardStats(people) {
  return {
    total: people.length,
    needsAttention: people.filter((p) => getAttentionSummary(p).total > 0).length,
    pendingScreening: people.filter((p) => p.screening.status === 'pending').length,
    active: people.filter((p) => p.status === STATUS.ACTIVE).length,
    onboarding: people.filter((p) => p.status === STATUS.ONBOARDING).length,
    offboarding: people.filter((p) => p.status === STATUS.OFFBOARDING).length,
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Monthly new-joiner counts for a given year, shaped for a simple bar chart.
 * TODO (integration): replace with a real aggregate from the backend
 * (e.g. GET /api/people/trends?year=2026) once available — this currently
 * derives counts from the in-memory `joined` dates, so it's illustrative
 * only with the small mock dataset.
 */
export function getMonthlyJoinTrend(people, year) {
  const counts = new Array(12).fill(0)
  people.forEach((p) => {
    const d = new Date(p.joined)
    if (d.getFullYear() === year) counts[d.getMonth()] += 1
  })
  return MONTHS.map((label, i) => ({ label, count: counts[i] }))
}

// --- Fetch-shaped API (swap the body for real fetch calls later) ----

export async function fetchPeople() {
  // TODO: return fetch('/api/people').then(r => r.json())
  return mockPeople
}

export async function fetchPersonById(id) {
  // TODO: return fetch(`/api/people/${id}`).then(r => r.json())
  return mockPeople.find((p) => p.id === id) ?? null
}

export async function createPerson(payload) {
  // TODO: return fetch('/api/people', { method: 'POST', body: JSON.stringify(payload) })
  return { id: `p${mockPeople.length + 1}`, ...payload }
}
