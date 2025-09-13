import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

    if (!url) {
      console.error('[api/doctor/sessions] Missing Supabase URL')
      return NextResponse.json({ error: 'Missing Supabase URL' }, { status: 500 })
    }

    // Use service key if available, otherwise fall back to anon key with RLS
    const key = serviceKey || anonKey
    if (!key) {
      console.error('[api/doctor/sessions] Missing both service and anon keys')
      return NextResponse.json({ error: 'Missing Supabase keys' }, { status: 500 })
    }

    const supabase = createClient(url, key)

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        id,
        created_at,
        patient_id,
        doctor_id,
        status,
        due_date,
        treatment_id,
        ai_evaluation,
        exercise_sets,
        exercise_reps,
        exercise_weight,
        previdurl,
        postvidurl,
        patient_notes,
        doctor_feedback,
        profiles!sessions_patient_id_fkey (
          id,
          patient_profiles (
            id,
            full_name,
            email,
            phone,
            age,
            case_id
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('[api/doctor/sessions] sessions error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const treatmentIds = Array.from(new Set((sessions || []).map(s => s.treatment_id).filter((v): v is number => !!v)))
    let treatmentsById: Record<number, { id: number; video_link: string | null; description: string | null; name: string | null }> = {}
    if (treatmentIds.length > 0) {
      const { data: treatments, error: trError } = await supabase
        .from('treatments')
        .select('id, video_link, description, name')
        .in('id', treatmentIds)
      if (trError) {
        console.error('[api/doctor/sessions] treatments error', trError)
      }
      if (!trError && treatments) {
        treatmentsById = Object.fromEntries(treatments.map(t => [t.id, t]))
      }
    }

    return NextResponse.json({ sessions: sessions || [], treatmentsById }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[api/doctor/sessions] unexpected error', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


