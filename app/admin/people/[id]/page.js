'use client'

import { useParams } from 'next/navigation'
import PersonProfile from '@/modules/admin/components/People/PersonProfile'

export default function Page() {
  const { id } = useParams()
  return <PersonProfile personId={id} />
}
