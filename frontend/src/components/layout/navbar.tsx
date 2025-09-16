'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/auth/user-menu'
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav'
import { useAuth } from '@/contexts/auth-context'

interface NavbarProps {
  title?: string
  breadcrumbs?: Array<{ label: string; href: string }>
}

export function Navbar({ title, breadcrumbs = [] }: NavbarProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  // Generate breadcrumbs based on current path if not provided
  const generateBreadcrumbs = () => {
    if (breadcrumbs.length > 0) return breadcrumbs

    const pathSegments = pathname.split('/').filter(Boolean)
    const generatedBreadcrumbs: { label: string; href: string }[] = []

    // Skip 'dashboard' and role segments
    const relevantSegments = pathSegments.slice(2) // Skip 'dashboard' and 'doctor'/'patient'

    relevantSegments.forEach((segment, index) => {
      const href = '/' + pathSegments.slice(0, 2 + index + 1).join('/')
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      generatedBreadcrumbs.push({ label, href })
    })

    return generatedBreadcrumbs
  }

  const currentBreadcrumbs = generateBreadcrumbs()

  return (
    <div className="bg-background border-b border-border px-4 sm:px-6 lg:px-8 railway-glass">
      <div className="flex items-center justify-between h-16">
        {/* Left side - Breadcrumbs */}
        <div className="flex items-center space-x-4">
          {currentBreadcrumbs.length > 0 && (
            <BreadcrumbNav 
              items={currentBreadcrumbs}
              showHome={true}
            />
          )}
        </div>

        {/* Right side - User Menu */}
        <div className="flex items-center space-x-4">
          <UserMenu />
        </div>
      </div>
    </div>
  )
}
