import React from 'react';
import { PatientCase } from '@/types/medical.types';

interface Props {
  cases: PatientCase[];
  onOpen: (id: string) => void;
}

export function PatientQueue({ cases, onOpen }: Props) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in-progress': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cases.map((c) => (
        <button
          key={c.id}
          onClick={() => onOpen(c.id)}
          className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200 group"
        >
          {/* Header with status badges */}
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(c.status)}`}>
              {c.status}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(c.urgency)}`}>
              {c.urgency}
            </span>
          </div>
          
          {/* Patient ID */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Patient ID</p>
            <p className="text-lg font-semibold text-gray-900">#{c.patientId}</p>
          </div>
          
          {/* Injury Type */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Injury Type</p>
            <p className="text-sm font-medium text-gray-900">{c.injuryType}</p>
          </div>
          
          {/* Submitted Date */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Submitted</p>
            <p className="text-sm text-gray-600">{new Date(c.submittedAt).toLocaleDateString()}</p>
          </div>
          
          {/* AI Recommendation */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">AI Recommendation</p>
            <p className="text-sm font-medium text-gray-900 mb-1">{c.recommendedExercise.name}</p>
            {c.aiConfidence && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Confidence</span>
                <span className="text-xs font-medium text-gray-700">
                  {Math.round(c.aiConfidence * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Hover indicator */}
          <div className="mt-4 flex items-center text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
            <span>Click to review</span>
            <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      ))}
    </div>
  );
}


