// modules/admin/components/People/PersonProfile.js
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  fetchPersonById,
  getOnboardingProgress,
  STATUS_LABEL,
} from './data/peopleData'
import PersonAvatar from './components/PersonAvatar'
import { ArrowLeftIcon, CheckIcon, CircleIcon, PlusIcon } from './components/icons'

const JOURNEY_STEPS = ['Joined', 'Background check', 'Documents', 'Training']

function stepIndexFor(person) {
  if (person.screening.status !== 'cleared') return 1
  if (!person.documents.every((d) => d.signed)) return 2
  if (!(person.trainings.length > 0 && person.trainings.every((t) => t.status === 'done'))) return 3
  return 4
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PersonProfile({ personId }) {
  const [person, setPerson] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchPersonById(personId).then((data) => {
      if (!cancelled) {
        setPerson(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [personId])

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-center text-sm text-gray-400">Loading…</div>
  }

  if (!person) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-sm font-semibold text-gray-700">We couldn't find this person</p>
        <Link href="/admin/people/directory" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          Back to directory
        </Link>
      </div>
    )
  }

  const progress = getOnboardingProgress(person)
  const currentStep = stepIndexFor(person)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href="/admin/people/directory"
        className="mb-3.5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-[13px] font-semibold text-white hover:bg-blue-700"
      >
        <ArrowLeftIcon className="h-[15px] w-[15px]" />
        Back to directory
      </Link>

      {/* Header */}
      <div className="mb-3.5 flex items-center gap-3.5 rounded-2xl bg-white px-5 py-4 shadow-sm">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
          <PersonAvatarFallback name={person.name} />
        </div>
        <div className="flex-1">
          <p className="text-base font-semibold text-gray-900">{person.name}</p>
          <p className="mt-0.5 text-xs text-gray-400">
            {person.designation} · {person.department} · joined {formatDate(person.joined)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-900">{progress}% onboarded</p>
          <div className="mt-1 h-1.5 w-[90px] rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Journey stepper */}
      <div className="mb-3 flex items-center rounded-2xl bg-white px-5 py-4 shadow-sm">
        {JOURNEY_STEPS.map((label, idx) => {
          const stepNum = idx + 1
          const done = stepNum < currentStep
          const active = stepNum === currentStep
          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-1 flex-col items-center">
                <div
                  className={[
                    'flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold',
                    done ? 'bg-violet-600 text-white' : active ? 'bg-blue-600 text-white' : 'border-[1.5px] border-gray-200 text-gray-400',
                  ].join(' ')}
                >
                  {done ? <CheckIcon className="h-3.5 w-3.5" /> : stepNum}
                </div>
                <span
                  className={`mt-1 text-[11px] ${active ? 'font-semibold text-gray-900' : 'text-gray-400'}`}
                >
                  {label}
                </span>
              </div>
              {idx < JOURNEY_STEPS.length - 1 && (
                <div className={`mb-4 h-px flex-1 ${done ? 'bg-gray-300' : 'bg-gray-100'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Background check */}
      <div className="mb-3 rounded-2xl bg-white px-5 py-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-gray-900">Background check</p>
            <p className="mt-0.5 text-xs text-gray-400">{person.screening.note}</p>
          </div>
          <span
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
              person.screening.status === 'cleared' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            {person.screening.status === 'cleared' ? 'Cleared' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Documents checklist */}
      <div className="mb-3 rounded-2xl bg-white px-5 py-3.5 shadow-sm">
        <p className="mb-2.5 text-[13px] font-semibold text-gray-900">Documents to sign</p>
        {person.documents.map((doc) => (
          <div key={doc.id} className="flex items-center gap-2.5 py-1.5">
            {doc.signed ? (
              <CheckIcon className="h-4 w-4 flex-shrink-0 text-green-600" />
            ) : (
              <CircleIcon className="h-4 w-4 flex-shrink-0 text-gray-300" />
            )}
            <span className="flex-1 text-[13px] text-gray-700">{doc.label}</span>
            <span className={`text-xs ${doc.signed ? 'text-green-600' : 'text-gray-400'}`}>
              {doc.signed ? 'Signed' : 'Not sent'}
            </span>
          </div>
        ))}
        <button
          type="button"
          className="mt-2.5 rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Send documents
        </button>
      </div>

      {/* Training */}
      <div className="mb-3 rounded-2xl bg-white px-5 py-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-gray-900">Training</p>
          <button
            type="button"
            className="flex h-7 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add training
          </button>
        </div>
        {person.trainings.length === 0 ? (
          <p className="mt-2 text-[13px] text-gray-400">No training assigned yet.</p>
        ) : (
          person.trainings.map((t) => (
            <div key={t.id} className="mt-2 flex items-center justify-between">
              <span className="text-[13px] text-gray-700">{t.title}</span>
              <span
                className={`text-xs font-semibold ${t.status === 'done' ? 'text-green-600' : 'text-amber-600'}`}
              >
                {t.status === 'done' ? 'Completed' : 'In progress'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* HR actions */}
      <div className="rounded-2xl bg-white px-5 py-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-gray-900">HR actions</p>
          <button
            type="button"
            className="flex h-7 items-center rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Log an action
          </button>
        </div>
        {person.tickets.length === 0 ? (
          <p className="mt-2 text-[13px] text-gray-400">No actions logged yet.</p>
        ) : (
          person.tickets.map((t) => (
            <div key={t.id} className="mt-2.5 flex items-center gap-2.5">
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                {t.type}
              </span>
              <span className="flex-1 text-[13px] text-gray-700">{t.title}</span>
              <span className="rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
                {t.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function PersonAvatarFallback({ name }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return <span className="text-[15px] font-bold">{initials}</span>
}
