'use client'

import React from 'react'

export type ViewType = 'overview' | 'pose' | 'icon' | '3d' | 'health' | 'claude' | 'version' | 'data_summary'

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
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Analysis Views</h2>
        <p className="text-sm text-gray-600">Switch between different analysis modes</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id as ViewType)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
              activeView === view.id
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'text-gray-700 hover:bg-gray-100'
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
        <div className="p-4 border-t border-gray-200 bg-gray-100">
          <h3 className="text-sm font-medium text-gray-900 mb-2">System Info</h3>
          <div className="text-xs text-gray-600 space-y-1">
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
