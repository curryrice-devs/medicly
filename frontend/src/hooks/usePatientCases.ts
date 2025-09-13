import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PatientCase, CaseStats } from '@/types/medical.types';
import { doctorApi } from '@/services/api';

interface UsePatientCasesOptions {
  initialStatus?: 'pending' | 'active' | 'rejected' | 'completed';
}

export function usePatientCases(options: UsePatientCasesOptions = {}) {
  const [items, setItems] = useState<PatientCase[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<CaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    status: options.initialStatus || 'pending',
    injuryType: '',
    urgency: '',
    sort: 'submittedAt:desc',
    search: '',
    page: 1,
    perPage: 20,
  });

  const wsRef = useRef<WebSocket | null>(null);

  const load = useCallback(async () => {
    console.log('[usePatientCases] load() start', { filters });
    setLoading(true);
    setError(null);
    try {
      const res = await doctorApi.listCases(filters);
      console.log('[usePatientCases] listCases() result', { total: res.total, itemsLen: res.items?.length });
      setItems(res.items);
      setTotal(res.total);
      setStats(res.stats);
    } catch (e) {
      console.error('[usePatientCases] load() error', e);
      setError(e instanceof Error ? e.message : 'Failed to load cases');
    } finally {
      console.log('[usePatientCases] load() done');
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time updates via WebSocket
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL;
    if (!url) return; // disable WS unless explicitly configured
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_case' || data.type === 'case_updated') {
            load();
          }
        } catch {}
      });
      return () => {
        ws.close();
      };
    } catch {
      // ignore websocket errors in dev
    }
  }, [load]);

  const updateFilter = useCallback((partial: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...partial, page: partial.page ?? 1 }));
  }, []);

  const pageCount = useMemo(() => Math.ceil(total / filters.perPage), [total, filters.perPage]);

  return {
    items,
    total,
    stats,
    loading,
    error,
    filters,
    updateFilter,
    reload: load,
    pageCount,
  };
}


