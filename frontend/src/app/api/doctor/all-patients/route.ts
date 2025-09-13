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

    // First, fetch all sessions
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('sessions')
      .select('patient_id, created_at, status')
      .order('created_at', { ascending: false })

    if (sessionsError) {
      console.error('[api/doctor/all-patients] sessions error:', sessionsError)
      return NextResponse.json({ error: sessionsError.message }, { status: 500 })
    }

    // Get unique patient IDs from sessions
    const patientIds = [...new Set(sessionsData?.map(s => s.patient_id) || [])]

    if (patientIds.length === 0) {
      console.log('[api/doctor/all-patients] No sessions found')
      return NextResponse.json({ patients: [] }, { status: 200 })
    }

    // Fetch patient profiles for those IDs
    const { data: patientProfiles, error: profilesError } = await supabase
      .from('patient_profiles')
      .select('id, case_id, full_name, email, phone, age')
      .in('id', patientIds)

    if (profilesError) {
      console.error('[api/doctor/all-patients] profiles error:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Create a map of profiles for easy lookup
    const profilesMap = new Map()
    if (patientProfiles) {
      patientProfiles.forEach(profile => {
        profilesMap.set(profile.id, profile)
      })
    }

    // Group sessions by patient and aggregate data
    const patientsMap = new Map()

    if (sessionsData) {
      sessionsData.forEach(session => {
        const patientId = session.patient_id
        const profile = profilesMap.get(patientId)

        if (!profile) return

        if (patientsMap.has(patientId)) {
          // Update existing patient data
          const existing = patientsMap.get(patientId)
          existing.totalSessions += 1

          // Update last session if this one is more recent
          if (new Date(session.created_at) > new Date(existing.lastSession)) {
            existing.lastSession = session.created_at
          }
        } else {
          // Create new patient entry
          patientsMap.set(patientId, {
            id: profile.id,
            caseId: profile.case_id,
            fullName: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            age: profile.age,
            relationshipStatus: 'active', // Default to active since they have sessions
            assignedAt: session.created_at,
            lastSession: session.created_at,
            totalSessions: 1
          })
        }
      })
    }

    // Convert map to array and sort by name
    const mappedPatients = Array.from(patientsMap.values()).sort((a, b) =>
      (a.fullName || '').localeCompare(b.fullName || '')
    )

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