import React, { useState, useEffect } from 'react';
import { PatientCase } from '@/types/medical.types';
import { doctorApi } from '@/services/api';

interface MedicalHistoryItem {
  category: string;
  item: string;
  details: string;
  severity?: string;
  date?: string;
  status: string;
}

interface PatientProfile {
  id: string;
  case_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: MedicalHistoryItem[];
  current_medications?: string[];
  allergies?: string[];
  created_at: string;
  updated_at: string;
}

interface Props {
  caze: PatientCase;
}

export function PatientContextPanel({ caze }: Props) {
  const [open, setOpen] = useState(true);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatientProfile() {
      setLoading(true);
      console.log('[PatientContextPanel] fetching profile for case:', caze);
      try {
        const profile = await doctorApi.getPatientProfile(caze.patientId);
        console.log('[PatientContextPanel] received profile:', profile);
        setPatientProfile(profile);
      } catch (error) {
        console.error('Failed to fetch patient profile:', error);
      } finally {
        setLoading(false);
      }
    }

    if (caze.patientId) {
      fetchPatientProfile();
    }
  }, [caze.patientId]);

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
          
          {/* Patient Profile Section */}
          {patientProfile && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Patient Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
                  <p className="text-gray-900 font-medium">{patientProfile.full_name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Age</p>
                  <p className="text-gray-900">{patientProfile.age || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Gender</p>
                  <p className="text-gray-900">{patientProfile.gender || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                  <p className="text-gray-900">{patientProfile.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Medical History Section */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Medical History</h4>
            {loading ? (
              <div className="text-sm text-gray-500">Loading medical history...</div>
            ) : (
              <div className="space-y-3">
                {/* Medical History Items */}
                {patientProfile?.medical_history && patientProfile.medical_history.length > 0 ? (
                  <div className="space-y-2">
                    {patientProfile.medical_history.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {item.category}
                          </p>
                          {item.date && (
                            <p className="text-xs text-gray-400">
                              {new Date(item.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">{item.item}</p>
                        <p className="text-sm text-gray-700">{item.details}</p>
                        {item.severity && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                            item.severity === 'high' ? 'bg-red-100 text-red-800' :
                            item.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.severity} severity
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-500">No medical history recorded</p>
                  </div>
                )}

                {/* Current Medications */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Current Medications</p>
                  {patientProfile?.current_medications && patientProfile.current_medications.length > 0 ? (
                    <div className="space-y-1">
                      {patientProfile.current_medications.map((medication, index) => (
                        <p key={index} className="text-sm text-gray-700">• {medication}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700">None recorded</p>
                  )}
                </div>

                {/* Allergies */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Allergies</p>
                  {patientProfile?.allergies && patientProfile.allergies.length > 0 ? (
                    <div className="space-y-1">
                      {patientProfile.allergies.map((allergy, index) => (
                        <p key={index} className="text-sm text-gray-700">• {allergy}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700">None known</p>
                  )}
                </div>
              </div>
            )}
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


