'use client'

import React, { useState, useEffect } from 'react'
import { 
  Users,
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Activity,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  MessageSquare
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function PatientsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

  // Mock patient data
  const patients = [
    {
      id: 'P-001',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      age: 34,
      injuryType: 'Shoulder Impingement',
      status: 'active',
      lastVisit: '2024-01-15',
      totalSessions: 8,
      nextAppointment: '2024-01-22',
      progress: 75,
      notes: 'Responding well to treatment, range of motion improving'
    },
    {
      id: 'P-002',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+1 (555) 234-5678',
      age: 28,
      injuryType: 'Lower Back Pain',
      status: 'active',
      lastVisit: '2024-01-14',
      totalSessions: 12,
      nextAppointment: '2024-01-21',
      progress: 60,
      notes: 'Core strengthening exercises showing good results'
    },
    {
      id: 'P-003',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@email.com',
      phone: '+1 (555) 345-6789',
      age: 45,
      injuryType: 'Knee Issues',
      status: 'completed',
      lastVisit: '2024-01-10',
      totalSessions: 15,
      nextAppointment: null,
      progress: 100,
      notes: 'Treatment completed successfully, patient discharged'
    },
    {
      id: 'P-004',
      name: 'David Thompson',
      email: 'david.thompson@email.com',
      phone: '+1 (555) 456-7890',
      age: 52,
      injuryType: 'Neck Pain',
      status: 'pending',
      lastVisit: '2024-01-08',
      totalSessions: 3,
      nextAppointment: '2024-01-20',
      progress: 25,
      notes: 'Initial assessment completed, starting treatment plan'
    },
    {
      id: 'P-005',
      name: 'Lisa Wang',
      email: 'lisa.wang@email.com',
      phone: '+1 (555) 567-8901',
      age: 31,
      injuryType: 'Hip Problems',
      status: 'active',
      lastVisit: '2024-01-12',
      totalSessions: 6,
      nextAppointment: '2024-01-19',
      progress: 45,
      notes: 'Hip mobility exercises progressing well'
    }
  ]

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const PatientCard = ({ patient }: { patient: any }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 font-semibold text-lg">
              {patient.name.split(' ').map((n: string) => n[0]).join('')}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
            <p className="text-sm text-gray-600">ID: {patient.id}</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
          {getStatusIcon(patient.status)}
          <span className="ml-1 capitalize">{patient.status}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="w-4 h-4 mr-2 text-gray-400" />
          <span className="truncate">{patient.email}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="w-4 h-4 mr-2 text-gray-400" />
          <span>{patient.phone}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
          <span>Age: {patient.age}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <FileText className="w-4 h-4 mr-2 text-gray-400" />
          <span>{patient.injuryType}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{patient.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${patient.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <span>Sessions: {patient.totalSessions}</span>
        <span>Last visit: {new Date(patient.lastVisit).toLocaleDateString()}</span>
      </div>

      {patient.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{patient.notes}</p>
        </div>
      )}

      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => window.location.href = `/dashboard/doctor/patients/${patient.id}`}
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <MessageSquare className="w-4 h-4 mr-2" />
          Message
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Patient Management
              </h1>
              <p className="text-gray-600">
                Manage your patients and track their progress
              </p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Cases</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => p.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => p.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="sessions">Sessions</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Patients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first patient'}
            </p>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
