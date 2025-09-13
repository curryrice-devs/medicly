import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

    if (!url || !serviceKey) {
      console.error('[api/doctor/patients] Missing envs')
      return NextResponse.json({ error: 'Missing Supabase server env' }, { status: 500 })
    }

    const supabase = createClient(url, serviceKey)

    // Get URL parameters
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')

    if (!doctorId) {
      return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 })
    }

    // Fetch patients assigned to this doctor with relationship status
    const { data: relationships, error: relationshipError } = await supabase
      .from('doctor_patient_relationships')
      .select(`
        id,
        patient_id,
        status,
        assigned_at,
        notes,
        profiles!doctor_patient_relationships_patient_id_fkey (
          id,
          full_name,
          email,
          phone,
          age,
          gender
        )
      `)
      .eq('doctor_id', doctorId)
      .order('assigned_at', { ascending: false })

    if (relationshipError) {
      console.error('[api/doctor/patients] relationship error:', relationshipError)
      return NextResponse.json({ error: relationshipError.message }, { status: 500 })
    }

    // Get session statistics for each patient
    const patientIds = relationships?.map(r => r.patient_id) || []
    let sessionsData: { patient_id: string; status: string; created_at: string }[] = []

    if (patientIds.length > 0) {
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('patient_id, status, created_at')
        .in('patient_id', patientIds)

      if (sessionsError) {
        console.error('[api/doctor/patients] sessions error:', sessionsError)
      } else {
        sessionsData = sessions || []
      }
    }

    // Calculate stats for each patient
    const patients = relationships?.map(relationship => {
      const patient = relationship.profiles
      const patientSessions = sessionsData.filter(s => s.patient_id === relationship.patient_id)

      // Calculate patient statistics
      const totalSessions = patientSessions.length
      const activeSessions = patientSessions.filter(s => s.status === 'active').length
      const completedSessions = patientSessions.filter(s => s.status === 'completed').length
      const lastSessionDate = patientSessions.length > 0
        ? new Date(Math.max(...patientSessions.map(s => new Date(s.created_at).getTime())))
        : null

      // Calculate progress (completed sessions / total sessions)
      const progress = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

      // Determine primary injury type from most recent session or default
      const injuryType = 'Physical Therapy' // Could be enhanced to derive from sessions/AI analysis

      return {
        id: patient?.id || relationship.patient_id,
        name: patient?.full_name || 'Unknown Patient',
        email: patient?.email || '',
        phone: patient?.phone || '',
        age: patient?.age || null,
        gender: patient?.gender || null,
        injuryType,
        status: relationship.status, // from doctor_patient_relationships
        assignedAt: relationship.assigned_at,
        totalSessions,
        activeSessions,
        completedSessions,
        lastSessionDate: lastSessionDate?.toISOString() || null,
        progress,
        notes: relationship.notes,
        relationshipId: relationship.id
      }
    }) || []

    // Calculate summary statistics
    const stats = {
      totalPatients: patients.length,
      activePatients: patients.filter(p => p.status === 'active').length,
      inactivePatients: patients.filter(p => p.status === 'inactive').length,
      completedPatients: patients.filter(p => p.status === 'completed').length,
      totalSessions: patients.reduce((sum, p) => sum + p.totalSessions, 0),
      totalActiveSessions: patients.reduce((sum, p) => sum + p.activeSessions, 0)
    }

    return NextResponse.json({
      patients,
      stats,
      count: patients.length
    }, { status: 200 })

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[api/doctor/patients] unexpected error', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}