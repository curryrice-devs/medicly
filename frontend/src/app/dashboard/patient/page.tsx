'use client'

import React from 'react'
import { 
  Calendar, 
  Activity, 
  Video,
  Plus
} from 'lucide-react'
import Link from 'next/link'

import { useAuth } from '@/contexts/auth-context'
import { Button } from "@/components/ui/button"

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

  const activeSessions: ActiveSession[] = [
    {
      id: '1',
      title: 'Shoulder Rehabilitation',
      doctor: 'Dr. Sarah Chen',
      nextSession: 'Oct 15, 2:00 PM',
      sessionsCompleted: 9,
      totalSessions: 12
    },
    {
      id: '2',
      title: 'Lower Back Therapy',
      doctor: 'Dr. Michael Torres',
      nextSession: 'Oct 18, 10:30 AM',
      sessionsCompleted: 5,
      totalSessions: 11
    },
    {
      id: '3',
      title: 'Knee Recovery Program',
      doctor: 'Dr. Emily Rodriguez',
      nextSession: 'Oct 22, 3:15 PM',
      sessionsCompleted: 8,
      totalSessions: 9
    }
  ]

  const upcomingTasks: UpcomingTask[] = [
    {
      id: '1',
      title: 'Upload shoulder movement video',
      dueDate: 'Today',
      priority: 'high',
      session: 'Shoulder Rehabilitation'
    },
    {
      id: '2',
      title: 'Complete pain assessment form',
      dueDate: 'Tomorrow',
      priority: 'medium',
      session: 'Lower Back Therapy'
    },
    {
      id: '3',
      title: 'Schedule final evaluation',
      dueDate: 'This week',
      priority: 'medium',
      session: 'Knee Recovery Program'
    },
    {
      id: '4',
      title: 'Review exercise instructions',
      dueDate: 'Oct 18',
      priority: 'low'
    }
  ]

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
            {activeSessions.map((session) => (
              <Link key={session.id} href={`/dashboard/patient/session/${session.id}`}>
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
                        {session.title}
                      </h4>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: 'hsl(var(--muted-foreground))',
                        marginBottom: '0'
                      }}>
                        with {session.doctor}
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
                          Progress
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: 'hsl(var(--muted-foreground))',
                        lineHeight: '1.4'
                      }}>
                        <div>{session.sessionsCompleted}/{session.totalSessions} sessions</div>
                        <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                          {session.totalSessions - session.sessionsCompleted} remaining
                        </div>
                      </div>
                    </div>

                    {/* Next Checkup Section */}
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
                          Next Checkup
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: 'hsl(var(--muted-foreground))',
                        lineHeight: '1.4'
                      }}>
                        <div>{session.nextSession.split(',')[0]}</div>
                        <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                          {session.nextSession.split(',')[1]?.trim()}
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
            ))}
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
      </div>
    </div>
  )
} 