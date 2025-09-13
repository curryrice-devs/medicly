import { useCallback, useEffect, useMemo, useState } from 'react';
import { Exercise } from '@/types/medical.types';
import { doctorApi } from '@/services/api';

export function useExerciseDatabase() {
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

  return {
    items,
    total,
    loading,
    error,
    query,
    setQuery,
    search,
    pageCount,
  };
}


