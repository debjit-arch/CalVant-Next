// modules/admin/components/People/components/PersonAvatar.js
'use client'

const PALETTE = [
  { bg: 'bg-violet-100', text: 'text-violet-600' },
  { bg: 'bg-amber-100', text: 'text-amber-600' },
  { bg: 'bg-blue-100', text: 'text-blue-600' },
  { bg: 'bg-red-100', text: 'text-red-600' },
  { bg: 'bg-green-100', text: 'text-green-600' },
]

function initialsFor(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function colorFor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export default function PersonAvatar({ name, size = 34 }) {
  const { bg, text } = colorFor(name || '')
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-bold ${bg} ${text}`}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.34)) }}
    >
      {initialsFor(name)}
    </div>
  )
}
