// modules/admin/components/People/AddPersonModal.js
'use client'

import { useState } from 'react'
import { XIcon } from './components/icons'
import { createPerson } from './data/peopleData'

const initialForm = { name: '', email: '', department: '', designation: '', joined: '' }

export default function AddPersonModal({ onClose, onCreated }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = 'Enter a name'
    if (!form.email.trim()) next.email = 'Enter an email address'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "That doesn't look like a valid email"
    if (!form.department.trim()) next.department = 'Select a department'
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validation = validate()
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }
    setSubmitting(true)
    try {
      const created = await createPerson(form)
      onCreated?.(created)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Add a new person</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <XIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
        <p className="mb-5 text-[13px] text-gray-500">Enter their basic details to start onboarding.</p>

        <form onSubmit={handleSubmit} noValidate>
          <p className="mb-1.5 text-xs text-gray-400">Who are they</p>
          <input
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="mb-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          {errors.name && <p className="mb-2 text-xs text-red-600">{errors.name}</p>}

          <input
            type="email"
            placeholder="name@company.com"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="mb-1 mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          {errors.email && <p className="mb-2 text-xs text-red-600">{errors.email}</p>}

          <p className="mb-1.5 mt-4 text-xs text-gray-400">Where they'll work</p>
          <div className="mb-1 flex gap-2">
            <input
              type="text"
              placeholder="Department"
              value={form.department}
              onChange={(e) => update('department', e.target.value)}
              className="w-1/2 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Job title"
              value={form.designation}
              onChange={(e) => update('designation', e.target.value)}
              className="w-1/2 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          {errors.department && <p className="mb-2 text-xs text-red-600">{errors.department}</p>}

          <p className="mb-1.5 mt-4 text-xs text-gray-400">Start date</p>
          <input
            type="date"
            value={form.joined}
            onChange={(e) => update('joined', e.target.value)}
            className="mb-5 mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Adding…' : 'Add person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
