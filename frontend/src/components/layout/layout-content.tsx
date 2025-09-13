'use client'

import React from 'react'
import { useSidebar } from '@/contexts/sidebar-context'
import { Navbar } from './navbar'

interface LayoutContentProps {
  children: React.ReactNode
}

export function LayoutContent({ children }: LayoutContentProps) {
  const { isCollapsed } = useSidebar()
  const sidebarWidth = isCollapsed ? 80 : 280

  return (
    <div style={{ 
      marginLeft: `${sidebarWidth}px`,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      transition: 'margin-left 0.3s ease-in-out'
    }}>
      {/* Navbar */}
      <Navbar />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
} 