'use client'

import { Calendar, FileText, Heart, Activity, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'

export function PatientDashboard() {
  const { user } = useAuth()

  const quickStats = [
    {
      title: 'Next Appointment',
      value: 'Tomorrow 2:00 PM',
      icon: Calendar,
      color: 'text-blue-600 bg-blue-50',
      href: '/dashboard/patient/appointments'
    },
    {
      title: 'Active Exercises',
      value: '3 Programs',
      icon: Heart,
      color: 'text-green-600 bg-green-50',
      href: '/dashboard/patient/exercises'
    },
    {
      title: 'Progress Score',
      value: '85%',
      icon: Activity,
      color: 'text-purple-600 bg-purple-50',
      href: '/dashboard/patient/analytics'
    },
    {
      title: 'Pending Results',
      value: '2 Reports',
      icon: FileText,
      color: 'text-orange-600 bg-orange-50',
      href: '/dashboard/patient/records'
    }
  ]

  const recentActivities = [
    {
      title: 'Completed shoulder exercise routine',
      time: '2 hours ago',
      type: 'exercise'
    },
    {
      title: 'New lab results available',
      time: '1 day ago',
      type: 'report'
    },
    {
      title: 'Appointment scheduled with Dr. Smith',
      time: '3 days ago',
      type: 'appointment'
    }
  ]

  const upcomingTasks = [
    {
      title: 'Complete daily stretching routine',
      dueTime: 'Due in 2 hours',
      priority: 'high'
    },
    {
      title: 'Review new exercise program',
      dueTime: 'Due tomorrow',
      priority: 'medium'
    },
    {
      title: 'Schedule follow-up appointment',
      dueTime: 'Due this week',
      priority: 'low'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name.split(' ')[0]}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's your health summary and upcoming activities
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link
              key={index}
              href={stat.href}
              className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/dashboard/patient/activity" className="text-sm text-blue-600 hover:text-blue-800">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h2>
          </div>
          <div className="space-y-4">
            {upcomingTasks.map((task, index) => (
              <div key={index} className="p-3 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{task.dueTime}</p>
                  </div>
                  {task.priority === 'high' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/patient/tasks"
            className="block text-center text-sm text-blue-600 hover:text-blue-800 mt-4 pt-4 border-t"
          >
            View all tasks
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/patient/appointments"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Schedule Appointment</p>
              <p className="text-sm text-gray-600">Book your next visit</p>
            </div>
          </Link>
          <Link
            href="/dashboard/patient/exercises"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <Heart className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Start Exercise</p>
              <p className="text-sm text-gray-600">Begin your routine</p>
            </div>
          </Link>
          <Link
            href="/dashboard/patient/records"
            className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">View Records</p>
              <p className="text-sm text-gray-600">Access your history</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}