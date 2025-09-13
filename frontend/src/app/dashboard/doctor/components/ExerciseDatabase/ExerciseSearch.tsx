import React from 'react';
import { useExerciseDatabase } from '@/hooks/useExerciseDatabase';
import { Exercise } from '@/types/medical.types';

interface Props {
  onSelect: (exercise: Exercise) => void;
}

export function ExerciseSearch({ onSelect }: Props) {
  const { items, loading, error, query, setQuery, pageCount } = useExerciseDatabase();

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
      <div className="grid gap-2 md:grid-cols-5">
        <input
          className="rounded bg-white/10 border border-white/10 px-3 py-2 text-sm placeholder:text-white/50 text-white"
          placeholder="Search exercise name"
          value={query.q}
          onChange={(e) => setQuery({ ...query, q: e.target.value, page: 1 })}
        />
        <input className="rounded bg-white/10 border border-white/10 px-3 py-2 text-sm placeholder:text-white/50 text-white" placeholder="Body part" value={query.bodyPart} onChange={(e) => setQuery({ ...query, bodyPart: e.target.value, page: 1 })} />
        <input className="rounded bg-white/10 border border-white/10 px-3 py-2 text-sm placeholder:text-white/50 text-white" placeholder="Injury type" value={query.injuryType} onChange={(e) => setQuery({ ...query, injuryType: e.target.value, page: 1 })} />
        <select className="rounded bg-white/10 border border-white/10 px-3 py-2 text-sm text-white" value={query.difficulty} onChange={(e) => setQuery({ ...query, difficulty: e.target.value, page: 1 })}>
          <option value="">Any difficulty</option>
          <option value="easy">Easy</option>
          <option value="moderate">Moderate</option>
          <option value="hard">Hard</option>
        </select>
        <input className="rounded bg-white/10 border border-white/10 px-3 py-2 text-sm placeholder:text-white/50 text-white" placeholder="Equipment" value={query.equipment} onChange={(e) => setQuery({ ...query, equipment: e.target.value, page: 1 })} />
      </div>

      {loading && <p className="text-sm text-white/60">Loading...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((ex) => (
          <button key={ex.id} onClick={() => onSelect(ex)} className="text-left rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/[0.07] transition">
            <div className="flex items-center gap-3">
              {ex.imageUrl ? (
                <img src={ex.imageUrl} alt={ex.name} className="w-16 h-16 object-cover rounded" />
              ) : (
                <div className="w-16 h-16 rounded bg-white/10 flex items-center justify-center text-white/50 text-xs">No Image</div>
              )}
              <div>
                <p className="font-medium">{ex.name}</p>
                <p className="text-xs text-white/60">{ex.bodyPart} • {ex.injuryTypes.join(', ')}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-sm disabled:opacity-50" disabled={query.page <= 1} onClick={() => setQuery({ ...query, page: Math.max(1, query.page - 1) })}>Prev</button>
          <p className="text-sm text-white/70">Page {query.page} / {pageCount}</p>
          <button className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-sm disabled:opacity-50" disabled={query.page >= pageCount} onClick={() => setQuery({ ...query, page: Math.min(pageCount, query.page + 1) })}>Next</button>
        </div>
      )}
    </div>
  );
}


