import React, { useState } from 'react';
import { PatientCase } from '@/types/medical.types';

interface Props {
  caze: PatientCase;
}

export function PatientContextPanel({ caze }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-gray-200 rounded-lg">
      <button 
        onClick={() => setOpen(!open)} 
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">Patient Information</span>
        <span className="text-sm text-gray-500">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Patient ID</p>
              <p className="text-gray-900 font-medium">#{caze.patientId}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Injury Type</p>
              <p className="text-gray-900 font-medium">{caze.injuryType}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Submitted</p>
              <p className="text-gray-900">{new Date(caze.submittedAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                caze.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                caze.status === 'approved' ? 'bg-green-100 text-green-800' :
                caze.status === 'modified' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {caze.status}
              </span>
            </div>
          </div>
          
          {/* Medical History Section */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Medical History</h4>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Previous Injuries</p>
                <p className="text-sm text-gray-700">Lower back strain (2022), Right shoulder impingement (2021)</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current Medications</p>
                <p className="text-sm text-gray-700">Ibuprofen 400mg as needed, Physical therapy exercises</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Allergies</p>
                <p className="text-sm text-gray-700">None known</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Activity Level</p>
                <p className="text-sm text-gray-700">Moderately active, office worker, recreational tennis</p>
              </div>
            </div>
          </div>
          
          {/* Recommended Exercise Section */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Recommended Exercise</h4>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-900 mb-1">{caze.recommendedExercise.name}</p>
              <p className="text-xs text-green-700">
                {caze.recommendedExercise.defaultSets} sets × {caze.recommendedExercise.defaultReps} reps, {caze.recommendedExercise.defaultFrequency}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


