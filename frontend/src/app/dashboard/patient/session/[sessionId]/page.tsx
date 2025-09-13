'use client'

import React, { useRef, useState } from 'react'
import { 
  Upload, 
  Video, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Play, 
  Activity, 
  RotateCcw,
  Calendar,
  TrendingUp,
  Clock,
  FileText,
  PlayCircle,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useParams } from 'next/navigation'

import { useAuth } from '@/contexts/auth-context'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSupabaseVideoUpload } from "@/hooks/useSupabaseVideoUpload"
import { formatBytes } from "@/lib/utils"
import Link from 'next/link'

interface SessionData {
  id: string
  title: string
  doctor: string
  progress: number
  nextSession: string
  status: 'active' | 'pending' | 'completed'
  sessionsCompleted: number
  totalSessions: number
  description: string
  doctorNotes: string
  nextSteps: string[]
  todaysExercises: {
    id: string
    name: string
    duration: string
    sets: string
    description: string
    videoUrl: string
    completed: boolean
    feedback?: string
  }[]
  reminders?: {
    id: string
    type: 'appointment' | 'exercise' | 'medication'
    title: string
    message: string
    priority: 'high' | 'medium' | 'low'
    date: string
  }[]
  history: {
    date: string
    activity: string
    notes?: string
  }[]
}

export default function PatientSessionDetailPage() {
  const params = useParams()
  const sessionId = params?.sessionId as string
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'todo' | 'completed' | 'feedback'>('todo')
  const [exerciseUploads, setExerciseUploads] = useState<Record<string, any>>({})
  const { isAuthenticated } = useAuth()

  // Mock session data with reminders/alerts
  const getSessionData = (id: string): SessionData => {
    const sessions: Record<string, SessionData> = {
      '1': {
        id: '1',
        title: 'Shoulder Rehabilitation',
        doctor: 'Dr. Sarah Chen',
        progress: 75,
        nextSession: 'Oct 15, 2:00 PM',
        status: 'active',
        sessionsCompleted: 9,
        totalSessions: 12,
        description: 'Comprehensive shoulder mobility and strength recovery program following rotator cuff injury.',
        doctorNotes: '',
        nextSteps: [
          'Continue daily shoulder pendulum exercises',
          'Gradually increase resistance band exercises',
          'Schedule final strength assessment for next month'
        ],
        todaysExercises: [
          {
            id: 'ex1',
            name: 'Shoulder Pendulum Swings',
            duration: '2 minutes',
            sets: '3 sets',
            description: 'Gentle circular motions to improve mobility',
            videoUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
            completed: false,
            feedback: 'Great improvement in range of motion! Try to keep your torso more stable during the swings.'
          },
          {
            id: 'ex2', 
            name: 'Wall Slides',
            duration: '10 reps',
            sets: '2 sets',
            description: 'Slide arms up and down against the wall',
            videoUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
            completed: true,
            feedback: 'Excellent form in your last video. You can increase to 12 reps next session.'
          },
          {
            id: 'ex3',
            name: 'Resistance Band External Rotation',
            duration: '15 reps',
            sets: '2 sets', 
            description: 'Light resistance external rotation',
            videoUrl: 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=400&h=300&fit=crop',
            completed: false,
            feedback: 'Focus on slow, controlled movements. Your shoulder strength is improving well.'
          },
          {
            id: 'ex4',
            name: 'Arm Circles',
            duration: '1 minute',
            sets: '2 sets',
            description: 'Small controlled circular movements',
            videoUrl: 'https://images.unsplash.com/photo-1506629905607-45ac4a6d2ad1?w=400&h=300&fit=crop',
            completed: true,
            feedback: ''
          },
          {
            id: 'ex5',
            name: 'Shoulder Shrugs',
            duration: '10 reps',
            sets: '3 sets',
            description: 'Gentle shoulder elevation exercise',
            videoUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
            completed: false,
            feedback: ''
          }
        ],
        reminders: [
          { 
            id: 'r1', 
            type: 'appointment', 
            title: 'Next Appointment', 
            message: 'Dr. Chen in 3 days',
            priority: 'high',
            date: 'Oct 15'
          },
          { 
            id: 'r2', 
            type: 'exercise', 
            title: 'Daily Exercises', 
            message: 'Complete shoulder routine',
            priority: 'medium',
            date: 'Today'
          },
          { 
            id: 'r3', 
            type: 'medication', 
            title: 'Pain Medication', 
            message: 'Take with food',
            priority: 'medium',
            date: 'Every 8hrs'
          }
        ],
        history: [
          { date: 'Oct 8', activity: 'Progress video uploaded', notes: 'Significant improvement in range of motion' },
          { date: 'Oct 1', activity: 'Weekly assessment completed', notes: 'Good progress, continue current exercises' },
          { date: 'Sep 24', activity: 'Initial evaluation', notes: 'Baseline measurements recorded' }
        ]
      }
    }
    return sessions[id] || sessions['1']
  }

  const session = getSessionData(sessionId)



  const completedExercises = session.todaysExercises.filter(ex => ex.completed).length
  const totalExercises = session.todaysExercises.length
  const todoExercises = session.todaysExercises.filter(ex => !ex.completed)
  const completedWithFeedback = session.todaysExercises.filter(ex => ex.completed && ex.feedback)
  const completedWithoutFeedback = session.todaysExercises.filter(ex => ex.completed && !ex.feedback)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc2626'
      case 'medium': return '#0d4a2b'
      case 'low': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getFilteredExercises = () => {
    switch (activeTab) {
      case 'todo': return todoExercises
      case 'completed': return completedWithoutFeedback
      case 'feedback': return completedWithFeedback
      default: return todoExercises
    }
  }



  return (
    <div style={{ 
      flex: 1,
      backgroundColor: 'hsl(var(--background))'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 12px' }}>
        
        {/* Header with Progress */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          padding: '16px 0',
          borderBottom: '1px solid hsl(var(--border))'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '1.75rem', 
              fontWeight: '600', 
              color: 'hsl(var(--foreground))',
              marginBottom: '4px',
              letterSpacing: '-0.01em'
            }}>
              Today's Session
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
              <span>{session.sessionsCompleted}/{session.totalSessions} sessions completed</span>
              <span>•</span>
              <span>Next: {session.nextSession}</span>
            </div>
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: 'hsl(var(--muted-foreground))',
            textAlign: 'right'
          }}>
            <div style={{ fontWeight: '600', color: 'hsl(var(--foreground))' }}>
              {completedExercises}/{totalExercises} exercises
            </div>
            <div>analyzed today</div>
          </div>
        </div>

        {/* Reminders & Alerts - Compact Horizontal */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            marginBottom: '12px' 
          }}>
            <Bell style={{ width: '16px', height: '16px', color: '#0d4a2b' }} />
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: 'hsl(var(--foreground))' 
            }}>
              Reminders & Alerts
            </h3>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '12px' 
          }}>
            {session.reminders?.map((reminder) => (
              <div key={reminder.id} style={{ 
                backgroundColor: 'hsl(var(--card))',
                borderRadius: '6px',
                padding: '12px',
                border: `1px solid ${getPriorityColor(reminder.priority)}20`,
                borderLeft: `3px solid ${getPriorityColor(reminder.priority)}`
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    {reminder.type === 'appointment' && <Calendar style={{ width: '14px', height: '14px', color: getPriorityColor(reminder.priority) }} />}
                    {reminder.type === 'exercise' && <Activity style={{ width: '14px', height: '14px', color: getPriorityColor(reminder.priority) }} />}
                    {reminder.type === 'medication' && <Clock style={{ width: '14px', height: '14px', color: getPriorityColor(reminder.priority) }} />}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: 'hsl(var(--foreground))',
                        marginBottom: '2px'
                      }}>
                        {reminder.title}
                      </h4>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'hsl(var(--muted-foreground))',
                        margin: 0
                      }}>
                        {reminder.message}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ 
                    padding: '2px 6px',
                    backgroundColor: `${getPriorityColor(reminder.priority)}15`,
                    borderRadius: '8px',
                    fontSize: '0.65rem',
                    color: getPriorityColor(reminder.priority),
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap'
                  }}>
                    {reminder.date}
                  </div>
                </div>
              </div>
            )) || []}
          </div>
        </section>

        {/* Your Exercises - Tab-Based */}
        <section>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '20px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity style={{ width: '20px', height: '20px', color: '#0d4a2b' }} />
              <h2 style={{ 
                fontSize: '1.75rem', 
                fontWeight: '600', 
                color: 'hsl(var(--foreground))',
                letterSpacing: '-0.01em'
              }}>
                Your Exercises
              </h2>
            </div>
          </div>

          {/* Tab Navigation - Simple Underline Style */}
          <div style={{ 
            display: 'flex', 
            gap: '32px',
            marginBottom: '24px',
            borderBottom: '1px solid hsl(var(--border))'
          }}>
            {[
              { key: 'todo', label: 'Todo', count: todoExercises.length },
              { key: 'completed', label: 'Completed', count: completedWithoutFeedback.length },
              { key: 'feedback', label: 'Feedback', count: completedWithFeedback.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '12px 0',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: activeTab === tab.key ? '#0d4a2b' : 'hsl(var(--muted-foreground))',
                  fontSize: '1rem',
                  fontWeight: activeTab === tab.key ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: activeTab === tab.key ? '2px solid #0d4a2b' : '2px solid transparent',
                  marginBottom: '-1px'
                }}
              >
                <span>{tab.label}</span>
                <span style={{ 
                  fontSize: '0.8rem',
                  color: activeTab === tab.key ? '#0d4a2b' : 'hsl(var(--muted-foreground))',
                  fontWeight: '600'
                }}>
                  ({tab.count})
                </span>
              </button>
            ))}
          </div>
          
          {/* Exercise Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '16px' 
          }}>
            {getFilteredExercises().map((exercise) => (
                <div key={exercise.id} style={{ 
                  backgroundColor: 'hsl(var(--card))',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: exercise.completed 
                    ? exercise.feedback 
                      ? '2px solid #0d4a2b' 
                      : '2px solid #6b7280'
                    : '1px solid hsl(var(--border))',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 12px rgba(13, 74, 43, 0.08)',
                  backdropFilter: 'blur(10px)'
                }}
                className="hover-lift"
                >
                  
                  {/* Exercise Preview Video */}
                  <Link href={`/dashboard/patient/session/${sessionId}/${exercise.name.toLowerCase().replace(/\s+/g, '_')}`}>
                    <div style={{ 
                      position: 'relative',
                      aspectRatio: '16/9',
                      backgroundColor: '#f3f4f6',
                      cursor: 'pointer',
                      borderRadius: '8px 8px 0 0',
                      overflow: 'hidden'
                    }}>
                      <img 
                        src={exercise.videoUrl}
                        alt={exercise.name}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          transition: 'transform 0.2s ease'
                        }}
                        className="hover:scale-105"
                      />
                      <div style={{ 
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      className="hover:scale-110"
                      >
                        <PlayCircle style={{ width: '24px', height: '24px', color: 'white' }} />
                      </div>
                      
                      {/* Click to analyze indicator */}
                      <div style={{ 
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        padding: '4px 8px',
                        backgroundColor: 'rgba(13, 74, 43, 0.9)',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        color: 'white',
                        fontWeight: '600'
                      }}>
                        Click to analyze
                      </div>
                      
                      {/* Status Indicators */}
                      <div style={{ 
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        display: 'flex',
                        gap: '4px'
                      }}>
                                              {exercise.completed && (
                        <div style={{ 
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: exercise.feedback ? '#0d4a2b' : '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CheckCircle2 style={{ width: '16px', height: '16px', color: 'white' }} />
                        </div>
                      )}
                      {exercise.feedback && (
                          <div style={{ 
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#0d4a2b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FileText style={{ width: '14px', height: '14px', color: 'white' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                  
                  {/* Exercise Info */}
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: '600', 
                      color: 'hsl(var(--foreground))',
                      marginBottom: '4px',
                      letterSpacing: '-0.01em'
                    }}>
                      {exercise.name}
                    </h3>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      marginBottom: '12px',
                      fontSize: '0.75rem',
                      color: 'hsl(var(--muted-foreground))'
                    }}>
                      <span>{exercise.duration}</span>
                      <span>•</span>
                      <span>{exercise.sets}</span>
                    </div>

                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: 'hsl(var(--muted-foreground))',
                      marginBottom: '12px',
                      lineHeight: '1.4'
                    }}>
                      {exercise.description}
                    </p>

                    {/* Doctor's Feedback */}
                    {exercise.feedback && (
                      <div style={{ 
                        backgroundColor: 'rgba(13, 74, 43, 0.05)',
                        border: '1px solid rgba(13, 74, 43, 0.2)',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '12px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          marginBottom: '6px'
                        }}>
                          <FileText style={{ width: '12px', height: '12px', color: '#0d4a2b' }} />
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            color: '#0d4a2b'
                          }}>
                            Feedback from {session.doctor.split(' ')[1]}
                          </span>
                        </div>
                        <p style={{ 
                          fontSize: '0.8rem', 
                          color: 'hsl(var(--foreground))',
                          lineHeight: '1.4',
                          margin: 0
                        }}>
                          {exercise.feedback}
                        </p>
                      </div>
                    )}

                    {/* Click to Analyze Call-to-Action */}
                    <div style={{ 
                      padding: '12px',
                      backgroundColor: 'rgba(13, 74, 43, 0.05)',
                      borderRadius: '6px',
                      border: '1px solid rgba(13, 74, 43, 0.1)',
                      textAlign: 'center'
                    }}>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: '#0d4a2b',
                        fontWeight: '600',
                        margin: 0
                      }}>
                        Click the video above for detailed AI analysis
                      </p>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </section>
      </div>
    </div>
  )
} 