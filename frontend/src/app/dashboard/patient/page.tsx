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
  const [creatingSession, setCreatingSession] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<number | null>(null)

  // Debug logging
  React.useEffect(() => {
    console.log('🏥 Patient Dashboard State:', {
      user: user?.email,
      sessionsLoading,
      sessionsError,
      sessionsCount: sessions?.length,
      treatmentsLoading,
      treatmentsError,
      treatmentsCount: treatments?.length
    });
  }, [user, sessionsLoading, sessionsError, sessions, treatmentsLoading, treatmentsError, treatments]);

  const handleCreateSession = async () => {
    if (!selectedTreatment) return
    
    try {
      setCreatingSession(true)
      await createSession(selectedTreatment, {
        status: 'pending',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week from now
      })
      setSelectedTreatment(null)
    } catch (error) {
      console.error('Failed to create session:', error)
    } finally {
      setCreatingSession(false)
    }
  }

  // Group sessions by status
  const activeSessions = sessions.filter(s => s.status === 'in_progress' || s.status === 'pending')
  const completedSessions = sessions.filter(s => s.status === 'completed' || s.status === 'reviewed')

  // Remove old hardcoded upcoming tasks
  const upcomingTasks: any[] = []

  if (sessionsLoading || treatmentsLoading) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'hsl(var(--background))'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" style={{ width: '48px', height: '48px', marginBottom: '16px' }} />
          <p>Loading your sessions...</p>
          <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginTop: '8px' }}>
            This may take up to 10 seconds
          </p>
        </div>
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
        backgroundColor: 'hsl(var(--background))'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity style={{ width: '20px', height: '20px', color: '#0d4a2b' }} />
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                color: 'hsl(var(--foreground))' 
              }}>
                Active Sessions
              </h2>
            </div>
            <Button size="sm" variant="outline" style={{ gap: '6px' }}>
              <Plus style={{ width: '14px', height: '14px' }} />
              New Session
            </Button>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '16px' 
          }}>
            {activeSessions.length === 0 ? (
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
                  No Active Sessions
                </h4>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'hsl(var(--muted-foreground))',
                  marginBottom: '20px'
                }}>
                  Start a new exercise session below to begin your recovery journey
                </p>
              </div>
            ) : (
              activeSessions.map((session) => (
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

        {/* Upcoming Tasks */}
        <section>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar style={{ width: '20px', height: '20px', color: '#0d4a2b' }} />
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                color: 'hsl(var(--foreground))' 
              }}>
                Upcoming Tasks
              </h2>
            </div>
            <Button size="sm" variant="outline" style={{ gap: '6px' }}>
              <Plus style={{ width: '14px', height: '14px' }} />
              Add Task
            </Button>
          </div>

          <div style={{ 
            backgroundColor: 'hsl(var(--card))',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.1)',
            border: '1px solid hsl(var(--border))'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingTasks.map((task) => (
                <div key={task.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '12px', 
                  borderRadius: '6px',
                  backgroundColor: 'hsl(var(--accent) / 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid hsl(var(--border))'
                }}
                className="hover:bg-accent/60 hover:shadow-sm group"
                >
                  <div style={{ flexShrink: 0 }}>
                    <Calendar style={{ width: '16px', height: '16px', color: '#0d4a2b' }} />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'hsl(var(--foreground))', marginBottom: '4px' }}>
                      {task.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                        Due: {task.dueDate}
                      </p>
                      {task.session && (
                        <>
                          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>•</span>
                          <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                            {task.session}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Create New Session Section */}
        {!treatmentsLoading && treatments.length > 0 && (
          <div style={{ 
            backgroundColor: 'hsl(var(--card))',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '24px'
          }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 'bold', 
              color: 'hsl(var(--foreground))',
              marginBottom: '16px'
            }}>
              Start New Exercise Session
            </h3>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  color: 'hsl(var(--muted-foreground))',
                  marginBottom: '6px'
                }}>
                  Select Exercise
                </label>
                <select
                  value={selectedTreatment || ''}
                  onChange={(e) => setSelectedTreatment(Number(e.target.value) || null)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Choose an exercise...</option>
                  {treatments.map(treatment => (
                    <option key={treatment.id} value={treatment.id}>
                      {treatment.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <Button
                onClick={handleCreateSession}
                disabled={!selectedTreatment || creatingSession}
                style={{ 
                  backgroundColor: '#0d4a2b',
                  gap: '8px'
                }}
              >
                {creatingSession ? (
                  <>
                    <Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus style={{ width: '16px', height: '16px' }} />
                    Create Session
                  </>
                )}
              </Button>
            </div>
            
            {selectedTreatment && treatments.find(t => t.id === selectedTreatment)?.description && (
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'hsl(var(--muted-foreground))',
                marginTop: '12px',
                padding: '12px',
                backgroundColor: 'hsl(var(--accent))',
                borderRadius: '6px'
              }}>
                {treatments.find(t => t.id === selectedTreatment)?.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 