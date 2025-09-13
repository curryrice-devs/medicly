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
  Loader2
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { doctorApi } from '@/services/api'
import { PatientProfile, PatientCase } from '@/types/medical.types'

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const patientId = params.id as string

  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [cases, setCases] = useState<PatientCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPatientData = async () => {
      if (!patientId || !user?.id) return

      setLoading(true)
      setError(null)

      try {
        const [patientData, casesData] = await Promise.all([
          doctorApi.getPatientProfile(patientId),
          doctorApi.getPatientCases(patientId)
        ])

        setPatient(patientData)
        setCases(casesData)

        // If no cases are found, redirect back to patients list
        if (casesData.length === 0) {
          router.push('/dashboard/doctor/patients')
          return
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patient data')
      } finally {
        setLoading(false)
      }
    }

    loadPatientData()
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading patient details...</p>
        </div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error loading patient</h1>
          <p className="text-red-600 mb-4">{error || 'Patient not found'}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
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
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Patient Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
              
              <div className="space-y-4">
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
                
                {patient.address && (
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 text-gray-400 mr-3 mt-0.5" />
                    <span className="text-sm text-gray-900">{patient.address}</span>
                  </div>
                )}
              </div>

              {/* Medical History */}
              {patient.medicalHistory && patient.medicalHistory.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Medical History</h3>
                  <div className="space-y-2">
                    {patient.medicalHistory.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <FileText className="w-3 h-3 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Medications */}
              {patient.currentMedications && patient.currentMedications.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Current Medications</h3>
                  <div className="space-y-2">
                    {patient.currentMedications.map((med, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                        <span className="text-sm text-gray-700">{med}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergies */}
              {patient.allergies && patient.allergies.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Allergies</h3>
                  <div className="space-y-2">
                    {patient.allergies.map((allergy, index) => (
                      <div key={index} className="flex items-center">
                        <AlertCircle className="w-3 h-3 text-red-400 mr-2" />
                        <span className="text-sm text-gray-700">{allergy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Patient Cases */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Patient Cases</h2>
                <p className="text-sm text-gray-600">{cases.length} total cases</p>
              </div>

              <div className="p-6">
                {cases.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No cases yet</h3>
                    <p className="text-gray-600">This patient doesn&apos;t have any cases assigned yet.</p>
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
                          <div className="flex items-center space-x-3">
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
                          <p className="text-sm text-gray-600 mb-2">
                            Case ID: #{patientCase.id}
                          </p>
                          <p className="text-sm text-gray-600">
                            Submitted: {new Date(patientCase.submittedAt).toLocaleDateString()}
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

                        {/* Click indicator */}
                        <div className="flex items-center text-xs text-gray-400">
                          <span>Click to view case details</span>
                          <ArrowLeft className="w-3 h-3 ml-1 rotate-180" />
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
    </div>
  )
}