'use client'

import React from 'react'
import { 
  User, 
  Edit3,
  Mail,
  Phone,
  Shield
} from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { Button } from "@/components/ui/button"

export default function PatientSettingsPage() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return (
      <div style={{ 
        flex: 1,
        backgroundColor: 'hsl(var(--background))'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 16px' }}>
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'hsl(var(--foreground))', marginBottom: '16px' }}>
              Settings
            </h2>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>
              Please sign in to access settings
            </p>
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
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* Page Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 'bold', 
            color: 'hsl(var(--foreground))',
            marginBottom: '8px'
          }}>
            Account Settings
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>
            Manage your profile information
          </p>
        </div>

        {/* Profile Information */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: 'hsl(var(--foreground))',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid hsl(var(--border))'
          }}>
            Profile Information
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <User style={{ width: '16px', height: '16px', color: 'hsl(var(--muted-foreground))' }} />
                  <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Full Name</span>
                </div>
                <p style={{ fontSize: '1rem', fontWeight: '500', color: 'hsl(var(--foreground))' }}>
                  {user?.name}
                </p>
              </div>
              <Button variant="outline" size="sm" style={{ gap: '6px' }}>
                <Edit3 style={{ width: '14px', height: '14px' }} />
                Edit
              </Button>
            </div>

            {/* Email */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Mail style={{ width: '16px', height: '16px', color: 'hsl(var(--muted-foreground))' }} />
                  <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Email Address</span>
                </div>
                <p style={{ fontSize: '1rem', fontWeight: '500', color: 'hsl(var(--foreground))' }}>
                  {user?.email}
                </p>
              </div>
              <Button variant="outline" size="sm" style={{ gap: '6px' }}>
                <Edit3 style={{ width: '14px', height: '14px' }} />
                Edit
              </Button>
            </div>

            {/* Phone Number */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Phone style={{ width: '16px', height: '16px', color: 'hsl(var(--muted-foreground))' }} />
                  <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Phone Number</span>
                </div>
                <p style={{ fontSize: '1rem', fontWeight: '500', color: 'hsl(var(--foreground))' }}>
                  (555) 123-4567
                </p>
              </div>
              <Button variant="outline" size="sm" style={{ gap: '6px' }}>
                <Edit3 style={{ width: '14px', height: '14px' }} />
                Edit
              </Button>
            </div>

            {/* Account Type */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Shield style={{ width: '16px', height: '16px', color: 'hsl(var(--muted-foreground))' }} />
                  <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Account Type</span>
                </div>
                <p style={{ fontSize: '1rem', fontWeight: '500', color: 'hsl(var(--foreground))' }}>
                  {user?.role === 'doctor' ? 'Healthcare Provider' : 'Patient'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Account Management */}
        <section>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: 'hsl(var(--foreground))',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid hsl(var(--border))'
          }}>
            Account Management
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Deactivate Account */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '1rem', fontWeight: '500', color: 'hsl(var(--foreground))' }}>Deactivate Account</span>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                  Temporarily disable your account access
                </p>
              </div>
              <Button variant="outline" size="sm" style={{ 
                color: '#dc2626',
                borderColor: '#dc2626'
              }}>
                Deactivate
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
} 