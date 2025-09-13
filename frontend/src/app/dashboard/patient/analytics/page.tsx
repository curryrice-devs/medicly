'use client'

import React from 'react'
import { BarChart3, TrendingUp, Activity } from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'

export default function PatientAnalyticsPage() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return (
      <div style={{ 
        flex: 1,
        backgroundColor: 'hsl(var(--background))'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'hsl(var(--foreground))', marginBottom: '16px' }}>
              Analytics Dashboard
            </h2>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>
              Please sign in to view your analytics
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
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Analytics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={{ 
            backgroundColor: 'hsl(var(--card))',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '8px', 
                backgroundColor: 'rgba(26, 87, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarChart3 style={{ width: '20px', height: '20px', color: '#1a5744' }} />
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>
                  Progress Score
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                  85% improvement
                </p>
              </div>
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'hsl(var(--card))',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '8px', 
                backgroundColor: 'rgba(26, 87, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp style={{ width: '20px', height: '20px', color: '#1a5744' }} />
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>
                  Weekly Trend
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                  +12% this week
                </p>
              </div>
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'hsl(var(--card))',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '8px', 
                backgroundColor: 'rgba(26, 87, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Activity style={{ width: '20px', height: '20px', color: '#1a5744' }} />
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>
                  Total Sessions
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
                  24 completed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div style={{ 
          backgroundColor: 'hsl(var(--card))',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <BarChart3 style={{ width: '64px', height: '64px', color: 'hsl(var(--muted-foreground))', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'hsl(var(--foreground))', marginBottom: '8px' }}>
              Detailed Analytics Coming Soon
            </h3>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>
              We're building comprehensive analytics to track your movement progress over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 