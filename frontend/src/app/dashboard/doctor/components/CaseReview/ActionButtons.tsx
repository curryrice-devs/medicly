import React from 'react'
import { CheckCircle2, XCircle, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  caseStatus: string
  isExerciseSaved: boolean
  hasUnsavedChanges: boolean
  isApproving: boolean
  isRejecting: boolean
  isSavingExercise: boolean
  onApprove: () => void
  onReject: () => void
  onSaveExercise: () => void
}

export function ActionButtons({
  caseStatus,
  isExerciseSaved,
  hasUnsavedChanges,
  isApproving,
  isRejecting,
  isSavingExercise,
  onApprove,
  onReject,
  onSaveExercise
}: Props) {
  // Don't show action buttons if case is not pending
  if (caseStatus !== 'pending') {
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Exercise Save Status */}
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <div className="flex items-center space-x-2 text-yellow-600">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">Unsaved changes</span>
              </div>
            )}
            {isExerciseSaved && !hasUnsavedChanges && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Exercise saved</span>
              </div>
            )}
          </div>

          {/* Save Exercise Button */}
          {hasUnsavedChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveExercise}
              disabled={isSavingExercise}
              className="flex items-center space-x-2"
            >
              {isSavingExercise ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSavingExercise ? 'Saving...' : 'Save Exercise'}</span>
            </Button>
          )}

        </div>

        {/* Main Action Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={onReject}
            disabled={isRejecting || isApproving}
            className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            {isRejecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            <span>{isRejecting ? 'Rejecting...' : 'Reject'}</span>
          </Button>

          <Button
            onClick={onApprove}
            disabled={isApproving || isRejecting || (!isExerciseSaved && hasUnsavedChanges)}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            {isApproving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{isApproving ? 'Approving...' : 'Approve'}</span>
          </Button>
        </div>
      </div>

      {/* Help text for disabled approve button */}
      {!isExerciseSaved && hasUnsavedChanges && (
        <div className="mt-3 text-sm text-gray-600">
          <span className="text-yellow-600">⚠️</span> Save your exercise changes before approving
        </div>
      )}
    </div>
  )
}