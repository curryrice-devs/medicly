"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LandingPage() {
  const router = useRouter();
  const supabase = supabaseBrowser;

  const handleGoogleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
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
    <main className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-medium mb-6">
            <span>Healthcare</span>
            <span className="w-1 h-1 rounded-full bg-blue-400" />
            <span>AI‑assisted recovery</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900">Medicly</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-prose">
            Intelligent, privacy‑first physical therapy tracking. Upload sessions, get posture insights,
            and measure progress over time—securely, from anywhere.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGoogleSignIn}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-3 shadow-sm"
            >
              <span>Begin Login</span>
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-500">By continuing you agree to our privacy policy.</p>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-blue-200/30 blur-2xl rounded-full" />
          <div className="relative bg-white border rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-600 text-white grid place-items-center font-bold">M</div>
              <div>
                <p className="font-semibold text-gray-900">Secure by design</p>
                <p className="text-sm text-gray-500">Supabase Auth • Row‑Level Security</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                <p className="font-medium text-gray-900">Posture insights</p>
                <p className="text-gray-600 mt-1">Angle analysis and form tracking</p>
              </div>
              <div className="rounded-lg bg-teal-50 border border-teal-100 p-4">
                <p className="font-medium text-gray-900">Progress</p>
                <p className="text-gray-600 mt-1">Session history and trends</p>
              </div>
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-4">
                <p className="font-medium text-gray-900">Privacy</p>
                <p className="text-gray-600 mt-1">Your data stays yours</p>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                <p className="font-medium text-gray-900">Speed</p>
                <p className="text-gray-600 mt-1">Fast, responsive interface</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


