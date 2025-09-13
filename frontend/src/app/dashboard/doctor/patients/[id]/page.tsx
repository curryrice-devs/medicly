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
import { PatientProfile, TherapySession } from '@/types/medical.types'

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const patientId = params.id as string

  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [sessionNotes, setSessionNotes] = useState('')
  const [sessionStatus, setSessionStatus] = useState<'pending' | 'reviewed' | 'approved' | 'completed'>('reviewed')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    const loadPatientData = async () => {
      if (!patientId || !user?.id) return

      setLoading(true)
      setError(null)

      try {
        const [patientData, sessionsData] = await Promise.all([
          doctorApi.getPatientProfile(patientId),
          doctorApi.getPatientSessions(patientId, user.id)
        ])

        setPatient(patientData)
        setSessions(sessionsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patient data')
      } finally {
        setLoading(false)
      }
    }

    loadPatientData()
  }, [patientId, user?.id])

  const handleEditSession = (session: TherapySession) => {
    setEditingSession(session.id)
    setSessionNotes(session.doctorNotes || '')
    setSessionStatus(session.status)
  }

  const handleSaveNotes = async (sessionId: string) => {
    if (!user?.id) return

    setSavingNotes(true)
    try {
      await doctorApi.updateSessionDoctorNotes(sessionId, sessionNotes, sessionStatus)
      
      // Update local state
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, doctorNotes: sessionNotes, status: sessionStatus }
          : session
      ))
      
      setEditingSession(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  const cancelEdit = () => {
    setEditingSession(null)
    setSessionNotes('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'reviewed': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'reviewed': return <Activity className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
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

          {/* Therapy Sessions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Therapy Sessions</h2>
                <p className="text-sm text-gray-600">{sessions.length} total sessions</p>
              </div>
              
              <div className="p-6">
                {sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                    <p className="text-gray-600">This patient hasn't completed any therapy sessions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sessions.map((session) => (
                      <div key={session.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                Session {new Date(session.sessionDate).toLocaleDateString()}
                              </h3>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                {getStatusIcon(session.status)}
                                <span className="ml-1 capitalize">{session.status}</span>
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(session.urgency)}`}>
                                {session.urgency.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {session.injuryType && `Injury: ${session.injuryType} • `}
                              Session type: {session.sessionType}
                            </p>
                          </div>
                          
                          {editingSession !== session.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSession(session)}
                            >
                              <Edit3 className="w-3 h-3 mr-1" />
                              Edit Notes
                            </Button>
                          )}
                        </div>

                        {/* AI Analysis */}
                        {session.aiAnalysis && (
                          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">AI Analysis</h4>
                            <p className="text-sm text-blue-800">{session.aiAnalysis}</p>
                          </div>
                        )}

                        {/* Doctor Notes */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Doctor Notes</h4>
                          
                          {editingSession === session.id ? (
                            <div className="space-y-4">
                              <textarea
                                value={sessionNotes}
                                onChange={(e) => setSessionNotes(e.target.value)}
                                placeholder="Add your notes about this session..."
                                className="w-full min-h-24 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                rows={4}
                              />
                              
                              <div className="flex items-center space-x-3">
                                <Select value={sessionStatus} onValueChange={(value: any) => setSessionStatus(value)}>
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="reviewed">Reviewed</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveNotes(session.id)}
                                  disabled={savingNotes}
                                >
                                  {savingNotes ? (
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  ) : (
                                    <Save className="w-3 h-3 mr-1" />
                                  )}
                                  Save
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEdit}
                                  disabled={savingNotes}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              {session.doctorNotes ? (
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {session.doctorNotes}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-500 italic">No notes added yet</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Created: {new Date(session.createdAt).toLocaleString()}</span>
                          {session.updatedAt !== session.createdAt && (
                            <span>Updated: {new Date(session.updatedAt).toLocaleString()}</span>
                          )}
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