// modules/admin/components/People/components/StatusPill.js
'use client'

import { STATUS, STATUS_LABEL } from '../data/peopleData'

const STATUS_STYLES = {
  [STATUS.ONBOARDING]: 'bg-blue-50 text-blue-600',
  [STATUS.ACTIVE]: 'bg-green-50 text-green-600',
  [STATUS.OFFBOARDING]: 'bg-amber-50 text-amber-600',
}

export function StatusPill({ status }) {
  return (
    <span
      className={`w-fit rounded-md px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'
        }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

const TONE_STYLES = {
  success: 'bg-green-50 text-green-600',
  danger: 'bg-red-50 text-red-600',
  warning: 'bg-amber-50 text-amber-600',
}

export function AttentionBadge({ label, tone }) {
  return (
    <span className={`w-fit rounded-md px-2.5 py-1 text-[11px] font-semibold ${TONE_STYLES[tone] ?? TONE_STYLES.success}`}>
      {label}
    </span>
  )
}
