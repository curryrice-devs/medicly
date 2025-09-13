'use client'

import React, { useState } from 'react'
import { ChevronRight, LogIn } from 'lucide-react'
import { usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/auth/user-menu'
import { LoginModal } from '@/components/auth/login-modal'

interface BreadcrumbItem {
  label: string
  href?: string
}

export function BreadcrumbNav() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const pathname = usePathname()
  const params = useParams()

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const sessionNames: Record<string, string> = {
      '1': 'Shoulder Rehabilitation',
      '2': 'Lower Back Therapy', 
      '3': 'Knee Recovery Program'
    }

    // Only show breadcrumbs for non-dashboard pages
    if (pathname === '/dashboard/patient' || pathname === '/') {
      return []
    }
    
    if (pathname === '/dashboard/patient/analytics') {
      return [
        { label: 'Dashboard', href: '/dashboard/patient' },
        { label: 'Analytics' }
      ]
    }
    
    if (pathname === '/dashboard/patient/settings') {
      return [
        { label: 'Dashboard', href: '/dashboard/patient' },
        { label: 'Settings' }
      ]
    }
    
    if (pathname === '/patients') {
      return [
        { label: 'Dashboard', href: '/dashboard/patient' },
        { label: 'Patients' }
      ]
    }
    
    if (pathname === '/dashboard/patient/upload') {
      return [
        { label: 'Dashboard', href: '/dashboard/patient' },
        { label: 'Send Video' }
      ]
    }
    
    if (pathname.startsWith('/dashboard/patient/session/')) {
      const sessionId = params?.sessionId as string
      const sessionName = sessionNames[sessionId] || 'Session'
      
      return [
        { label: 'Dashboard', href: '/dashboard/patient' },
        { label: sessionName }
      ]
    }

    return []
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <>
      <header style={{ 
        height: '60px',
        backgroundColor: 'hsl(var(--background))',
        borderBottom: '1px solid hsl(var(--border))',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        paddingRight: '24px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          width: '100%',
          paddingLeft: '24px'
        }}>
          {/* Logo and Breadcrumbs - Left Side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Logo - For unauthenticated users only */}
            {!isAuthenticated && (
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', position: 'relative' }}>
                  <Image
                    src="/mediclylogo.png"
                    alt="Medicly Logo"
                    width={32}
                    height={32}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    priority
                  />
                </div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}>
                  medicly
                </h1>
              </Link>
            )}

            {/* Breadcrumb Navigation - Only show when needed and authenticated */}
            {breadcrumbs.length > 0 && isAuthenticated && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                paddingLeft: '20px',
                borderLeft: '2px solid hsl(var(--border))'
              }}>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <ChevronRight style={{ width: '16px', height: '16px', color: 'hsl(var(--muted-foreground))' }} />
                    )}
                    {crumb.href ? (
                      <Link href={crumb.href}>
                        <span style={{ 
                          fontSize: '1rem', 
                          color: 'hsl(var(--muted-foreground))',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          fontWeight: '500'
                        }}
                        className="hover:text-foreground transition-colors"
                        >
                          {crumb.label}
                        </span>
                      </Link>
                    ) : (
                      <span style={{ 
                        fontSize: '1rem', 
                        fontWeight: '700',
                        color: 'hsl(var(--foreground))'
                      }}>
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* User Menu - Right Side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isAuthenticated && user && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '0.875rem', 
                color: 'hsl(var(--muted-foreground))'
              }}
              className="hidden sm:flex"
              >
                <span>Welcome, <span style={{ fontWeight: '500', color: 'hsl(var(--foreground))' }}>{user.name.split(' ')[0]}</span></span>
              </div>
            )}
            
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Button 
                onClick={() => setShowLoginModal(true)}
                style={{ gap: '8px', height: '32px', fontSize: '0.75rem' }}
                size="sm"
              >
                <LogIn style={{ width: '12px', height: '12px' }} />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <LoginModal 
        isOpen={showLoginModal} 
        onOpenChange={setShowLoginModal} 
      />
    </>
  )
} 