'use client'

import React, { useState } from 'react'
import { 
  Calendar, 
  Activity, 
  Video,
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

import { useAuth } from '@/contexts/auth-context'
import { Button } from "@/components/ui/button"
import { usePatientSessions } from '@/hooks/usePatientSessions'
import { useTreatments } from '@/hooks/useTreatments'
import { CreateSessionModal } from '@/components/CreateSessionModal'
import { SessionStatus } from '@/types/medical.types'

interface ActiveSession {
  id: string
  title: string
  doctor: string
  nextSession: string
  sessionsCompleted: number
  totalSessions: number
}

interface UpcomingTask {
  id: string
  title: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  session?: string
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const { sessions, loading: sessionsLoading, error: sessionsError, createSession } = usePatientSessions()
  const { treatments, loading: treatmentsLoading, error: treatmentsError } = useTreatments()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | SessionStatus>('all')

  // Debug logging
  React.useEffect(() => {
    console.log('🏥 Patient Dashboard State:', {
      user: user?.email,
      userId: user?.id,
      sessionsLoading,
      sessionsError,
      sessionsCount: sessions?.length,
      treatmentsLoading,
      treatmentsError,
      treatmentsCount: treatments?.length
    });
  }, [user, sessionsLoading, sessionsError, sessions, treatmentsLoading, treatmentsError, treatments]);

  // If user is not loaded yet, show loading
  if (!user) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'hsl(var(--background))',
        minHeight: '100vh',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" style={{ width: '48px', height: '48px', marginBottom: '16px' }} />
          <p>Loading user information...</p>
        </div>
      </div>
    )
  }

  const handleCreateSession = async (sessionData: any) => {
    const result = await createSession(sessionData.treatment_id, sessionData)
    return result
  }

  // Filter sessions by status
  const filteredSessions = sessions.filter(session => {
    if (statusFilter === 'all') return true
    return session.status === statusFilter
  })

  // Group sessions by status for stats
  const sessionStats = {
    all: sessions.length,
    pending: sessions.filter(s => s.status === 'pending').length,
    active: sessions.filter(s => s.status === 'active').length,
    rejected: sessions.filter(s => s.status === 'rejected').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    feedback: sessions.filter(s => s.status === 'feedback').length
  }

  // Remove old hardcoded upcoming tasks
  const upcomingTasks: any[] = []

  if (sessionsLoading || treatmentsLoading) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'hsl(var(--background))',
        minHeight: '100vh',
        width: '100%'
      }}>
      </div>
    )
  }

  if (sessionsError || treatmentsError) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'hsl(var(--background))',
        minHeight: '100vh',
        width: '100%',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '20px' }}>
          <AlertCircle style={{ width: '48px', height: '48px', color: 'red', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '12px' }}>
            Database Setup Required
          </h3>
          {sessionsError && (
            <p style={{ marginBottom: '8px', color: 'red' }}>Sessions: {sessionsError}</p>
          )}
          {treatmentsError && (
            <p style={{ marginBottom: '16px', color: 'red' }}>Treatments: {treatmentsError}</p>
          )}
          <div style={{ 
            backgroundColor: 'hsl(var(--accent))', 
            padding: '16px', 
            borderRadius: '8px', 
            textAlign: 'left',
            fontSize: '0.875rem'
          }}>
            <p style={{ fontWeight: '600', marginBottom: '8px' }}>To fix this:</p>
            <ol style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>Go to your Supabase dashboard</li>
              <li>Open the SQL Editor</li>
              <li>Copy and run the contents of <code>frontend/setup_tables.sql</code></li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-600">
            Here's your exercise sessions and recovery progress
          </p>
        </div>

        {/* Active Sessions */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Exercise Sessions
                </h2>
              </div>
            </div>
            <Button size="sm" variant="outline" className="flex items-center space-x-2" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" />
              <span>New Session</span>
            </Button>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { key: 'all', label: 'All Sessions', count: sessionStats.all },
              { key: 'pending', label: 'Pending', count: sessionStats.pending },
              { key: 'active', label: 'Active', count: sessionStats.active },
              { key: 'rejected', label: 'Rejected', count: sessionStats.rejected },
              { key: 'completed', label: 'Completed', count: sessionStats.completed },
              { key: 'feedback', label: 'Feedback', count: sessionStats.feedback }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center space-x-2 ${
                  statusFilter === filter.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                }`}
              >
                <span>{filter.label}</span>
                {filter.count > 0 && (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    statusFilter === filter.key
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {statusFilter === 'all' 
                    ? 'No Sessions Yet' 
                    : `No ${statusFilter.replace('_', ' ')} Sessions`
                  }
                </h4>
                <p className="text-sm text-gray-600 mb-6">
                  {statusFilter === 'all' 
                    ? 'Start a new exercise session below to begin your recovery journey'
                    : `No sessions with ${statusFilter.replace('_', ' ')} status found. Try a different filter or create a new session.`
                  }
                </p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <Link 
                  key={session.id} 
                  href={`/dashboard/patient/session/${session.id}/${session.treatment?.name?.toLowerCase().replace(/\s+/g, '_') || 'exercise'}`}
                >
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                    {/* Header with Title and Doctor */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          {session.treatment?.name || 'Exercise Session'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {session.doctor_id ? `Doctor assigned` : 'Self-guided'}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                        <Activity className="w-4 h-4 text-foreground" />
                      </div>
                    </div>

                    {/* Progress and Next Checkup - Inline Layout */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Progress Section */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Activity className="w-4 h-4 text-foreground" />
                          <span className="text-sm font-medium text-gray-900">
                            Exercise Details
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          <div>{session.exercise_sets || 3} sets × {session.exercise_reps || 10} reps</div>
                          <div className="text-xs mt-1">
                            {session.exercise_frequency_daily || 1}x daily
                          </div>
                        </div>
                      </div>

                      {/* Due Date Section */}
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="w-4 h-4 text-foreground" />
                          <span className="text-sm font-medium text-gray-900">
                            Due Date
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          <div>{session.due_date ? new Date(session.due_date).toLocaleDateString() : 'Not set'}</div>
                          <div className="text-xs mt-1">
                            Status: {session.status}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* View Session Button */}
                    <Button size="sm" className="w-full h-9 text-sm font-medium flex items-center justify-center space-x-2">
                      <Video className="w-4 h-4" />
                      <span>View Session Details</span>
                    </Button>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        
        {/* Create Session Modal */}
        <CreateSessionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreateSession={handleCreateSession}
          userId={user.id}
        />
      </div>
    </div>
  )
} 