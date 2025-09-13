import React, { useState } from 'react'
import { XCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirmRejection: (reason: string, notes?: string) => void
  isRejecting: boolean
}

const REJECTION_REASONS = [
  'Insufficient video quality',
  'Incomplete movement demonstration',
  'Contradictory medical history',
  'Requires in-person evaluation',
  'AI recommendation inappropriate',
  'Patient safety concerns',
  'Other'
]

export function RejectionModal({ isOpen, onClose, onConfirmRejection, isRejecting }: Props) {
  const [selectedReason, setSelectedReason] = useState('')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!selectedReason) return
    onConfirmRejection(selectedReason, notes.trim() || undefined)
  }

  const handleClose = () => {
    setSelectedReason('')
    setNotes('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Reject Case</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for rejection *
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Select a reason...</option>
              {REJECTION_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide additional context or instructions for the patient..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isRejecting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || isRejecting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isRejecting ? 'Rejecting...' : 'Reject Case'}
          </Button>
        </div>
      </div>
    </div>
  )
}