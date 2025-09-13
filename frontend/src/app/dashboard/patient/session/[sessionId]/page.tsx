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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header with Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Today's Session
              </h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <span>{session.sessionsCompleted}/{session.totalSessions} sessions completed</span>
                <span>•</span>
                <span>Next: {session.nextSession}</span>
              </div>
            </div>
            <div className="text-right text-gray-600">
              <div className="font-semibold text-gray-900">
                {completedExercises}/{totalExercises} exercises
              </div>
              <div>analyzed today</div>
            </div>
          </div>
        </div>

        {/* Reminders & Alerts - Compact Horizontal */}
        <section className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Reminders & Alerts
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {session.reminders?.map((reminder) => (
              <div key={reminder.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow" style={{ 
                borderLeft: `3px solid ${getPriorityColor(reminder.priority)}`
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {reminder.type === 'appointment' && <Calendar className="w-4 h-4" style={{ color: getPriorityColor(reminder.priority) }} />}
                    {reminder.type === 'exercise' && <Activity className="w-4 h-4" style={{ color: getPriorityColor(reminder.priority) }} />}
                    {reminder.type === 'medication' && <Clock className="w-4 h-4" style={{ color: getPriorityColor(reminder.priority) }} />}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {reminder.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {reminder.message}
                      </p>
                    </div>
                  </div>
                  
                  <div className="px-2 py-1 rounded-full text-xs font-medium uppercase whitespace-nowrap" style={{ 
                    backgroundColor: `${getPriorityColor(reminder.priority)}15`,
                    color: getPriorityColor(reminder.priority)
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Your Exercises
                </h2>
              </div>
            </div>
          </div>

          {/* Tab Navigation - Simple Underline Style */}
          <div className="flex space-x-8 mb-6 border-b border-gray-200">
            {[
              { key: 'todo', label: 'Todo', count: todoExercises.length },
              { key: 'completed', label: 'Completed', count: completedWithoutFeedback.length },
              { key: 'feedback', label: 'Feedback', count: completedWithFeedback.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
                  activeTab === tab.key 
                    ? 'text-green-600 border-green-600 font-semibold' 
                    : 'text-gray-500 border-transparent font-medium'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-sm font-semibold ${
                  activeTab === tab.key ? 'text-green-600' : 'text-gray-500'
                }`}>
                  ({tab.count})
                </span>
              </button>
            ))}
          </div>
          
          {/* Exercise Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredExercises().map((exercise) => (
                <div key={exercise.id} className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                  exercise.completed 
                    ? exercise.feedback 
                      ? 'border-2 border-green-600' 
                      : 'border-2 border-gray-400'
                    : 'border border-gray-200'
                }`}>
                  
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
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {exercise.name}
                    </h3>
                    
                    <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
                      <span>{exercise.duration}</span>
                      <span>•</span>
                      <span>{exercise.sets}</span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {exercise.description}
                    </p>

                    {/* Doctor's Feedback */}
                    {exercise.feedback && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-800">
                            Feedback from {session.doctor.split(' ')[1]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {exercise.feedback}
                        </p>
                      </div>
                    )}

                    {/* Click to Analyze Call-to-Action */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <p className="text-sm font-semibold text-green-800">
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