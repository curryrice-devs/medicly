import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { action, ...data } = await request.json()

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

    if (!url || !serviceKey) {
      console.error('[api/doctor/cases] Missing envs')
      return NextResponse.json({ error: 'Missing Supabase server env' }, { status: 500 })
    }

    const supabase = createClient(url, serviceKey)

    switch (action) {
      case 'status':
        return await updateCaseStatus(supabase, id, data)
      case 'exercise':
        return await updateExercise(supabase, id, data)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[api/doctor/cases] unexpected error', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

async function updateCaseStatus(supabase: any, id: string, data: any) {
  const { status, notes } = data

  console.log('[updateCaseStatus] received data:', { status, notes, id })

  const updateData: any = {
    status: status
  }

  // Add notes to ai_evaluation field if provided
  if (notes) {
    updateData.ai_evaluation = notes
  }

  console.log('[updateCaseStatus] updating with data:', updateData)

  const { data: result, error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', parseInt(id))
    .select()

  if (error) {
    console.error('[updateCaseStatus] database error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    return NextResponse.json({
      error: error.message,
      details: error.details,
      hint: error.hint
    }, { status: 500 })
  }

  console.log('[updateCaseStatus] success', result)
  return NextResponse.json({ success: true, data: result }, { status: 200 })
}

async function updateExercise(supabase: any, id: string, data: any) {
  const updateData: any = {}

  // Only update fields that exist in the sessions table
  if (data.sets) updateData.exercise_sets = data.sets
  if (data.reps) updateData.exercise_reps = data.reps
  if (data.exerciseId) updateData.treatment_id = data.exerciseId

  // Store other data in ai_evaluation for now
  if (data.notes || data.frequency) {
    const existingEval = await supabase
      .from('sessions')
      .select('ai_evaluation')
      .eq('id', parseInt(id))
      .single()

    let evalData = existingEval.data?.ai_evaluation || ''
    if (data.frequency) evalData += ` | Frequency: ${data.frequency}`
    if (data.notes) evalData += ` | Notes: ${data.notes}`
    updateData.ai_evaluation = evalData
  }

  const { data: result, error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', parseInt(id))
    .select()

  if (error) {
    console.error('[updateExercise] error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('[updateExercise] success', result)
  return NextResponse.json({ success: true, data: result }, { status: 200 })
}