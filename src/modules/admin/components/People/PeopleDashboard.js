// modules/admin/components/People/PeopleDashboard.js
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  fetchPeople,
  getDashboardStats,
  getMonthlyJoinTrend,
  STATUS,
} from './data/peopleData'
import AddPersonModal from './AddPersonModal'
import {
  UsersIcon,
  AlertCircleIcon,
  ClockIcon,
  CircleCheckIcon,
  UserPlusIcon,
  DoorExitIcon,
  ChartBarIcon,
  FolderIcon,
  FileTextIcon,
  PlusIcon,
  RefreshIcon,
  BookIcon,
  HelpCircleIcon,
} from './components/icons'

const CURRENT_YEAR = new Date().getFullYear()

const STAT_TILES = [
  { key: 'total', label: 'Total', icon: UsersIcon, bg: 'bg-blue-600' },
  { key: 'needsAttention', label: 'Needs attention', icon: AlertCircleIcon, bg: 'bg-red-500' },
  { key: 'pendingScreening', label: 'Pending screening', icon: ClockIcon, bg: 'bg-orange-500' },
  { key: 'active', label: 'Active', icon: CircleCheckIcon, bg: 'bg-green-500' },
  { key: 'onboarding', label: 'Onboarding', icon: UserPlusIcon, bg: 'bg-sky-500' },
  { key: 'offboarding', label: 'Offboarding', icon: DoorExitIcon, bg: 'bg-violet-500' },
]

const QUICK_ACTIONS = [
  { key: 'templates', label: 'Onboarding templates', sub: 'Sample checklists', icon: FolderIcon, bg: 'bg-violet-500', href: '/admin/people/directory' },
  { key: 'add', label: 'Add person', sub: 'New hire', icon: PlusIcon, bg: 'bg-green-500', highlight: true },
  { key: 'view', label: 'View directory', sub: 'All people', icon: UsersIcon, bg: 'bg-amber-500', href: '/admin/people/directory' },
  { key: 'tickets', label: 'View tickets', sub: 'Open items', icon: AlertCircleIcon, bg: 'bg-red-500', href: '/admin/people/directory' },
  { key: 'offboard', label: 'Start offboarding', sub: 'Exit process', icon: FileTextIcon, bg: 'bg-blue-500', href: '/admin/people/directory' },
]

export default function PeopleDashboard() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchPeople().then((data) => {
      if (!cancelled) {
        setPeople(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => getDashboardStats(people), [people])
  const trend = useMemo(() => getMonthlyJoinTrend(people, CURRENT_YEAR), [people])
  const maxTrend = Math.max(1, ...trend.map((t) => t.count))

  const distribution = useMemo(
    () => [
      { label: 'Onboarding', value: stats.onboarding, color: '#2563EB' },
      { label: 'Active', value: stats.active, color: '#16A34A' },
      { label: 'Offboarding', value: stats.offboarding, color: '#D97706' },
    ],
    [stats]
  )

  function handleCreated() {
    fetchPeople().then(setPeople)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3.5 rounded-2xl bg-white px-5 py-4 shadow-sm">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600">
          <ChartBarIcon className="h-[22px] w-[22px] text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[17px] font-semibold text-gray-900">People dashboard</p>
          <p className="mt-0.5 text-[13px] text-gray-500">
            All · {loading ? '…' : stats.total} total people
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">Root</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
          JD
        </span>
        <button
          type="button"
          aria-label="Refresh"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          <RefreshIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Documentation"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          <BookIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-full border border-blue-200 px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50"
        >
          <HelpCircleIcon className="h-4 w-4" />
          Tutorial
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_1fr]">
        {/* Left column */}
        <div>
          <div className="mb-4 grid grid-cols-3 gap-3">
            {STAT_TILES.map((tile) => (
              <div key={tile.key} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg ${tile.bg}`}>
                  <tile.icon className="h-[18px] w-[18px] text-white" />
                </div>
                <p className="text-xl font-bold leading-none text-gray-900">
                  {loading ? '—' : stats[tile.key]}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {tile.label}
                </p>
              </div>
            ))}
          </div>

          <p className="mb-3 text-base font-semibold text-gray-900">Quick actions</p>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const content = (
                <>
                  <div
                    className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${
                      action.highlight ? 'bg-white/25' : action.bg
                    }`}
                  >
                    <action.icon className={`h-5 w-5 ${action.highlight ? 'text-white' : 'text-white'}`} />
                  </div>
                  <p className={`text-sm font-semibold ${action.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {action.label}
                  </p>
                  <p className={`mt-0.5 text-xs ${action.highlight ? 'text-white/80' : 'text-gray-400'}`}>
                    {action.sub}
                  </p>
                </>
              )

              const cardClass = [
                'rounded-2xl p-4 shadow-sm transition-transform hover:-translate-y-0.5',
                action.highlight ? 'bg-green-500' : 'border border-gray-100 bg-white',
              ].join(' ')

              if (action.highlight) {
                return (
                  <button key={action.key} type="button" onClick={() => setShowAddModal(true)} className={`text-left ${cardClass}`}>
                    {content}
                  </button>
                )
              }

              return (
                <Link key={action.key} href={action.href} className={cardClass}>
                  {content}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div>
          <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-base font-semibold text-gray-900">Status distribution</p>
            <p className="mb-5 text-xs text-gray-400">All people, current status</p>
            <div className="flex items-center justify-center">
              <DonutChart segments={distribution} total={stats.total} />
            </div>
            <div className="mt-5 flex justify-center gap-4">
              {distribution.map((d) => (
                <span key={d.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  {d.label}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-gray-900">Monthly hiring trend</p>
                <p className="text-xs text-gray-400">People joined each month</p>
              </div>
              <span className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600">{CURRENT_YEAR}</span>
            </div>
            <div className="flex h-40 items-end gap-2">
              {trend.map((m) => (
                <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-md bg-blue-500"
                    style={{ height: `${Math.max(4, (m.count / maxTrend) * 100)}%` }}
                    title={`${m.count} joined in ${m.label}`}
                  />
                  <span className="text-[10px] text-gray-400">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddPersonModal onClose={() => setShowAddModal(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}

function DonutChart({ segments, total }) {
  const size = 180
  const stroke = 22
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  let offsetSoFar = 0
  const arcs = segments.map((s) => {
    const fraction = total > 0 ? s.value / total : 0
    const length = fraction * circumference
    const arc = { ...s, length, offset: offsetSoFar }
    offsetSoFar += length
    return arc
  })

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F1F1F4" strokeWidth={stroke} />
        {arcs.map((a) => (
          <circle
            key={a.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeDasharray={`${a.length} ${circumference - a.length}`}
            strokeDashoffset={-a.offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] text-gray-400">Total</span>
        <span className="text-xl font-bold text-gray-900">{total}</span>
      </div>
    </div>
  )
}
