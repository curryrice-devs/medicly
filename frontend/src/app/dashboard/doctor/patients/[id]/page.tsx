'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Activity,
  FileText,
  Clock,
  Video,
  MessageSquare,
  Edit3,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { doctorApi } from '@/services/api'
import { PatientProfile, PatientCase } from '@/types/medical.types'

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const patientId = params.id as string

  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [cases, setCases] = useState<PatientCase[]>([])
  const [patientLoading, setPatientLoading] = useState(true)
  const [casesLoading, setCasesLoading] = useState(true)
  const [patientError, setPatientError] = useState<string | null>(null)
  const [casesError, setCasesError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isPatientInCare, setIsPatientInCare] = useState(false)
  const [assignmentError, setAssignmentError] = useState<string | null>(null)

  // Debug: Log render state
  console.log('🖥️ RENDER: Component rendering with states:', {
    patientId,
    patientLoading,
    casesLoading,
    hasPatient: !!patient,
    hasPatientError: !!patientError,
    hasCasesError: !!casesError,
    casesCount: cases.length,
    retryCount,
    isRetrying
  })

  // Load patient profile function
  const loadPatientProfile = async () => {
      if (!patientId) {
        console.log('❌ loadPatientProfile: no patientId provided')
        return
      }

      console.log('🔄 loadPatientProfile: starting for patient:', patientId)
      console.log('🔄 loadPatientProfile: current patientLoading state:', patientLoading)

      setPatientLoading(true)
      setPatientError(null)

      console.log('📞 loadPatientProfile: calling doctorApi.getPatientProfile')

      try {
        const patientData = await doctorApi.getPatientProfile(patientId)
        console.log('✅ loadPatientProfile: API call completed')
        console.log('📋 loadPatientProfile: patientData received:', patientData)
        console.log('📋 loadPatientProfile: patientData type:', typeof patientData)
        console.log('📋 loadPatientProfile: patientData is null?', patientData === null)

        setPatient(patientData)
        console.log('💾 loadPatientProfile: patient state updated')
      } catch (err) {
        console.error('❌ loadPatientProfile: Error occurred:', err)
        setPatientError(err instanceof Error ? err.message : 'Failed to load patient profile')
      } finally {
        setPatientLoading(false)
        console.log('✅ loadPatientProfile: FINISHED - patientLoading set to false')
      }
    }

  // Load patient cases function  
  const loadPatientCases = async () => {
    if (!patientId) return

    setCasesLoading(true)
    setCasesError(null)

    try {
      const casesData = await doctorApi.getPatientCases(patientId)
      setCases(casesData)
      console.log('[casesData]', casesData)
    } catch (err) {
      console.error('Error loading patient cases:', err)
      setCasesError(err instanceof Error ? err.message : 'Failed to load patient cases')
    } finally {
      setCasesLoading(false)
      console.log('finished patient cases load')
    }
  }

  // Retry function for failed requests
  const retryLoadPatient = async () => {
    console.log('🔄 RETRY: Starting retry attempt', retryCount + 1)
    setIsRetrying(true)
    setPatientError(null)
    setRetryCount(prev => prev + 1)
    
    try {
      await loadPatientProfile()
    } finally {
      setIsRetrying(false)
    }
  }

  // Check if error is a timeout error
  const isTimeoutError = (error: string | null): boolean => {
    return error?.toLowerCase().includes('timeout') || error?.toLowerCase().includes('timed out') || false
  }

  // Check if patient is already in doctor's care
  const checkPatientInCare = async () => {
    if (!user?.id || !patientId) return

    try {
      const doctorPatients = await doctorApi.getDoctorPatients(user.id)
      const isInCare = doctorPatients.some(p => p.id === patientId)
      setIsPatientInCare(isInCare)
    } catch (error) {
      console.error('Error checking patient care status:', error)
    }
  }

  // Handle adding patient to care
  const handleAddToMyCare = async () => {
    if (!user?.id || !patientId) return

    setIsAssigning(true)
    setAssignmentError(null)

    try {
      await doctorApi.assignPatientToDoctor(user.id, patientId, 'Added via patient profile')
      setIsPatientInCare(true)
      
      // Optionally show success message or refresh data
      console.log('Patient successfully added to care')
    } catch (error) {
      console.error('Error adding patient to care:', error)
      setAssignmentError(error instanceof Error ? error.message : 'Failed to add patient to care')
    } finally {
      setIsAssigning(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      console.log('🚀 USEEFFECT: Starting data load for patient:', patientId)
      console.log('🚀 USEEFFECT: Current states - patientLoading:', patientLoading, 'casesLoading:', casesLoading)
      try {
        await Promise.all([
          loadPatientProfile(),
          loadPatientCases(),
          checkPatientInCare()
        ])
        console.log('🎉 USEEFFECT: All data loading completed successfully')
      } catch (err) {
        console.error('❌ USEEFFECT: Error in data loading:', err)
      }
    }

    console.log('🔄 USEEFFECT: About to call loadData()')
    loadData()
    console.log('🔄 USEEFFECT: loadData() called, useEffect finishing')
  }, [patientId, user?.id])


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'active': return <Activity className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'rejected': return <X className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  if (patientLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading patient details...</p>
        </div>
      </div>
    )
  }

  if (patientError || !patient) {
    const isTimeout = isTimeoutError(patientError)
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {isTimeout ? 'Connection Timeout' : 'Error loading patient'}
          </h1>
          <p className="text-red-600 mb-4">
            {patientError || 'Patient not found'}
          </p>
          
          {isTimeout && retryCount < 3 && (
            <p className="text-sm text-gray-600 mb-4">
              The database query is taking longer than expected. This might be due to high server load.
            </p>
          )}
          
          <div className="flex justify-center space-x-3">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            
            {isTimeout && retryCount < 3 && (
              <Button 
                onClick={retryLoadPatient} 
                disabled={isRetrying}
                variant="default"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    Retry {retryCount > 0 && `(${retryCount}/3)`}
                  </>
                )}
              </Button>
            )}
            
            {retryCount >= 3 && (
              <p className="text-sm text-gray-500 mt-2">
                Still having issues? Please contact support or try again later.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Patients
          </Button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold text-xl">
                  {patient.fullName ? patient.fullName.split(' ').map(n => n[0]).join('') : '??'}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{patient.fullName || 'Unknown Patient'}</h1>
                <p className="text-gray-600">Case ID: {patient.caseId || 'N/A'}</p>
                {isPatientInCare && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      In Your Care
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {!isPatientInCare && user?.role === 'doctor' && (
                <Button
                  onClick={handleAddToMyCare}
                  disabled={isAssigning}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add to My Care
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {assignmentError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
                <p className="text-red-700 text-sm">{assignmentError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Medical Information Card */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-green-600" />
                Medical & Personal Information
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Contact Information</h3>

                  {patient.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-900">{patient.email}</span>
                    </div>
                  )}

                  {patient.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-900">{patient.phone}</span>
                    </div>
                  )}

                  {patient.address && (
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 text-gray-400 mr-3 mt-0.5" />
                      <span className="text-sm text-gray-900">{patient.address}</span>
                    </div>
                  )}

                  {/* Emergency Contact */}
                  {(patient.emergencyContactName || patient.emergencyContactPhone) && (
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="text-xs font-medium text-gray-600 mb-2">Emergency Contact</h4>
                      {patient.emergencyContactName && (
                        <div className="flex items-center mb-1">
                          <User className="w-3 h-3 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{patient.emergencyContactName}</span>
                        </div>
                      )}
                      {patient.emergencyContactPhone && (
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{patient.emergencyContactPhone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Demographics */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Demographics</h3>

                  {patient.age && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-900">Age: {patient.age}</span>
                    </div>
                  )}

                  {patient.gender && (
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-900 capitalize">{patient.gender}</span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">Case ID: {patient.caseId || 'N/A'}</span>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Account Created</h4>
                    <span className="text-sm text-gray-700">
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Medical Information</h3>

                  {/* Medical History */}
                  {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 mb-2">Medical History</h4>
                      <div className="space-y-1">
                        {patient.medicalHistory.map((item, index) => (
                          <div key={index} className="flex items-start">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2 mt-2" />
                            <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 mb-2">Medical History</h4>
                      <p className="text-sm text-gray-500 italic">No medical history recorded</p>
                    </div>
                  )}

                  {/* Current Medications */}
                  {patient.currentMedications && patient.currentMedications.length > 0 ? (
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 mb-2">Current Medications</h4>
                      <div className="space-y-1">
                        {patient.currentMedications.map((med, index) => (
                          <div key={index} className="flex items-start">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 mt-2" />
                            <span className="text-sm text-gray-700 leading-relaxed">{med}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 mb-2">Current Medications</h4>
                      <p className="text-sm text-gray-500 italic">No medications recorded</p>
                    </div>
                  )}

                  {/* Allergies */}
                  {patient.allergies && patient.allergies.length > 0 ? (
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 mb-2">Allergies</h4>
                      <div className="space-y-1">
                        {patient.allergies.map((allergy, index) => (
                          <div key={index} className="flex items-start">
                            <AlertCircle className="w-3 h-3 text-red-400 mr-2 mt-1" />
                            <span className="text-sm text-gray-700 leading-relaxed">{allergy}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 mb-2">Allergies</h4>
                      <p className="text-sm text-gray-500 italic">No allergies recorded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                Active Sessions
                {!casesLoading && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {cases.length}
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-600 mt-1">Patient's therapy sessions and exercise assignments</p>
            </div>

            <div className="p-6">
              {casesLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Loading sessions...</p>
                </div>
              ) : casesError ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading sessions</h3>
                  <p className="text-red-600 mb-4">{casesError}</p>
                </div>
              ) : cases.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h3>
                  <p className="text-gray-600 mb-4">
                    This patient doesn't have any active therapy sessions at the moment.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                    <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                      <Video className="w-4 h-4 mr-2" />
                      Schedule Session
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                  {cases.map((patientCase) => (
                    <div
                      key={patientCase.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer"
                      onClick={() => router.push(`/dashboard/doctor/cases/${patientCase.id}`)}
                    >
                      {/* Case Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patientCase.status)}`}>
                            {getStatusIcon(patientCase.status)}
                            <span className="ml-1 capitalize">{patientCase.status}</span>
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(patientCase.urgency)}`}>
                            {patientCase.urgency.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Case Content */}
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {patientCase.injuryType}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                          Session ID: #{patientCase.id}
                        </p>
                        <p className="text-sm text-gray-600">
                          Created: {new Date(patientCase.submittedAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* AI Recommendation */}
                      {patientCase.recommendedExercise && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-900 mb-1">
                            Recommended Exercise
                          </h4>
                          <p className="text-sm text-blue-800">
                            {patientCase.recommendedExercise.name}
                          </p>
                          {patientCase.aiConfidence && (
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-blue-600">AI Confidence</span>
                              <span className="text-xs font-medium text-blue-700">
                                {Math.round(patientCase.aiConfidence * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Patient Notes */}
                      {patientCase.patientNotes && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Patient Notes</h4>
                          <p className="text-sm text-gray-700">{patientCase.patientNotes}</p>
                        </div>
                      )}

                      {/* Click indicator */}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Click to review session</span>
                        <ArrowLeft className="w-3 h-3 rotate-180" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
