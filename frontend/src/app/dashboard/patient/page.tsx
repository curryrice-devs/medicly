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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'rejective' | 'completed'>('all')

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
    await createSession(sessionData.treatment_id, sessionData)
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
    rejective: sessions.filter(s => s.status === 'rejective').length,
    completed: sessions.filter(s => s.status === 'completed').length
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
    <div style={{ 
      flex: 1,
      backgroundColor: 'hsl(var(--background))'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 12px' }}>
        
        {/* Welcome Header */}


        {/* Active Sessions */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              color: 'hsl(var(--foreground))',
              margin: 0
            }}>
              Exercise Sessions
            </h2>
            <Button size="sm" variant="outline" style={{ gap: '6px' }} onClick={() => setIsModalOpen(true)}>
              <Plus style={{ width: '14px', height: '14px' }} />
              New Session
            </Button>
          </div>

          {/* Status Filter */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}>
            {[
              { key: 'all', label: 'All Sessions', count: sessionStats.all },
              { key: 'pending', label: 'Pending', count: sessionStats.pending },
              { key: 'active', label: 'Active', count: sessionStats.active },
              { key: 'rejective', label: 'Rejective', count: sessionStats.rejective },
              { key: 'completed', label: 'Completed', count: sessionStats.completed }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: statusFilter === filter.key ? '#0d4a2b' : 'hsl(var(--background))',
                  color: statusFilter === filter.key ? 'white' : 'hsl(var(--foreground))',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span style={{
                    backgroundColor: statusFilter === filter.key ? 'rgba(255,255,255,0.2)' : 'hsl(var(--accent))',
                    color: statusFilter === filter.key ? 'white' : 'hsl(var(--muted-foreground))',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '0.65rem',
                    fontWeight: '600'
                  }}>
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '16px' 
          }}>
            {filteredSessions.length === 0 ? (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '40px 20px',
                backgroundColor: 'hsl(var(--accent))',
                borderRadius: '8px'
              }}>
                <Activity style={{ 
                  width: '48px', 
                  height: '48px', 
                  color: 'hsl(var(--muted-foreground))',
                  margin: '0 auto 16px'
                }} />
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'hsl(var(--foreground))',
                  marginBottom: '8px'
                }}>
                  {statusFilter === 'all' 
                    ? 'No Sessions Yet' 
                    : `No ${statusFilter.replace('_', ' ')} Sessions`
                  }
                </h4>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'hsl(var(--muted-foreground))',
                  marginBottom: '20px'
                }}>
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
                  <div style={{ 
                    backgroundColor: 'hsl(var(--card))',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: '1px solid hsl(var(--border))',
                  }}
                  className="hover:scale-[1.01] hover:shadow-md group"
                  >
                    {/* Header with Title and Doctor */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'space-between',
                      marginBottom: '16px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: 'bold', 
                          color: 'hsl(var(--foreground))',
                          marginBottom: '4px',
                          lineHeight: '1.3'
                        }}>
                          {session.treatment?.name || 'Exercise Session'}
                        </h4>
                        <p style={{ 
                          fontSize: '0.875rem', 
                          color: 'hsl(var(--muted-foreground))',
                          marginBottom: '0'
                        }}>
                          {session.doctor_id ? `Doctor assigned` : 'Self-guided'}
                        </p>
                      </div>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '6px', 
                        backgroundColor: 'rgba(13, 74, 43, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginLeft: '12px'
                      }}>
                        <Activity style={{ width: '16px', height: '16px', color: '#0d4a2b' }} />
                      </div>
                    </div>

                    {/* Progress and Next Checkup - Inline Layout */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '16px',
                      marginBottom: '16px'
                    }}>
                      {/* Progress Section */}
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          marginBottom: '6px' 
                        }}>
                          <Activity style={{ width: '14px', height: '14px', color: '#0d4a2b' }} />
                          <span style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: 'hsl(var(--foreground))' 
                          }}>
                            Exercise Details
                          </span>
                        </div>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          color: 'hsl(var(--muted-foreground))',
                          lineHeight: '1.4'
                        }}>
                          <div>{session.exercise_sets || 3} sets × {session.exercise_reps || 10} reps</div>
                          <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                            {session.exercise_frequency_daily || 1}x daily
                          </div>
                        </div>
                      </div>

                      {/* Due Date Section */}
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          marginBottom: '6px' 
                        }}>
                          <Calendar style={{ width: '14px', height: '14px', color: '#0d4a2b' }} />
                          <span style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: 'hsl(var(--foreground))' 
                          }}>
                            Due Date
                          </span>
                        </div>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          color: 'hsl(var(--muted-foreground))',
                          lineHeight: '1.4'
                        }}>
                          <div>{session.due_date ? new Date(session.due_date).toLocaleDateString() : 'Not set'}</div>
                          <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                            Status: {session.status}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* View Session Button */}
                    <Button size="sm" style={{ 
                      width: '100%', 
                      gap: '6px', 
                      height: '36px', 
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      <Video style={{ width: '14px', height: '14px' }} />
                      View Session Details
                    </Button>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        

        {/* Create New Session Section */}
        {!treatmentsLoading && treatments.length > 0 && sessions.length === 0 && (
          <div style={{ 
            backgroundColor: 'hsl(var(--card))',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '24px',
            textAlign: 'center'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 'bold', 
              color: 'hsl(var(--foreground))',
              marginBottom: '12px'
            }}>
              Start Your First Exercise Session
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: 'hsl(var(--muted-foreground))',
              marginBottom: '20px'
            }}>
              Create a personalized exercise session to begin your recovery journey
            </p>
            
            <Button
              onClick={() => setIsModalOpen(true)}
              style={{ 
                backgroundColor: '#0d4a2b',
                gap: '8px'
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Create Your First Session
            </Button>
          </div>
        )}

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