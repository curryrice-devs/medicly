'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { SidebarProvider } from '@/contexts/sidebar-context'
import { Sidebar } from '@/components/layout/sidebar'
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav'
import { LayoutContent } from '@/components/layout/layout-content'

interface ClientLayoutWrapperProps {
  children: React.ReactNode
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()

  // Show sidebar layout only for dashboard routes when authenticated
  const shouldShowSidebarLayout = isAuthenticated && pathname.startsWith('/dashboard')

  if (shouldShowSidebarLayout) {
    return (
      <SidebarProvider>
        <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: 'white' }}>
          <Sidebar />
          <LayoutContent>
            <BreadcrumbNav />
            {children}
          </LayoutContent>
        </div>
      </SidebarProvider>
    )
  }

  // For all other routes (including "/" regardless of auth state), show just the children
  return <>{children}</>
}