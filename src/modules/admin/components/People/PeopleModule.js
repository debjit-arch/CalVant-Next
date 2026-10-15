// modules/admin/components/People/PeopleModule.js
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  fetchPeople,
  getStats,
  getAttentionSummary,
  STATUS,
} from './data/peopleData'
import StatCard from './components/StatCard'
import PersonAvatar from './components/PersonAvatar'
import { StatusPill, AttentionBadge } from './components/StatusPill'
import AddPersonModal from './AddPersonModal'
import { UsersIcon, UserPlusIcon, CircleCheckIcon, DoorExitIcon, AlertCircleIcon, PlusIcon, SearchIcon, ArrowLeftIcon } from './components/icons'

const STAT_FILTERS = [
  { key: 'all', label: 'Total', icon: UsersIcon, tone: 'blue' },
  { key: STATUS.ONBOARDING, label: 'Onboarding', icon: UserPlusIcon, tone: 'violet' },
  { key: STATUS.ACTIVE, label: 'Active', icon: CircleCheckIcon, tone: 'green' },
  { key: STATUS.OFFBOARDING, label: 'Offboarding', icon: DoorExitIcon, tone: 'amber' },
  { key: 'needsAttention', label: 'Needs attention', icon: AlertCircleIcon, tone: 'red' },
]

export default function PeopleModule() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [statFilter, setStatFilter] = useState('all')
  const [department, setDepartment] = useState('all')
  const [search, setSearch] = useState('')
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

  const stats = useMemo(() => getStats(people), [people])

  const departments = useMemo(
    () => Array.from(new Set(people.map((p) => p.department))).sort(),
    [people]
  )

  const filteredPeople = useMemo(() => {
    return people.filter((p) => {
      if (statFilter === STATUS.ONBOARDING && p.status !== STATUS.ONBOARDING) return false
      if (statFilter === STATUS.ACTIVE && p.status !== STATUS.ACTIVE) return false
      if (statFilter === STATUS.OFFBOARDING && p.status !== STATUS.OFFBOARDING) return false
      if (statFilter === 'needsAttention' && getAttentionSummary(p).total === 0) return false
      if (department !== 'all' && p.department !== department) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !p.email.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [people, statFilter, department, search])

  function handleCreated(newPerson) {
    setPeople((prev) => [newPerson, ...prev])
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link
        href="/admin/people"
        className="mb-3.5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-[13px] font-semibold text-white hover:bg-blue-700"
      >
        <ArrowLeftIcon className="h-[15px] w-[15px]" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="mb-3.5 flex items-center gap-3.5 rounded-2xl bg-white px-5 py-4 shadow-sm">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-violet-600">
          <UsersIcon className="h-[22px] w-[22px] text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[17px] font-semibold text-gray-900">People directory</p>
          <p className="mt-0.5 text-[13px] text-gray-500">
            {loading ? 'Loading…' : `${people.length} people across your organization`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-[13px] font-semibold text-white hover:bg-blue-700"
        >
          <PlusIcon className="h-[15px] w-[15px]" />
          Add person
        </button>
      </div>

      {/* Stat card filters */}
      <div className="mb-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {STAT_FILTERS.map((f) => (
          <StatCard
            key={f.key}
            icon={f.icon}
            tone={f.tone}
            count={stats[f.key === 'all' ? 'total' : f.key] ?? 0}
            label={f.label}
            selected={statFilter === f.key}
            onClick={() => setStatFilter(f.key)}
          />
        ))}
      </div>

      {/* Filter bar */}
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm">
        <label className="text-[11px] font-semibold text-gray-400">
          DEPARTMENT
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="ml-2 h-8 rounded-lg border border-gray-200 px-2 text-[12px] font-normal text-gray-700"
          >
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <div className="relative flex-1 min-w-[160px]">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-gray-200 pl-8 pr-3 text-[12px] outline-none focus:border-blue-400"
          />
        </div>

        <span className="whitespace-nowrap text-[11px] text-gray-400">{filteredPeople.length} people</span>
      </div>

      {/* Row list */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Loading people…</div>
        ) : filteredPeople.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-semibold text-gray-700">No one matches these filters</p>
            <p className="mt-1 text-[13px] text-gray-400">Try a different search or clear the filters above.</p>
          </div>
        ) : (
          filteredPeople.map((person, i) => {
            const attention = getAttentionSummary(person)
            return (
              <div
                key={person.id}
                className={`flex items-center gap-3 px-[18px] py-3.5 ${i !== filteredPeople.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
              >
                <PersonAvatar name={person.name} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-gray-900">{person.name}</p>
                  <p className="truncate text-[12px] text-gray-400">
                    {person.department} · {person.designation}
                  </p>
                </div>
                <div className="w-[110px]">
                  <StatusPill status={person.status} />
                </div>
                <div className="w-[135px]">
                  <AttentionBadge label={attention.label} tone={attention.tone} />
                </div>
                <Link
                  href={`/admin/people/${person.id}`}
                  className="flex h-[30px] items-center rounded-lg border border-gray-200 bg-white px-3 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Open
                </Link>
              </div>
            )
          })
        )}
      </div>

      {showAddModal && (
        <AddPersonModal onClose={() => setShowAddModal(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}
