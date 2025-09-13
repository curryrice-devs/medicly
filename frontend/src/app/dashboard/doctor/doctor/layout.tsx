'use client';

import React from 'react';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white">
      <nav className="sticky top-0 z-30 bg-[#0b0b0c]/80 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-400 to-cyan-400" />
            <span className="font-semibold tracking-tight">MedReview</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <a className="hover:text-white" href="/doctor">Dashboard</a>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}


