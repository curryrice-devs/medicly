'use client'

import React from 'react'
import { 
  Users,
  FileText,
  Calendar,
  Loader2,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useAuth } from '@/contexts/auth-context'
import { PatientQueue } from './components/CaseQueue/PatientQueue'
import { QueueFilters } from './components/CaseQueue/QueueFilters'
import { PatientSearch } from './components/PatientSearch/PatientSearch'
import { usePatientCases } from '@/hooks/usePatientCases'


export default function DoctorDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  // Use patient cases hook for real data
  const { 
    items: patientCases, 
    loading: casesLoading, 
    error: casesError, 
    filters: caseFilters, 
    updateFilter: setCaseFilters,
    stats: caseStats 
  } = usePatientCases({ initialStatus: 'pending' })

  const handleCaseOpen = (caseId: string) => {
    router.push(`/dashboard/doctor/cases/${caseId}`)
  }

  // Doctor dashboard stats using real data
  const doctorStats = [
    {
      title: 'Active Patients',
      value: caseStats?.activePatients?.toString() || '0',
      icon: Users,
      description: 'In treatment programs',
      change: caseStats?.inProgressCount ? `${caseStats.inProgressCount} sessions in progress` : 'No active treatments',
      changeType: 'neutral' as const
    },
    {
      title: 'Pending Reviews',
      value: caseStats?.pendingCount?.toString() || '0',
      icon: FileText,
      description: 'Cases awaiting review',
      change: caseStats?.highPriorityPending ? `${caseStats.highPriorityPending} high priority` : 'No urgent cases',
      changeType: caseStats?.highPriorityPending ? 'negative' as const : 'positive' as const
    },
    {
      title: 'Sessions Today',
      value: caseStats?.sessionsToday?.toString() || '0',
      icon: Calendar,
      description: 'New sessions submitted',
      change: caseStats?.completedToday ? `${caseStats.completedToday} completed today` : 'None completed today',
      changeType: 'neutral' as const
    },
    {
      title: 'Est. Review Time',
      value: caseStats?.averageReviewTimeSec ? Math.round(caseStats.averageReviewTimeSec / 60).toString() + 'm' : '0m',
      icon: Clock,
      description: 'Estimated time per case',
      change: caseStats?.pendingCount ? `${caseStats.pendingCount} in queue` : 'Queue empty',
      changeType: 'neutral' as const
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, Dr. {user?.name?.split(' ')[1] || user?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your patients today
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {doctorStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-sm mt-1 ${
                      stat.changeType === 'positive' ? 'text-green-600' : 
                      stat.changeType === 'negative' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Patient Search Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Patient Search</h2>
                <p className="text-sm text-gray-600">
                  Search for patients by case ID, patient ID, or name to add them to your care
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <PatientSearch 
              onPatientSelect={(patient) => {
                router.push(`/dashboard/doctor/patients/${patient.id}`)
              }}
              showAddButton={true}
            />
          </div>
        </div>

        {/* Patient Case Queue */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Patient Case Queue</h2>
                  <p className="text-sm text-gray-600">
                    {casesLoading ? 'Loading...' : `${patientCases.length} cases pending review`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Filters */}
            <div className="mb-6">
              <QueueFilters 
                filters={{
                  status: caseFilters.status,
                  injuryType: caseFilters.injuryType,
                  urgency: caseFilters.urgency,
                  sort: caseFilters.sort,
                  search: caseFilters.search
                }}
                onChange={(partial) => {
                  setCaseFilters({
                    ...partial,
                    page: 1, // Reset to first page when filters change
                    perPage: 20
                  } as any)
                }}
              />
            </div>

            {/* Cases Content */}
            {casesLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Loading cases...</p>
              </div>
            ) : casesError ? (
              <div className="text-center py-12">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
                <p className="text-red-600 font-medium mb-2">Error loading cases</p>
                <p className="text-gray-600 text-sm">{casesError}</p>
              </div>
            ) : patientCases.length > 0 ? (
              <PatientQueue 
                cases={patientCases}
                onOpen={handleCaseOpen}
              />
            ) : (
              <div className="text-center py-12">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">No cases found</p>
                <p className="text-gray-500 text-sm">Try adjusting your filters or check back later</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}