import React, { useState } from 'react';
import { PatientCase } from '@/types/medical.types';

interface Props {
  caze: PatientCase;
}

export function PatientContextPanel({ caze }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2">
        <span className="font-medium text-left">Patient Context</span>
        <span className="text-sm text-white/70">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1 text-sm text-white/80">
          <p>Patient ID: {caze.patientId}</p>
          <p>Injury Type: {caze.injuryType}</p>
          <p>Submitted: {new Date(caze.submittedAt).toLocaleString()}</p>
          {/* Additional fields can be populated when backend provides more context */}
        </div>
      )}
    </div>
  );
}


