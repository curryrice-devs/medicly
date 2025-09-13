import React from 'react';
import { PatientCase } from '@/types/medical.types';

interface Props {
  cases: PatientCase[];
  onOpen: (id: string) => void;
}

export function PatientQueue({ cases, onOpen }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cases.map((c) => (
        <button
          key={c.id}
          onClick={() => onOpen(c.id)}
          className="text-left rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.07] transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80">{c.status}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              c.urgency === 'high' ? 'bg-red-500/20 text-red-300' : c.urgency === 'medium' ? 'bg-orange-500/20 text-orange-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>{c.urgency}</span>
          </div>
          <div className="mt-3">
            <p className="text-sm text-white/60">Patient</p>
            <p className="font-medium">#{c.patientId}</p>
          </div>
          <div className="mt-2 grid grid-cols-2 text-sm gap-2">
            <div>
              <p className="text-white/60">Injury</p>
              <p className="text-white">{c.injuryType}</p>
            </div>
            <div>
              <p className="text-white/60">Submitted</p>
              <p className="text-white">{new Date(c.submittedAt).toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-white/60">AI Recommendation</p>
            <p className="text-sm text-white truncate">{c.recommendedExercise.name}</p>
          </div>
        </button>
      ))}
    </div>
  );
}


