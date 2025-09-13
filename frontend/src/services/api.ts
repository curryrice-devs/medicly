import { PatientCase, CaseStats, Exercise } from '@/types/medical.types';

export const doctorApi = {
  async listCases(filters: any): Promise<{ items: PatientCase[], total: number, stats: CaseStats }> {
    // Mock implementation - replace with actual API calls
    return {
      items: [],
      total: 0,
      stats: { pendingCount: 0, completedToday: 0, averageReviewTimeSec: 0 }
    };
  },

  async searchExercises(query: any): Promise<{ items: Exercise[], total: number }> {
    // Mock implementation - replace with actual API calls
    return {
      items: [],
      total: 0
    };
  }
}; 