'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
  showHome?: boolean
}

export function BreadcrumbNav({ items = [], showHome = true }: BreadcrumbNavProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
      {showHome && (
        <>
          <Link
            href="/dashboard/doctor"
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