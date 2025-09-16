import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

    if (!url) {
      console.error('[api/doctor/all-patients] Missing Supabase URL')
      return NextResponse.json({ error: 'Missing Supabase URL' }, { status: 500 })
    }

    // Use service key if available, otherwise fall back to anon key with RLS
    const key = serviceKey || anonKey
    if (!key) {
      console.error('[api/doctor/all-patients] Missing both service and anon keys')
      return NextResponse.json({ error: 'Missing Supabase keys' }, { status: 500 })
    }

    const supabase = createClient(url, key)

    // First, fetch all patient profiles (not filtered by sessions)
    const { data: patientProfiles, error: profilesError } = await supabase
      .from('patient_profiles')
      .select('id, case_id, full_name, email, phone, age')
      .order('full_name')

    if (profilesError) {
      console.error('[api/doctor/all-patients] profiles error:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    if (!patientProfiles || patientProfiles.length === 0) {
      console.log('[api/doctor/all-patients] No patient profiles found')
      return NextResponse.json({ patients: [] }, { status: 200 })
    }

    // Now fetch all sessions to enrich patient data
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('sessions')
      .select('patient_id, created_at, status')
      .order('created_at', { ascending: false })

    if (sessionsError) {
      console.warn('[api/doctor/all-patients] sessions error (non-fatal):', sessionsError)
    }

    // Group sessions by patient ID for aggregation
    const sessionsByPatient = new Map()
    if (sessionsData) {
      sessionsData.forEach(session => {
        const patientId = session.patient_id
        if (!sessionsByPatient.has(patientId)) {
          sessionsByPatient.set(patientId, [])
        }
        sessionsByPatient.get(patientId).push(session)
      })
    }

    // Map all patient profiles and enrich with session data
    const mappedPatients = patientProfiles.map(profile => {
      const patientSessions = sessionsByPatient.get(profile.id) || []

      // Calculate session statistics
      const totalSessions = patientSessions.length
      const lastSession = patientSessions.length > 0
        ? patientSessions[0].created_at // Sessions are ordered by created_at desc
        : null
      const assignedAt = patientSessions.length > 0
        ? patientSessions[patientSessions.length - 1].created_at // First session
        : null

      return {
        id: profile.id,
        caseId: profile.case_id,
        fullName: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        age: profile.age,
        relationshipStatus: totalSessions > 0 ? 'active' : 'unassigned',
        assignedAt,
        lastSession,
        totalSessions
      }
    })

    console.log(`[api/doctor/all-patients] Returning ${mappedPatients.length} patients`)

    return NextResponse.json({
      patients: mappedPatients
    }, { status: 200 })

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[api/doctor/all-patients] unexpected error', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}