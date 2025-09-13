import { PatientCase, CaseStats, Exercise } from '@/types/medical.types';
import { mockPatientCases } from '@/app/dashboard/doctor/mockCases';

export const doctorApi = {
  async listCases(filters: any): Promise<{ items: PatientCase[], total: number, stats: CaseStats }> {
    // Simulate server-side filtering/sorting/pagination over mock data
    const {
      status = 'pending',
      injuryType = '',
      urgency = '',
      sort = 'submittedAt:desc',
      search = '',
      page = 1,
      perPage = 20,
    } = filters || {};

    // Filter
    let results = mockPatientCases.filter((c) => {
      const matchesStatus = status ? c.status === status : true;
      const matchesInjury = injuryType
        ? c.injuryType.toLowerCase().includes(String(injuryType).toLowerCase())
        : true;
      const matchesUrgency = urgency ? c.urgency === urgency : true;
      const matchesSearch = search
        ? [c.id, c.patientId]
            .join(' ')
            .toLowerCase()
            .includes(String(search).toLowerCase())
        : true;
      return matchesStatus && matchesInjury && matchesUrgency && matchesSearch;
    });

    // Sort
    const [sortKey, sortDir] = String(sort).split(':');
    results = results.slice().sort((a, b) => {
      if (sortKey === 'submittedAt') {
        const av = new Date(a.submittedAt).getTime();
        const bv = new Date(b.submittedAt).getTime();
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      if (sortKey === 'urgency') {
        const order = { high: 3, medium: 2, low: 1 } as const;
        const av = order[a.urgency] || 0;
        const bv = order[b.urgency] || 0;
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return 0;
    });

    // Pagination
    const total = results.length;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const items = results.slice(start, end);

    // Stats (simple mock): pending count, completed today (approved+modified today), avg review time
    const pendingCount = mockPatientCases.filter((c) => c.status === 'pending').length;
    const today = new Date();
    const isSameDay = (iso: string) => {
      const d = new Date(iso);
      return d.getFullYear() === today.getFullYear() &&
             d.getMonth() === today.getMonth() &&
             d.getDate() === today.getDate();
    };
    const completedToday = mockPatientCases.filter(
      (c) => (c.status === 'approved' || c.status === 'modified') && isSameDay(c.submittedAt)
    ).length;
    const averageReviewTimeSec = 18 * 60; // fixed mock average

    return { items, total, stats: { pendingCount, completedToday, averageReviewTimeSec } };
  },

  async getCaseById(id: string): Promise<PatientCase | null> {
    const found = mockPatientCases.find((c) => c.id === id);
    return found || null;
  },

  async searchExercises(query: any): Promise<{ items: Exercise[], total: number }> {
    // Mock implementation - replace with actual API calls
    return {
      items: [],
      total: 0
    };
  }
}; 