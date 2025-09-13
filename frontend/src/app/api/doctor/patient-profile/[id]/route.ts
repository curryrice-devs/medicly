import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

    if (!url) {
      console.error('[api/doctor/patient-profile] Missing Supabase URL')
      return NextResponse.json({ error: 'Missing Supabase URL' }, { status: 500 })
    }

    // Use service key if available, otherwise fall back to anon key with RLS
    const key = serviceKey || anonKey
    if (!key) {
      console.error('[api/doctor/patient-profile] Missing both service and anon keys')
      return NextResponse.json({ error: 'Missing Supabase keys' }, { status: 500 })
    }

    const supabase = createClient(url, key)

    const { data: profile, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[api/doctor/patient-profile] profile error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Map snake_case database fields to camelCase for API response
    const mappedProfile = {
      id: profile.id,
      caseId: profile.case_id,
      fullName: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      age: profile.age,
      gender: profile.gender,
      address: profile.address,
      emergencyContactName: profile.emergency_contact_name,
      emergencyContactPhone: profile.emergency_contact_phone,
      medicalHistory: profile.medical_history || [],
      currentMedications: profile.current_medications || [],
      allergies: profile.allergies || [],
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    }

    return NextResponse.json({ profile: mappedProfile }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[api/doctor/patient-profile] unexpected error', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}