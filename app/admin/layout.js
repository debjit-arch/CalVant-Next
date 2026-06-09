'use client'

// AdminLayout.jsx and AdminProtectedRoute.jsx are merged here.
// Your original files stay untouched in src/modules/admin/
// — just re-export or import from them below.

import AdminLayout from '@/modules/admin/AdminLayout'
import AdminProtectedRoute from '@/modules/admin/AdminProtectedRoute'

export default function AdminRootLayout({ children }) {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminProtectedRoute>
  )
}
