"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "client" | "doctor";

export default function WelcomePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chooseRole = async (role: Role) => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch("/api/profile/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed to set role (${res.status})`);
      }
      if (role === "doctor") router.replace("/doctor");
      else router.replace("/client");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-gray-50 px-6">
      <div className="bg-white border rounded-2xl shadow-sm p-8 w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome to Medicly</h1>
        <p className="mt-2 text-gray-600">Tell us how you'll use the app.</p>
        {error && (
          <div className="mt-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button
            disabled={submitting}
            onClick={() => chooseRole("client")}
            className="rounded-lg border p-5 text-left hover:bg-gray-50 disabled:opacity-60"
          >
            <div className="text-lg font-medium text-gray-900">I'm a client</div>
            <div className="text-sm text-gray-600 mt-1">Track therapy and progress</div>
          </button>
          <button
            disabled={submitting}
            onClick={() => chooseRole("doctor")}
            className="rounded-lg border p-5 text-left hover:bg-gray-50 disabled:opacity-60"
          >
            <div className="text-lg font-medium text-gray-900">I'm a doctor</div>
            <div className="text-sm text-gray-600 mt-1">Manage patients and notes</div>
          </button>
        </div>
        <p className="mt-4 text-xs text-gray-500">You can request changes later through support.</p>
      </div>
    </main>
  );
}


