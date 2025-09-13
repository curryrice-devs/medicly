import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[api/doctor/cases] PUT request received for ID:', params?.id)

    const { id } = params
    if (!id) {
      console.error('[api/doctor/cases] Missing ID parameter')
      return NextResponse.json({ error: 'Missing case ID' }, { status: 400 })
    }

    let requestData
    try {
      requestData = await request.json()
    } catch (jsonError) {
      console.error('[api/doctor/cases] Invalid JSON in request body:', jsonError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { action, ...data } = requestData
    console.log('[api/doctor/cases] Parsed request:', { action, data })

    if (!action) {
      console.error('[api/doctor/cases] Missing action parameter')
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

    if (!url || !serviceKey) {
      console.error('[api/doctor/cases] Missing envs - url:', !!url, 'serviceKey:', !!serviceKey)
      return NextResponse.json({ error: 'Missing Supabase server env' }, { status: 500 })
    }

    const supabase = createClient(url, serviceKey)

    switch (action) {
      case 'status':
        return await updateCaseStatus(supabase, id, data)
      case 'exercise':
        return await updateExercise(supabase, id, data)
      default:
        console.error('[api/doctor/cases] Invalid action:', action)
        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[api/doctor/cases] unexpected error:', e)
    return NextResponse.json({
      error: 'Internal server error',
      details: msg,
      stack: e instanceof Error ? e.stack : undefined
    }, { status: 500 })
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
  try {
    console.log('[updateExercise] received data:', { id, data })

    const updateData: any = {}

    // Validate session ID
    const sessionId = parseInt(id)
    if (isNaN(sessionId)) {
      console.error('[updateExercise] Invalid session ID:', id)
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })
    }

    // Update session table fields that exist
    if (data.sets !== undefined) updateData.exercise_sets = parseInt(data.sets) || 3
    if (data.reps !== undefined) updateData.exercise_reps = parseInt(data.reps) || 8
    if (data.exerciseId) updateData.treatment_id = parseInt(data.exerciseId) || null
    if (data.durationWeeks !== undefined) updateData.exercise_duration_in_weeks = parseInt(data.durationWeeks) || 4

    // Handle frequency conversion more safely
    if (data.frequency) {
      let frequencyDaily = 1
      const freq = String(data.frequency).toLowerCase()
      if (freq.includes('daily')) frequencyDaily = 1
      else if (freq.includes('3') || freq === '3x/week') frequencyDaily = 3
      else if (freq.includes('2') || freq === '2x/week') frequencyDaily = 2
      else if (freq.includes('weekly') && !freq.includes('daily')) frequencyDaily = 1
      updateData.exercise_frequency_daily = frequencyDaily
    }

    console.log('[updateExercise] updateData before database:', updateData)

    // Only try to update ai_evaluation if we have exercise metadata
    if (data.exerciseName || data.exerciseDescription || data.instructions) {
      try {
        const { data: existingSession, error: fetchError } = await supabase
          .from('sessions')
          .select('ai_evaluation')
          .eq('id', sessionId)
          .single()

        if (fetchError) {
          console.warn('[updateExercise] Could not fetch existing evaluation:', fetchError.message)
        }

        let evalData = existingSession?.ai_evaluation || ''

        // Append exercise updates to existing evaluation
        const exerciseUpdate = {
          exerciseName: data.exerciseName,
          exerciseDescription: data.exerciseDescription,
          instructions: data.instructions,
          updatedAt: new Date().toISOString()
        }

        evalData += ` | Exercise Updated: ${JSON.stringify(exerciseUpdate)}`
        updateData.ai_evaluation = evalData
      } catch (evalError) {
        console.warn('[updateExercise] Failed to update ai_evaluation:', evalError)
        // Continue without updating ai_evaluation
      }
    }

    console.log('[updateExercise] Final updateData:', updateData)

    const { data: result, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()

    if (error) {
      console.error('[updateExercise] database error:', {
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

    console.log('[updateExercise] success:', result)
    return NextResponse.json({ success: true, data: result }, { status: 200 })

  } catch (error) {
    console.error('[updateExercise] unexpected error:', error)
    return NextResponse.json({
      error: 'Unexpected server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}