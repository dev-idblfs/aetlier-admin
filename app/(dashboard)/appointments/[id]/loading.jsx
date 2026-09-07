'use client'

import { Spinner } from '@heroui/react'

export default function AppointmentDetailLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner size="lg" />
    </div>
  )
}
