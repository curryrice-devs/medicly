'use client'

import { redirect } from 'next/navigation'

export default function DoctorDashboardRoute() {
  // Redirect to main doctor dashboard
  redirect('/dashboard/doctor')
}


