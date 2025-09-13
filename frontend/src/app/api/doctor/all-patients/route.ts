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

    // Fetch all patient profiles
    const { data: patients, error: patientsError } = await supabase
      .from('patient_profiles')
      .select('*')
      .order('full_name')

    if (patientsError) {
      console.error('[api/doctor/all-patients] patients error:', patientsError)
      return NextResponse.json({ error: patientsError.message }, { status: 500 })
    }

    // Fetch all doctor-patient relationships to determine assignment status
    const { data: relationships, error: relationshipsError } = await supabase
      .from('doctor_patient_relationships')
      .select('doctor_id, patient_id, status, assigned_at')

    if (relationshipsError) {
      console.error('[api/doctor/all-patients] relationships error:', relationshipsError)
      // Continue without relationships data
    }

    // Create a map of patient relationships
    const relationshipsMap = new Map()
    if (relationships) {
      relationships.forEach(rel => {
        relationshipsMap.set(rel.patient_id, rel)
      })
    }

    // Map patients with relationship info and proper field mapping
    const mappedPatients = (patients || []).map(patient => {
      const relationship = relationshipsMap.get(patient.id)

      return {
        id: patient.id,
        case_id: patient.case_id,
        full_name: patient.full_name,
        email: patient.email,
        phone: patient.phone,
        age: patient.age,
        relationship_status: relationship ? relationship.status : 'unassigned',
        assigned_at: relationship ? relationship.assigned_at : null,
        last_session: null, // Could be enhanced with session data
        total_sessions: 0   // Could be enhanced with session data
      }
    })

    return NextResponse.json({
      patients: mappedPatients
    }, { status: 200 })

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[api/doctor/all-patients] unexpected error', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}