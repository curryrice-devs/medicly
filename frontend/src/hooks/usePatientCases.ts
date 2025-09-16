import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PatientCase, CaseStats, SessionStatus } from '@/types/medical.types';
import { doctorApi } from '@/services/api';
import { useAuth } from '@/contexts/auth-context';

interface UsePatientCasesOptions {
  initialStatus?: SessionStatus;
}

export function usePatientCases(options: UsePatientCasesOptions = {}) {
  const { user } = useAuth();
  const [items, setItems] = useState<PatientCase[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<CaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctorPatients, setDoctorPatients] = useState<string[]>([]);

  const [filters, setFilters] = useState({
    status: options.initialStatus || 'all',
    injuryType: '',
    urgency: '',
    sort: 'submittedAt:desc',
    search: '',
    page: 1,
    perPage: 20,
  });

  const wsRef = useRef<WebSocket | null>(null);

  // Load doctor's assigned patients
  const loadDoctorPatients = useCallback(async () => {
    if (!user?.id || user.role !== 'doctor') {
      setDoctorPatients([]);
      return;
    }

    try {
      const patients = await doctorApi.getDoctorPatients(user.id);
      const patientIds = patients.map(p => p.id);
      setDoctorPatients(patientIds);
      console.log('[usePatientCases] loaded doctor patients:', patientIds.length);
    } catch (e) {
      console.error('[usePatientCases] error loading doctor patients:', e);
      setDoctorPatients([]);
    }
  }, [user?.id, user?.role]);

  const load = useCallback(async () => {
    console.log('[usePatientCases] load() start', { filters, doctorPatientsCount: doctorPatients.length });
    setLoading(true);
    setError(null);
    try {
      // Include doctorId in filters if user is a doctor to enable server-side filtering
      const filtersWithDoctor = user?.role === 'doctor' && user?.id 
        ? { ...filters, doctorId: user.id }
        : filters;

      const res = await doctorApi.listCases(filtersWithDoctor);
      console.log('[usePatientCases] listCases() result', { total: res.total, itemsLen: res.items?.length });
      
      // If server-side filtering is working, we might not need client-side filtering
      // But we'll keep it as a fallback for robustness
      let filteredItems = res.items;
      if (user?.role === 'doctor' && doctorPatients.length > 0 && !filtersWithDoctor.doctorId) {
        // Only apply client-side filtering if we didn't do server-side filtering
        filteredItems = res.items.filter(item => doctorPatients.includes(item.patientId));
        console.log('[usePatientCases] client-side filtered to doctor patients:', filteredItems.length, 'from', res.items.length);
      }
      
      setItems(filteredItems);
      setTotal(filteredItems.length);
      
      // Enhance stats with actual doctor patient count if available
      let enhancedStats = res.stats;
      if (user?.role === 'doctor' && doctorPatients.length > 0) {
        enhancedStats = {
          ...res.stats,
          activePatients: doctorPatients.length // Use actual assigned patient count
        };
        console.log('[usePatientCases] enhanced stats with actual patient count:', doctorPatients.length);
      }
      
      setStats(enhancedStats);
    } catch (e) {
      console.error('[usePatientCases] load() error', e);
      setError(e instanceof Error ? e.message : 'Failed to load cases');
    } finally {
      console.log('[usePatientCases] load() done');
      setLoading(false);
    }
  }, [filters, user?.role, user?.id, doctorPatients]);

  // Load doctor patients first, then load cases
  useEffect(() => {
    loadDoctorPatients();
  }, [loadDoctorPatients]);

  useEffect(() => {
    if (user?.role !== 'doctor' || doctorPatients.length > 0 || !user?.id) {
      load();
    }
  }, [load, user?.role, doctorPatients.length, user?.id]);

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
            // Reload both doctor patients and cases to ensure accurate filtering
            loadDoctorPatients().then(() => load());
          }
        } catch {}
      });
      return () => {
        ws.close();
      };
    } catch {
      // ignore websocket errors in dev
    }
  }, [load, loadDoctorPatients]);

  const updateFilter = useCallback((partial: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...partial, page: partial.page ?? 1 }));
  }, []);

  const pageCount = useMemo(() => Math.ceil(total / filters.perPage), [total, filters.perPage]);

  const reload = useCallback(async () => {
    await loadDoctorPatients();
    await load();
  }, [loadDoctorPatients, load]);

  return {
    items,
    total,
    stats,
    loading,
    error,
    filters,
    updateFilter,
    reload,
    pageCount,
  };
}


