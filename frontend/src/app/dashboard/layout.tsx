'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, isAuthenticated, canAccess } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/')
        return
      }

      // Check if user is onboarded, but give some grace time for recent onboarding
      if (!user?.onboarded) {
        // Check if we came from the welcome page (to avoid redirect loop)
        const cameFromWelcome = document.referrer.includes('/welcome')
        
        if (!cameFromWelcome) {
          router.push('/welcome')
          return
        }
        
        // If we came from welcome, give the auth state time to update
        // and don't redirect immediately
        setTimeout(() => {
          // Re-check after a delay
          if (!user?.onboarded) {
            router.push('/welcome')
          }
        }, 2000)
        return
      }

      // Role-based access control
      if (user && !canAccess(pathname)) {
        // Map database roles to dashboard routes
        const dashboardRoute = user.role === 'client' ? 'patient' : user.role
        const roleBasedDashboard = `/dashboard/${dashboardRoute}`
        router.push(roleBasedDashboard)
        return
      }
    }
  }, [isAuthenticated, isLoading, user?.onboarded, user, canAccess, pathname, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user?.onboarded) {
    return null
  }

  return <>{children}</>
}