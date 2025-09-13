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

    if (!url || !serviceKey) {
      console.error('[api/doctor/patient-profile] Missing envs', { hasUrl: !!url, hasServiceKey: !!serviceKey })
      return NextResponse.json({ error: 'Missing Supabase server env' }, { status: 500 })
    }

    const supabase = createClient(url, serviceKey)

    const { data: profile, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[api/doctor/patient-profile] profile error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[api/doctor/patient-profile] unexpected error', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}