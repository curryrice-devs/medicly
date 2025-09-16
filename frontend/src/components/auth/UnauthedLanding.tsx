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
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite'
        }} />
      </div>

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-gradient-to-r from-white/5 to-white/10 animate-float-slow" />
      <div className="absolute top-3/4 right-1/4 w-24 h-24 rounded-full bg-gradient-to-r from-white/10 to-white/5 animate-float-reverse" />
      <div className="absolute top-1/2 right-1/3 w-16 h-16 rounded-full bg-white/5 animate-float-fast" />
      <div className="absolute bottom-1/4 left-1/3 w-20 h-20 rounded-full bg-gradient-to-r from-white/8 to-white/3 animate-pulse-slow" />

      {/* Geometric Shapes */}
      <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-white/20 rotate-45 animate-spin-slow" />
      <div className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-white/15 rotate-45 animate-bounce-slow" />
      <div className="absolute top-1/4 right-1/2 w-1 h-1 bg-white/30 animate-ping" />

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-4xl px-6">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center justify-center mb-12 animate-fade-in-up">
          <div className="w-48 h-48 relative mb-8 animate-pulse-gentle">
            <Image
              src="/mediclylogo.png"
              alt="Medicly Logo"
              width={192}
              height={192}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)' // Make logo white
              }}
              priority
            />
          </div>
          
          <h1 className="text-7xl font-bold text-white mb-4 tracking-tight animate-fade-in-up-delay-1">
            medicly
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl leading-relaxed animate-fade-in-up-delay-2">
            AI-powered rehabilitation tracking with intelligent pose analysis
            <br />
            <span className="text-white font-medium">and personalized recovery insights</span>
          </p>
        </div>

        {/* CTA Button */}
        <div className="animate-fade-in-up-delay-3">
          <button
            onClick={handleGoogleSignIn}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-lg font-medium text-black bg-white rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/20 min-w-80"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white to-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <svg width="24" height="24" viewBox="0 0 24 24" className="relative z-10">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="relative z-10">Continue with Google</span>
          </button>
        </div>


      </div>

      <LoginModal isOpen={showLoginModal} onOpenChange={setShowLoginModal} />

      {/* Enhanced CSS Animations */}
      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-180deg); }
        }
        
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse-gentle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.95; }
        }

        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        
        .animate-float-reverse {
          animation: float-reverse 10s ease-in-out infinite;
        }
        
        .animate-float-fast {
          animation: float-fast 6s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        
        .animate-fade-in-up-delay-1 {
          animation: fade-in-up 0.8s ease-out 0.2s both;
        }
        
        .animate-fade-in-up-delay-2 {
          animation: fade-in-up 0.8s ease-out 0.4s both;
        }
        
        .animate-fade-in-up-delay-3 {
          animation: fade-in-up 0.8s ease-out 0.6s both;
        }
        
        .animate-fade-in-up-delay-4 {
          animation: fade-in-up 0.8s ease-out 0.8s both;
        }
        
        .animate-pulse-gentle {
          animation: pulse-gentle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}



