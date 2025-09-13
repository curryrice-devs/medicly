'use client'

import React, { createContext, useContext, useState } from 'react'

interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
  getSidebarWidth: () => number
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const getSidebarWidth = () => {
    return isCollapsed ? 80 : 280
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, getSidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
} 