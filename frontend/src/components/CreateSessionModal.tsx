'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Activity } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'

interface Treatment {
  id: number;
  name: string;
  description?: string;
  video_link?: string;
}

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSession: (sessionData: SessionFormData) => Promise<{ id: number; exercise?: { name: string }; treatment?: { name: string } }>;
  userId: string;
}

interface SessionFormData {
  patient_id: string;
  doctor_id?: string;
  treatment_id: string; // This will be the evaluation_metrics.id (text field)
  status: 'pending' | 'in_progress' | 'completed' | 'reviewed';
  description?: string;
}

export function CreateSessionModal({ isOpen, onClose, onCreateSession, userId }: CreateSessionModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
  const [aiReasoning, setAiReasoning] = useState<string>('')
  const [description, setDescription] = useState('')

  const [formData, setFormData] = useState<SessionFormData>({
    patient_id: userId,
    treatment_id: '',
    status: 'pending' // Always pending until video uploaded
  })

  // Function to analyze description and select exercise
  const analyzeAndSelectExercise = async () => {
    if (!description.trim()) {
      alert('Please describe your problem first')
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/ai/select-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim() })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze description')
      }

      const result = await response.json()
      console.log('🤖 AI exercise selection result:', result)

      if (result.success && result.exercise) {
        setSelectedTreatment(result.exercise)
        setAiReasoning(result.reasoning)
        setFormData(prev => ({
          ...prev,
          treatment_id: result.exercise.id,
          description: description.trim()
        }))
      } else {
        throw new Error(result.error || 'Failed to select exercise')
      }
    } catch (error) {
      console.error('❌ AI analysis failed:', error)
      alert('Failed to analyze your description. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDescription('')
      setSelectedTreatment(null)
      setAiReasoning('')
      setFormData({
        patient_id: userId,
        treatment_id: '',
        status: 'pending'
      })
    }
  }, [isOpen, userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTreatment) {
      alert('Please analyze your description first to select an exercise')
      return
    }

    try {
      setIsSubmitting(true)
      const createdSession = await onCreateSession(formData)

      // Reset form and close modal
      setDescription('')
      setSelectedTreatment(null)
      setAiReasoning('')
      setFormData({
        patient_id: userId,
        treatment_id: '',
        status: 'pending'
      })
      onClose()

      // Redirect to the session page with the exercise name
      const exerciseName = (createdSession.exercise?.name || createdSession.treatment?.name || 'exercise').toLowerCase().replace(/\s+/g, '_')
      router.push(`/dashboard/patient/session/${createdSession.id}/${exerciseName}`)
    } catch (error) {
      console.error('Failed to create session:', error)
      alert('Failed to create session. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'hsl(var(--background))',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '900px', // Increased from 600px (1.5x)
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '36px', // Increased from 24px (1.5x)
          borderBottom: '1px solid hsl(var(--border))'
        }}>
          <div>
            <h2 style={{
              fontSize: '2.25rem', // Increased from 1.5rem (1.5x)
              fontWeight: 'bold',
              color: 'hsl(var(--foreground))',
              margin: '0 0 6px 0' // Increased from 4px
            }}>
              Describe Your Problem
            </h2>
            <p style={{
              fontSize: '1.3125rem', // Increased from 0.875rem (1.5x)
              color: 'hsl(var(--muted-foreground))',
              margin: '0'
            }}>
              Our AI will recommend the best exercise for you
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '12px', // Increased from 8px (1.5x)
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: 'hsl(var(--muted-foreground))'
            }}
          >
            <X style={{ width: '30px', height: '30px' }} /> {/* Increased from 20px (1.5x) */}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '36px' }}> {/* Increased from 24px (1.5x) */}
          {/* Problem Description */}
          <div style={{ marginBottom: '36px' }}> {/* Increased from 24px (1.5x) */}
            <label style={{
              display: 'block',
              fontSize: '1.3125rem', // Increased from 0.875rem (1.5x)
              fontWeight: '600',
              color: 'hsl(var(--foreground))',
              marginBottom: '12px' // Increased from 8px (1.5x)
            }}>
              <Activity style={{ width: '24px', height: '24px', display: 'inline', marginRight: '9px' }} /> {/* Increased from 16px and 6px (1.5x) */}
              Describe your problem or pain *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: I have pain in my right shoulder when lifting my arm above my head, or my lower back feels stiff in the mornings..."
              rows={6} // Increased from 4 (1.5x)
              style={{
                width: '100%',
                padding: '18px', // Increased from 12px (1.5x)
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px', // Increased from 8px (1.5x)
                backgroundColor: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                fontSize: '1.3125rem', // Increased from 0.875rem (1.5x)
                resize: 'vertical',
                minHeight: '150px' // Increased from 100px (1.5x)
              }}
              disabled={isAnalyzing || isSubmitting}
            />
            <div style={{
              marginTop: '12px', // Increased from 8px (1.5x)
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                fontSize: '1.125rem', // Increased from 0.75rem (1.5x)
                color: 'hsl(var(--muted-foreground))'
              }}>
                Be specific about location, type of pain, and when it occurs
              </div>
              <Button
                type="button"
                onClick={analyzeAndSelectExercise}
                disabled={!description.trim() || isAnalyzing || isSubmitting}
                style={{
                  backgroundColor: isAnalyzing ? 'hsl(var(--secondary))' : 'hsl(var(--primary))',
                  color: isAnalyzing ? 'hsl(var(--secondary-foreground))' : 'hsl(var(--primary-foreground))',
                  padding: '12px 24px', // Increased from 8px 16px (1.5x)
                  fontSize: '1.3125rem' // Increased from 0.875rem (1.5x)
                }}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze & Select Exercise'}
              </Button>
            </div>
          </div>

          {/* AI Selected Exercise Summary */}
          {selectedTreatment && (
            <div style={{
              padding: '24px', // Increased from 16px (1.5x)
              backgroundColor: 'hsl(var(--accent))',
              borderRadius: '12px', // Increased from 8px (1.5x)
              marginBottom: '36px', // Increased from 24px (1.5x)
              border: '1px solid hsl(var(--border))'
            }}>
              <div style={{
                fontSize: '1.125rem', // Increased from 0.75rem (1.5x)
                fontWeight: '600',
                color: 'hsl(var(--primary))',
                marginBottom: '12px', // Increased from 8px (1.5x)
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                📋 Evaluation Exercise
              </div>
              <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '1.5rem' }}> {/* Increased from 8px and 1rem (1.5x) */}
                {selectedTreatment.name}
              </div>
              {selectedTreatment.description && (
                <div style={{
                  fontSize: '1.3125rem', // Increased from 0.875rem (1.5x)
                  color: 'hsl(var(--muted-foreground))',
                  marginBottom: '12px' // Increased from 8px (1.5x)
                }}>
                  {selectedTreatment.description}
                </div>
              )}
              {aiReasoning && (
                <div style={{
                  fontSize: '1.3125rem', // Increased from 0.875rem (1.5x)
                  color: 'hsl(var(--foreground))',
                  paddingTop: '12px', // Increased from 8px (1.5x)
                  borderTop: '1px solid hsl(var(--border))'
                }}>
                  <strong>Why this exercise:</strong> {aiReasoning}
                </div>
              )}
            </div>
          )}


          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '18px', // Increased from 12px (1.5x)
            justifyContent: 'flex-end',
            paddingTop: '24px', // Increased from 16px (1.5x)
            borderTop: '1px solid hsl(var(--border))'
          }}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                fontSize: '1.3125rem', // Increased font size (1.5x from 0.875rem)
                padding: '12px 24px' // Increased padding (1.5x)
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedTreatment || isSubmitting || isAnalyzing}
              style={{
                backgroundColor: (!selectedTreatment || isSubmitting || isAnalyzing) ? 'hsl(var(--secondary))' : 'hsl(var(--primary))',
                color: (!selectedTreatment || isSubmitting || isAnalyzing) ? 'hsl(var(--secondary-foreground))' : 'hsl(var(--primary-foreground))',
                gap: '12px', // Increased from 8px (1.5x)
                fontSize: '1.3125rem', // Increased font size (1.5x from 0.875rem)
                padding: '12px 24px' // Increased padding (1.5x)
              }}
            >
              {isSubmitting ? (
                'Creating Session...'
              ) : !selectedTreatment ? (
                'Analyze Description First'
              ) : (
                <>
                  <Plus style={{ width: '24px', height: '24px' }} /> {/* Increased from 16px (1.5x) */}
                  Start Exercise Session
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 