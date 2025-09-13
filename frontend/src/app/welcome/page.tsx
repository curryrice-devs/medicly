"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "client" | "doctor";

interface PatientInfo {
  fullName: string;
  phone: string;
  age: string;
  gender: "male" | "female" | "other" | "";
}

export default function WelcomePage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "patient-info">("role");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    fullName: "",
    phone: "",
    age: "",
    gender: "",
  });

  const chooseRole = async (role: Role) => {
    if (role === "doctor") {
      // Doctors go directly to their dashboard
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

        // Wait longer to ensure database update fully propagates
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Hard redirect with full page reload to ensure fresh auth state
        window.location.replace("/dashboard/doctor");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unexpected error");
        setSubmitting(false);
      }
    } else {
      // Clients need to provide patient information
      setStep("patient-info");
    }
  };

  const completePatientOnboarding = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validate required fields
      if (!patientInfo.fullName.trim() || !patientInfo.phone.trim() || !patientInfo.age.trim() || !patientInfo.gender) {
        throw new Error("Please fill in all required fields");
      }

      const age = parseInt(patientInfo.age);
      if (isNaN(age) || age < 1 || age > 120) {
        throw new Error("Please enter a valid age");
      }

      // Set role and create patient profile
      const res = await fetch("/api/profile/patient-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "client",
          patientInfo: {
            fullName: patientInfo.fullName.trim(),
            phone: patientInfo.phone.trim(),
            age: age,
            gender: patientInfo.gender,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed to complete onboarding (${res.status})`);
      }

      // Small delay to ensure database update propagates before redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
      setSubmitting(false);
    }
  };

  if (step === "patient-info") {
    return (
      <main className="min-h-screen grid place-items-center bg-gray-50 px-6">
        <div className="bg-white border rounded-2xl shadow-sm p-8 w-full max-w-lg">
          <h1 className="text-2xl font-semibold text-gray-900">Patient Information</h1>
          <p className="mt-2 text-gray-600">Help us create your profile so doctors can find and assist you.</p>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); completePatientOnboarding(); }}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                value={patientInfo.fullName}
                onChange={(e) => setPatientInfo({ ...patientInfo, fullName: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your full name"
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                value={patientInfo.phone}
                onChange={(e) => setPatientInfo({ ...patientInfo, phone: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your phone number"
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                Age *
              </label>
              <input
                type="number"
                id="age"
                min="1"
                max="120"
                value={patientInfo.age}
                onChange={(e) => setPatientInfo({ ...patientInfo, age: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your age"
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                id="gender"
                value={patientInfo.gender}
                onChange={(e) => setPatientInfo({ ...patientInfo, gender: e.target.value as PatientInfo["gender"] })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={submitting}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep("role")}
                disabled={submitting}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Creating..." : "Complete Setup"}
              </button>
            </div>
          </form>

          <p className="mt-4 text-xs text-gray-500">
            You can add additional information like medical history and emergency contacts later in your profile settings.
          </p>
        </div>
      </main>
    );
  }

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
            <div className="text-lg font-medium text-gray-900">I'm a patient</div>
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


