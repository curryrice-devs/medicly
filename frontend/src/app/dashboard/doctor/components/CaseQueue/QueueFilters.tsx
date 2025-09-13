import React from 'react';

interface Props {
  filters: {
    status: string;
    injuryType: string;
    urgency: string;
    sort: string;
    search: string;
  };
  onChange: (partial: Partial<Props['filters']>) => void;
}

export function QueueFilters({ filters, onChange }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 grid gap-3 md:grid-cols-5">
      <input
        className="rounded bg-white/10 border border-white/10 px-3 py-2 text-sm placeholder:text-white/50 text-white"
        placeholder="Search case ID or patient ID"
        value={filters.search}
        onChange={(e) => onChange({ search: e.target.value })}
      />
      <select
        className="rounded bg-white/10 border border-white/10 px-3 py-2 text-sm text-white"
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value })}
      >
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="modified">Modified</option>
        <option value="rejected">Rejected</option>
      </select>
      <input
        className="rounded bg-white/10 border border-white/10 px-3 py-2 text-sm placeholder:text-white/50 text-white"
        placeholder="Injury type"
        value={filters.injuryType}
        onChange={(e) => onChange({ injuryType: e.target.value })}
      />
      <select
        className="rounded bg-white/10 border border-white/10 px-3 py-2 text-sm text-white"
        value={filters.urgency}
        onChange={(e) => onChange({ urgency: e.target.value })}
      >
        <option value="">All urgencies</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select
        className="rounded bg-white/10 border border-white/10 px-3 py-2 text-sm text-white"
        value={filters.sort}
        onChange={(e) => onChange({ sort: e.target.value })}
      >
        <option value="submittedAt:desc">Newest first</option>
        <option value="submittedAt:asc">Oldest first</option>
        <option value="urgency:desc">Urgency high→low</option>
      </select>
    </div>
  );
}


