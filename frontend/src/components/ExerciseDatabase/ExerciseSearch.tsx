import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useExerciseDatabase } from '@/hooks/useExerciseDatabase';
import { Exercise } from '@/types/medical.types';

// Mock API - in real app this would be imported from API service
const doctorApi = {
  searchExercises: async (query: any) => {
    // Mock implementation
    return {
      items: [],
      total: 0
    };
  }
};

interface Props {
  onSelect: (exercise: Exercise) => void;
}

export function ExerciseSearch({ onSelect }: Props) {
  const [items, setItems] = useState<Exercise[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState({
    q: '',
    bodyPart: '',
    injuryType: '',
    difficulty: '',
    equipment: '',
    page: 1,
    perPage: 20,
  });

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await doctorApi.searchExercises(query);
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const id = setTimeout(search, 250);
    return () => clearTimeout(id);
  }, [search]);

  const pageCount = useMemo(() => Math.ceil(total / query.perPage), [total, query.perPage]);

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-4">
      <div className="grid gap-3 md:grid-cols-5">
        <input
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500"
          placeholder="Search exercise name"
          value={query.q}
          onChange={(e) => setQuery({ ...query, q: e.target.value, page: 1 })}
        />
        <input 
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500" 
          placeholder="Body part" 
          value={query.bodyPart} 
          onChange={(e) => setQuery({ ...query, bodyPart: e.target.value, page: 1 })} 
        />
        <input 
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500" 
          placeholder="Injury type" 
          value={query.injuryType} 
          onChange={(e) => setQuery({ ...query, injuryType: e.target.value, page: 1 })} 
        />
        <select 
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900" 
          value={query.difficulty} 
          onChange={(e) => setQuery({ ...query, difficulty: e.target.value, page: 1 })}
        >
          <option value="">Any difficulty</option>
          <option value="easy">Easy</option>
          <option value="moderate">Moderate</option>
          <option value="hard">Hard</option>
        </select>
        <input 
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-500" 
          placeholder="Equipment" 
          value={query.equipment} 
          onChange={(e) => setQuery({ ...query, equipment: e.target.value, page: 1 })} 
        />
      </div>

      {loading && <p className="text-sm text-gray-600">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((ex) => (
          <button key={ex.id} onClick={() => onSelect(ex)} className="text-left border border-gray-200 rounded-lg p-3 hover:bg-gray-50 hover:border-gray-300 transition-all">
            <div className="flex items-start space-x-3">
              {ex.imageUrl ? (
                <img src={ex.imageUrl} alt={ex.name} className="w-12 h-12 object-cover rounded-lg" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No Image</div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{ex.name}</p>
                <p className="text-xs text-gray-500 mt-1">{ex.bodyPart} • {ex.injuryTypes.join(', ')}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button className="px-3 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm disabled:opacity-50 text-gray-700" disabled={query.page <= 1} onClick={() => setQuery({ ...query, page: Math.max(1, query.page - 1) })}>Prev</button>
          <p className="text-sm text-gray-600">Page {query.page} / {pageCount}</p>
          <button className="px-3 py-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm disabled:opacity-50 text-gray-700" disabled={query.page >= pageCount} onClick={() => setQuery({ ...query, page: Math.min(pageCount, query.page + 1) })}>Next</button>
        </div>
      )}
    </div>
  );
}