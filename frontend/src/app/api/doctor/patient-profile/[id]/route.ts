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
      .from('profiles')
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

    // Map profiles table fields to expected PatientProfile structure
    const mappedProfile = {
      id: profile.id,
      caseId: profile.id, // Use profile id as case id
      fullName: profile.name || 'Unknown Patient',
      email: undefined, // Not available in profiles table
      phone: undefined, // Not available in profiles table
      age: undefined, // Not available in profiles table
      gender: undefined, // Not available in profiles table
      address: undefined, // Not available in profiles table
      emergencyContactName: undefined, // Not available in profiles table
      emergencyContactPhone: undefined, // Not available in profiles table
      medicalHistory: [], // Not available in profiles table
      currentMedications: [], // Not available in profiles table
      allergies: [], // Not available in profiles table
      createdAt: profile.created_at,
      updatedAt: profile.created_at // Use created_at for both since we don't have updated_at
    }

    return NextResponse.json({ profile: mappedProfile }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[api/doctor/patient-profile] unexpected error', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}