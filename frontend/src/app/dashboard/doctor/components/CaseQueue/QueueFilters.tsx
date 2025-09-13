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
    <div className="grid gap-4 md:grid-cols-5">
      <div className="relative">
        <input
          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
          placeholder="Search case ID or patient ID"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>
      
      <select
        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value })}
      >
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="modified">Modified</option>
        <option value="rejected">Rejected</option>
      </select>
      
      <input
        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
        placeholder="Injury type"
        value={filters.injuryType}
        onChange={(e) => onChange({ injuryType: e.target.value })}
      />
      
      <select
        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
        value={filters.urgency}
        onChange={(e) => onChange({ urgency: e.target.value })}
      >
        <option value="">All urgencies</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      
      <select
        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
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


