'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { 
  Search,
  UserPlus,
  User,
  Phone,
  Mail,
  Calendar,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { doctorApi } from '@/services/api'
import { PatientSearchResult } from '@/types/medical.types'

interface PatientSearchProps {
  onPatientSelect?: (patient: PatientSearchResult) => void
  showAddButton?: boolean
}

export function PatientSearch({ onPatientSelect, showAddButton = true }: PatientSearchProps) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  const handleSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await doctorApi.searchPatients({
        searchTerm: term,
        doctorId: undefined // Search all patients, not just assigned ones
      })
      setSearchResults(response.items)
      setShowResults(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, handleSearch])

  const handleAssignPatient = async (patient: PatientSearchResult) => {
    if (!user?.id) return

    try {
      await doctorApi.assignPatientToDoctor(user.id, patient.id)
      // Refresh search to update relationship status
      handleSearch(searchTerm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign patient')
    }
  }

  const getRelationshipStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success'
      case 'inactive': return 'bg-muted text-muted-foreground'
      case 'completed': return 'bg-secondary text-secondary-foreground'
      default: return 'bg-muted text-foreground'
    }
  }

  const getRelationshipStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by case ID, patient ID, or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {error ? (
            <div className="p-4 text-center">
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center">
              <User className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">No patients found</p>
              <p className="text-gray-500 text-xs mt-1">Try searching by case ID, patient ID, or name</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {searchResults.map((patient) => (
                <div
                  key={patient.id}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{patient.fullName}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRelationshipStatusColor(patient.relationshipStatus)}`}>
                          {getRelationshipStatusIcon(patient.relationshipStatus)}
                          <span className="ml-1 capitalize">{patient.relationshipStatus}</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1 text-gray-400" />
                          <span>ID: {patient.caseId}</span>
                        </div>
                        {patient.age && (
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                            <span>Age: {patient.age}</span>
                          </div>
                        )}
                        {patient.email && (
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 mr-1 text-gray-400" />
                            <span className="truncate">{patient.email}</span>
                          </div>
                        )}
                        {patient.phone && (
                          <div className="flex items-center">
                            <Phone className="w-3 h-3 mr-1 text-gray-400" />
                            <span>{patient.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center text-xs text-gray-500">
                        <span>Sessions: {patient.totalSessions}</span>
                        {patient.lastSession && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Last: {new Date(patient.lastSession).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      {onPatientSelect && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPatientSelect(patient)}
                        >
                          View
                        </Button>
                      )}
                      
                      {showAddButton && patient.relationshipStatus === 'unassigned' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignPatient(patient)}
                          className="text-primary border-border hover:bg-muted"
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {showResults && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  )
}