// modules/admin/components/People/components/StatCard.js
'use client'

const TONE_STYLES = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600' },
  green: { bg: 'bg-green-50', icon: 'text-green-600' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
  red: { bg: 'bg-red-50', icon: 'text-red-600' },
}

export default function StatCard({ icon: Icon, count, label, tone = 'blue', selected = false, onClick }) {
  const toneStyle = TONE_STYLES[tone] ?? TONE_STYLES.blue

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 text-left shadow-sm transition-colors',
        selected ? 'border-[1.5px] border-blue-600' : 'border border-gray-100 hover:border-gray-200',
      ].join(' ')}
    >
      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${toneStyle.bg}`}>
        {Icon ? <Icon className={`h-4 w-4 ${toneStyle.icon}`} aria-hidden="true" /> : null}
      </span>
      <span>
        <p className="text-base font-bold leading-none text-gray-900">{count}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      </span>
    </button>
  )
}
