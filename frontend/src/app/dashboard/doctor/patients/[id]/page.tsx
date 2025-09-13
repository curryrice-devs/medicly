'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Activity, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Edit,
  Download,
  Share2,
  Heart,
  Bone,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BioDigitalViewer } from '@/components/BioDigitalViewer'
import { BreadcrumbNav } from '@/components/layout/breadcrumb-nav'

// Mock patient data with problematic areas
const mockPatientData = {
  'P-001': {
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
    notes: 'Responding well to treatment, range of motion improving',
    problematicAreas: [
      {
        id: 'femur_right',
        name: 'Right Femur',
        severity: 'high',
        description: 'Limited range of motion, pain during movement',
        color: { r: 1, g: 0, b: 0 }, // Red
        opacity: 0.8
      },
      {
        id: 'tibia_right',
        name: 'Right Tibia',
        severity: 'medium',
        description: 'Bone stress and inflammation',
        color: { r: 1, g: 0.5, b: 0 }, // Orange
        opacity: 0.6
      }
    ],
    medicalHistory: [
      'Previous shoulder injury (2022)',
      'Rotator cuff tear (2021)',
      'Physical therapy completed (2021)'
    ],
    currentMedications: [
      'Ibuprofen 400mg as needed',
      'Physical therapy exercises daily'
    ],
    vitalSigns: {
      bloodPressure: '120/80',
      heartRate: '72 bpm',
      temperature: '98.6°F',
      weight: '140 lbs'
    }
  },
  'P-002': {
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
    notes: 'Core strengthening exercises showing good results',
    problematicAreas: [
      {
        id: 'patella_right',
        name: 'Right Patella',
        severity: 'high',
        description: 'Knee cap pain and inflammation',
        color: { r: 1, g: 0, b: 0 }, // Red
        opacity: 0.8
      },
      {
        id: 'fibula_right',
        name: 'Right Fibula',
        severity: 'medium',
        description: 'Bone stress and muscle tension',
        color: { r: 1, g: 0.5, b: 0 }, // Orange
        opacity: 0.6
      }
    ],
    medicalHistory: [
      'Sitting job, 8+ hours daily',
      'Previous back strain (2023)',
      'No previous surgeries'
    ],
    currentMedications: [
      'Muscle relaxants as needed',
      'Core strengthening routine'
    ],
    vitalSigns: {
      bloodPressure: '118/75',
      heartRate: '68 bpm',
      temperature: '98.4°F',
      weight: '165 lbs'
    }
  },
  'P-003': {
    id: 'P-003',
    name: 'Mike Wilson',
    email: 'mike.wilson@email.com',
    phone: '+1 (555) 987-6543',
    age: 52,
    injuryType: 'Shoulder Impingement',
    status: 'active',
    lastVisit: '2024-01-16',
    totalSessions: 6,
    nextAppointment: '2024-01-23',
    progress: 40,
    notes: 'Shoulder and arm issues from repetitive work',
    problematicAreas: [
      {
        id: 'deltoid_right',
        name: 'Right Deltoid',
        severity: 'high',
        description: 'Shoulder muscle strain and weakness',
        color: { r: 1, g: 0, b: 0 }, // Red
        opacity: 0.8
      },
      {
        id: 'biceps_right',
        name: 'Right Biceps',
        severity: 'medium',
        description: 'Muscle tension and inflammation',
        color: { r: 1, g: 0.5, b: 0 }, // Orange
        opacity: 0.6
      }
    ],
    medicalHistory: [
      'Factory worker, repetitive arm movements',
      'Previous shoulder surgery (2020)',
      'Workers compensation case'
    ],
    currentMedications: [
      'Anti-inflammatory medication',
      'Muscle relaxants as needed'
    ],
    sessions: [
      { id: 'S-007', date: '2024-01-16', duration: 55, status: 'completed' },
      { id: 'S-008', date: '2024-01-09', duration: 45, status: 'completed' },
      { id: 'S-009', date: '2024-01-03', duration: 50, status: 'completed' }
    ],
    vitalSigns: {
      bloodPressure: '125/80',
      heartRate: '72 bpm',
      temperature: '98.2°F',
      weight: '185 lbs'
    }
  },
  'P-004': {
    id: 'P-004',
    name: 'Lisa Brown',
    email: 'lisa.brown@email.com',
    phone: '+1 (555) 456-7890',
    age: 29,
    injuryType: 'Lower Back Pain',
    status: 'active',
    lastVisit: '2024-01-17',
    totalSessions: 4,
    nextAppointment: '2024-01-24',
    progress: 25,
    notes: 'Lower back pain from poor posture',
    problematicAreas: [
      {
        id: 'lumbar_vertebrae',
        name: 'Lumbar Spine',
        severity: 'high',
        description: 'Chronic lower back pain and stiffness',
        color: { r: 1, g: 0, b: 0 }, // Red
        opacity: 0.8
      },
      {
        id: 'erector_spinae',
        name: 'Erector Spinae',
        severity: 'medium',
        description: 'Muscle spasms and tightness',
        color: { r: 1, g: 0.5, b: 0 }, // Orange
        opacity: 0.6
      }
    ],
    medicalHistory: [
      'Office worker, 10+ hours daily',
      'No previous injuries',
      'First time physical therapy'
    ],
    currentMedications: [
      'Pain management as needed',
      'Posture correction routine'
    ],
    sessions: [
      { id: 'S-010', date: '2024-01-17', duration: 40, status: 'completed' },
      { id: 'S-011', date: '2024-01-11', duration: 35, status: 'completed' },
      { id: 'S-012', date: '2024-01-06', duration: 45, status: 'completed' }
    ],
    vitalSigns: {
      bloodPressure: '110/70',
      heartRate: '65 bpm',
      temperature: '98.5°F',
      weight: '135 lbs'
    }
  }
}

export default function PatientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params?.id as string
  const [activeTab, setActiveTab] = useState('overview')
  
  const patient = mockPatientData[patientId as keyof typeof mockPatientData]

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Not Found</h1>
            <p className="text-gray-600 mb-6">The requested patient could not be found.</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Ensure all required arrays exist
  const safePatient = {
    ...patient,
    problematicAreas: patient.problematicAreas || [],
    medicalHistory: patient.medicalHistory || [],
    currentMedications: patient.currentMedications || [],
    sessions: patient.sessions || []
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard/doctor' },
    { label: 'Patients', href: '/dashboard/doctor/patients' },
    { label: safePatient.name, href: `/dashboard/doctor/patients/${safePatient.id}` }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <BreadcrumbNav items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold text-xl">
                  {safePatient.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {safePatient.name}
                </h1>
                <p className="text-gray-600">
                  Patient ID: {safePatient.id} • {safePatient.injuryType}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge className={`${getStatusColor(safePatient.status)} border`}>
                {safePatient.status}
              </Badge>
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="anatomy">3D Anatomy</TabsTrigger>
            <TabsTrigger value="history">Medical History</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Patient Info */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-3 text-gray-400" />
                      <span>{safePatient.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-3 text-gray-400" />
                      <span>{safePatient.phone}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                      <span>Age: {safePatient.age} years</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Activity className="w-4 h-4 mr-3 text-gray-400" />
                      <span>Status: {safePatient.status}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Heart className="w-5 h-5 mr-2" />
                      Vital Signs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Blood Pressure</span>
                      <span className="text-sm font-medium">{safePatient.vitalSigns.bloodPressure}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Heart Rate</span>
                      <span className="text-sm font-medium">{safePatient.vitalSigns.heartRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Temperature</span>
                      <span className="text-sm font-medium">{safePatient.vitalSigns.temperature}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Weight</span>
                      <span className="text-sm font-medium">{safePatient.vitalSigns.weight}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress and Problematic Areas */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Progress Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Treatment Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Overall Progress</span>
                        <span>{safePatient.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-500 h-3 rounded-full transition-all duration-300" 
                          style={{ width: `${safePatient.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Sessions Completed:</span>
                        <span className="ml-2 font-medium">{safePatient.totalSessions}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Visit:</span>
                        <span className="ml-2 font-medium">{new Date(safePatient.lastVisit).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Next Appointment:</span>
                        <span className="ml-2 font-medium">
                          {safePatient.nextAppointment ? new Date(safePatient.nextAppointment).toLocaleDateString() : 'None scheduled'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Problematic Areas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bone className="w-5 h-5 mr-2" />
                      Problematic Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(safePatient.problematicAreas || []).map((area, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ 
                                backgroundColor: `rgb(${area.color.r * 255}, ${area.color.g * 255}, ${area.color.b * 255})`,
                                opacity: area.opacity
                              }}
                            />
                            <div>
                              <p className="font-medium text-gray-900">{area.name}</p>
                              <p className="text-sm text-gray-600">{area.description}</p>
                            </div>
                          </div>
                          <Badge className={`${getSeverityColor(area.severity)} border`}>
                            {area.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Clinical Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{safePatient.notes}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* 3D Anatomy Tab */}
          <TabsContent value="anatomy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bone className="w-5 h-5 mr-2" />
                  3D Anatomical View
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Interactive 3D model showing problematic areas highlighted in color
                </p>
              </CardHeader>
              <CardContent>
            <BioDigitalViewer 
              problematicAreas={safePatient.problematicAreas} 
              patientId={safePatient.id}
              patientInfo={{
                name: safePatient.name,
                age: safePatient.age,
                gender: safePatient.gender,
                injuryType: safePatient.injuryType
              }}
            />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical History Tab */}
          <TabsContent value="history">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Medical History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(safePatient.medicalHistory || []).map((item, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Medications</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(safePatient.currentMedications || []).map((med, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{med}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Sessions History</CardTitle>
                <p className="text-sm text-gray-600">
                  Track all therapy sessions and progress
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sessions Coming Soon</h3>
                  <p className="text-gray-600">
                    Detailed session history will be available here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
