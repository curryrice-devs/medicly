'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Activity } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useTreatments } from '@/hooks/useTreatments'
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
  onCreateSession: (sessionData: SessionFormData) => Promise<{ id: number; treatment: { name: string } }>;
  userId: string;
}

interface SessionFormData {
  patient_id: string;
  doctor_id?: string;
  treatment_id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'reviewed';
}

export function CreateSessionModal({ isOpen, onClose, onCreateSession, userId }: CreateSessionModalProps) {
  const router = useRouter()
  const { treatments, loading: treatmentsLoading, error: treatmentsError } = useTreatments()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
  
  const [formData, setFormData] = useState<SessionFormData>({
    patient_id: userId,
    treatment_id: 0,
    status: 'pending' // Always pending until video uploaded
  })

  // Debug logging
  useEffect(() => {
    console.log('🎭 Modal treatments state:', {
      loading: treatmentsLoading,
      error: treatmentsError,
      count: treatments?.length,
      treatments: treatments?.slice(0, 3) // Log first 3 for debugging
    });
  }, [treatments, treatmentsLoading, treatmentsError]);

  const handleTreatmentSelect = (treatment: Treatment) => {
    console.log('📋 Selected treatment:', treatment);
    setSelectedTreatment(treatment)
    setFormData(prev => ({
      ...prev,
      treatment_id: treatment.id
    }))
  }

  const handleInputChange = (field: keyof SessionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTreatment) {
      alert('Please select an exercise')
      return
    }

    try {
      setIsSubmitting(true)
      const createdSession = await onCreateSession(formData)

      // Reset form and close modal
      setFormData({
        patient_id: userId,
        treatment_id: 0,
        status: 'pending'
      })
      setSelectedTreatment(null)
      onClose()

      // Redirect to the session page with the exercise name
      const exerciseName = createdSession.treatment.name.toLowerCase().replace(/\s+/g, '_')
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
        borderRadius: '12px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: '1px solid hsl(var(--border))'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'hsl(var(--foreground))'
          }}>
            Create New Exercise Session
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: 'hsl(var(--muted-foreground))'
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Exercise Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'hsl(var(--foreground))',
              marginBottom: '8px'
            }}>
              <Activity style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
              Select Exercise *
            </label>
            
            {treatmentsLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                Loading exercises...
              </div>
            ) : treatmentsError ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
                Error loading exercises: {treatmentsError}
              </div>
            ) : treatments.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                No exercises available. Please run the SQL setup script.
              </div>
            ) : (
              <div style={{
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {treatments.map((treatment) => (
                  <div
                    key={treatment.id}
                    onClick={() => handleTreatmentSelect(treatment)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid hsl(var(--border))',
                      backgroundColor: selectedTreatment?.id === treatment.id ? 'hsl(var(--accent))' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {treatment.name}
                    </div>
                    {treatment.description && (
                      <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                        {treatment.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Exercise Summary */}
          {selectedTreatment && (
            <div style={{
              padding: '12px',
              backgroundColor: 'hsl(var(--accent))',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                Selected: {selectedTreatment.name}
              </div>
              {selectedTreatment.description && (
                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                  {selectedTreatment.description}
                </div>
              )}
            </div>
          )}


          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            paddingTop: '16px',
            borderTop: '1px solid hsl(var(--border))'
          }}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedTreatment || isSubmitting}
              style={{
                backgroundColor: '#0d4a2b',
                gap: '8px'
              }}
            >
              {isSubmitting ? (
                'Creating...'
              ) : (
                <>
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Create Session
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 