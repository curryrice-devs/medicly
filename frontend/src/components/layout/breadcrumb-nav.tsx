'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
  showHome?: boolean
  homeHref?: string
}

export function BreadcrumbNav({ items = [], showHome = true, homeHref }: BreadcrumbNavProps) {
  const { user } = useAuth()
  
  // Determine home href based on user role if not provided
  const defaultHomeHref = homeHref || (user?.role === 'doctor' ? '/dashboard/doctor' : '/dashboard/patient')
  
  return (
    <nav className="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
      {showHome && (
        <>
          <Link
            href={defaultHomeHref}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="sr-only">Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </>
      )}
      
      {items && items.map((item, index) => (
        <React.Fragment key={item.href}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          <Link
            href={item.href}
            className={`transition-colors ${
              index === items.length - 1
                ? 'text-gray-900 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {item.label}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  )
}