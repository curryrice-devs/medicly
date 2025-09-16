'use client'

import React from 'react'

export type ViewType = 'overview' | 'pose' | 'icon' | '3d' | 'health' | 'claude' | 'version' | 'data_summary' | 'input' | 'processing'

interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  versionInfo?: any
  processingStatus?: any
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  versionInfo, 
  processingStatus 
}) => {
  const views = [
    { id: 'input', label: 'Input & Preview', icon: '📹' },
    { id: 'processing', label: 'Processing & Results', icon: '⚙️' }
  ]

  const getStatusIndicator = (viewId: ViewType) => {
    if (!processingStatus) return null
    
    switch (viewId) {
      case 'pose':
        return processingStatus.status === 'completed' ? '✅' : '⏳'
      case 'icon':
        return processingStatus.icon_analysis?.completed ? '✅' : '⏳'
      case '3d':
        return processingStatus.mesh_created ? '✅' : '⏳'
      case 'health':
        return processingStatus.health_analysis ? '✅' : '⏳'
      case 'claude':
        return processingStatus.claude_analysis ? '✅' : '⏳'
      default:
        return null
    }
  }

  return (
    <div className="w-64 bg-card border-r border-border h-full flex flex-col railway-glass">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Analysis Views</h2>
        <p className="text-sm text-muted-foreground">Switch between different analysis modes</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id as ViewType)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors railway-button-outline ${
              activeView === view.id
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'text-foreground hover:bg-muted border-border'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{view.icon}</span>
              <span>{view.label}</span>
            </div>
            {getStatusIndicator(view.id as ViewType)}
          </button>
        ))}
      </nav>

      {/* Version Info */}
      {versionInfo && (
        <div className="p-4 border-t border-border bg-muted/50">
          <h3 className="text-sm font-medium text-foreground mb-2">System Info</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>API: {versionInfo.api_version}</div>
            <div>MediaPipe: {versionInfo.libraries?.mediapipe}</div>
            <div>ICON: {versionInfo.icon_analyzer?.version}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar
