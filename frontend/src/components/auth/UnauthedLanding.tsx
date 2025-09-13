'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { supabaseBrowser } from '@/lib/supabase/client'

import { LoginModal } from '@/components/auth/login-modal'

export default function UnauthedLanding() {
  const [showLoginModal, setShowLoginModal] = useState(false)

  const handleGoogleSignIn = async () => {
    const { data, error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });
    if (error) {
      alert(`Login failed: ${error.message}`);
      return;
    }
    if (data?.url) window.location.href = data.url;
    else alert("Unable to start Google OAuth. Check provider config.");
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fffe 0%, #e8f5f0 50%, #d1f2df 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #0d4a2b20, #0d4a2b10)',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        top: '70%',
        right: '15%',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #0d4a2b15, #0d4a2b05)',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '5%',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #0d4a2b25, #0d4a2b15)',
        animation: 'float 7s ease-in-out infinite'
      }} />

      <div style={{
        textAlign: 'center',
        maxWidth: '800px',
        zIndex: 10,
        position: 'relative'
      }}>
        {/* Logo and Brand */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          animation: 'fadeInUp 1s ease-out'
        }}>
          <div style={{
            width: '240px',
            height: '240px',
            position: 'relative',
            animation: 'pulse 2s ease-in-out infinite',
            marginBottom: '20px'
          }}>
            <Image
              src="/mediclylogo.png"
              alt="Medicly Logo"
              width={400}
              height={400}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              priority
            />
          </div>
          <h1 style={{
            fontSize: '4.5rem',
            fontFamily: 'Houschka Rounded, system-ui, -apple-system, sans-serif',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #0d4a2b 0%, #1a6741 50%, #267d56 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
            textShadow: '0 0 40px rgba(13, 74, 43, 0.3)'
          }}>
            medicly
          </h1>
        </div>


        {/* Subtitle */}
        <p style={{
          fontSize: '1.4rem',
          color: '#4a5568',
          marginBottom: '40px',
          lineHeight: '1.6',
          animation: 'fadeInUp 1s ease-out 0.4s both',
          fontWeight: '400',
          letterSpacing: '-0.01em',
          maxWidth: '600px',
          margin: '0 auto 40px auto'
        }}>
          AI-powered rehabilitation tracking with intelligent pose analysis<br />
          <span style={{ color: '#1a6741', fontWeight: '500' }}>and personalized recovery insights</span>
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          alignItems: 'center',
          animation: 'fadeInUp 1s ease-out 0.6s both'
        }}>
          {/* Primary Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '18px 36px',
              fontSize: '1.125rem',
              fontWeight: '500',
              color: 'white',
              background: 'linear-gradient(135deg, #0d4a2b 0%, #1a6741 50%, #267d56 100%)',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 25px rgba(13, 74, 43, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
              minWidth: '300px',
              letterSpacing: '-0.01em',
              backdropFilter: 'blur(10px)'
            }}
            className="hover:scale-105 hover:shadow-lg"
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.background = 'linear-gradient(135deg, #1a6741 0%, #267d56 50%, #0d4a2b 100%)'
              target.style.boxShadow = '0 12px 35px rgba(13, 74, 43, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
              target.style.transform = 'translateY(-2px) scale(1.02)'
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.background = 'linear-gradient(135deg, #0d4a2b 0%, #1a6741 50%, #267d56 100%)'
              target.style.boxShadow = '0 8px 25px rgba(13, 74, 43, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
              target.style.transform = 'translateY(0) scale(1)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Demo Link */}
        <div style={{
          marginTop: '32px',
          animation: 'fadeInUp 1s ease-out 0.8s both'
        }}>
        </div>

        {/* Trust Indicators */}
        <div style={{
          marginTop: '48px',
          display: 'flex',
          justifyContent: 'center',
          gap: '32px',
          fontSize: '0.875rem',
          color: '#6b7280',
          animation: 'fadeInUp 1s ease-out 1s both'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#0d4a2b'
            }} />
            <span>Secure & Private</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#0d4a2b'
            }} />
            <span>AI-Powered</span>
          </div>
        </div>
      </div>

      <LoginModal isOpen={showLoginModal} onOpenChange={setShowLoginModal} />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}



