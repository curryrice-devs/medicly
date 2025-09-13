'use client'

import React from 'react'
import { 
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Activity,
  Calendar
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export default function AnalyticsPage() {
  const { user } = useAuth()

  // Mock analytics data - in real app this would come from API
  const analyticsData = {
    totalCases: 156,
    completedCases: 142,
    pendingCases: 14,
    averageReviewTime: 18, // minutes
    casesThisWeek: 23,
    casesLastWeek: 19,
    weeklyGrowth: 21, // percentage
    monthlyCases: 67,
    patientSatisfaction: 4.8,
    aiAccuracy: 94.2
  }

  const weeklyData = [
    { day: 'Mon', cases: 8, completed: 7 },
    { day: 'Tue', cases: 12, completed: 11 },
    { day: 'Wed', cases: 15, completed: 14 },
    { day: 'Thu', cases: 10, completed: 9 },
    { day: 'Fri', cases: 18, completed: 16 },
    { day: 'Sat', cases: 6, completed: 5 },
    { day: 'Sun', cases: 4, completed: 3 }
  ]

  const injuryTypeData = [
    { type: 'Shoulder Impingement', count: 45, percentage: 28.8 },
    { type: 'Lower Back Pain', count: 38, percentage: 24.4 },
    { type: 'Knee Issues', count: 32, percentage: 20.5 },
    { type: 'Neck Pain', count: 25, percentage: 16.0 },
    { type: 'Hip Problems', count: 16, percentage: 10.3 }
  ]

  const StatCard = ({ title, value, icon: Icon, change, changeType = 'neutral' }: {
    title: string
    value: string | number
    icon: React.ComponentType<{ className?: string }>
    change?: string
    changeType?: 'positive' | 'negative' | 'neutral'
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-green-600" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Performance metrics and insights for Dr. {user?.name?.split(' ')[1] || user?.name?.split(' ')[0]}
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Cases"
            value={analyticsData.totalCases}
            icon={BarChart3}
            change="+12% from last month"
            changeType="positive"
          />
          <StatCard
            title="Completion Rate"
            value={`${Math.round((analyticsData.completedCases / analyticsData.totalCases) * 100)}%`}
            icon={CheckCircle}
            change="+3% from last month"
            changeType="positive"
          />
          <StatCard
            title="Avg Review Time"
            value={`${analyticsData.averageReviewTime}m`}
            icon={Clock}
            change="-2m from last month"
            changeType="positive"
          />
          <StatCard
            title="Patient Satisfaction"
            value={analyticsData.patientSatisfaction}
            icon={Users}
            change="+0.2 from last month"
            changeType="positive"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Weekly Cases Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Cases</h3>
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{analyticsData.weeklyGrowth}% from last week
              </div>
            </div>
            
            <div className="space-y-4">
              {weeklyData.map((day, index) => (
                <div key={day.day} className="flex items-center">
                  <div className="w-12 text-sm font-medium text-gray-600">{day.day}</div>
                  <div className="flex-1 mx-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(day.completed / day.cases) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-16 text-right">
                        {day.completed}/{day.cases}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Injury Types Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Cases by Injury Type</h3>
            
            <div className="space-y-4">
              {injuryTypeData.map((injury, index) => (
                <div key={injury.type} className="flex items-center">
                  <div className="w-32 text-sm font-medium text-gray-600 truncate">
                    {injury.type}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${injury.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {injury.count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* AI Performance */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <Activity className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">AI Performance</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Accuracy Rate</span>
                <span className="font-semibold text-gray-900">{analyticsData.aiAccuracy}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Confidence Score</span>
                <span className="font-semibold text-gray-900">4.2/5.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">False Positives</span>
                <span className="font-semibold text-gray-900">2.1%</span>
              </div>
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">This Month</span>
                <span className="font-semibold text-gray-900">{analyticsData.monthlyCases} cases</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Month</span>
                <span className="font-semibold text-gray-900">58 cases</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Growth</span>
                <span className="font-semibold text-green-600">+15.5%</span>
              </div>
            </div>
          </div>

          {/* Alerts & Notifications */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>High Priority:</strong> 3 cases pending review for over 24 hours
                </p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Update:</strong> AI model accuracy improved to 94.2%
                </p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Success:</strong> Patient satisfaction score increased
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
