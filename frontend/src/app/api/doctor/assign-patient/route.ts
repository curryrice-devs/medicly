import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

    if (!url || !serviceKey) {
      console.error('[api/doctor/assign-patient] Missing envs')
      return NextResponse.json({ error: 'Missing Supabase server env' }, { status: 500 })
    }

    const supabase = createClient(url, serviceKey)

    const body = await request.json()
    const { doctorId, patientId, notes } = body

    if (!doctorId || !patientId) {
      return NextResponse.json({ error: 'Doctor ID and Patient ID are required' }, { status: 400 })
    }

    // Verify doctor exists and has doctor role
    const { data: doctor, error: doctorError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', doctorId)
      .eq('role', 'doctor')
      .single()

    if (doctorError || !doctor) {
      console.error('[api/doctor/assign-patient] Doctor not found or invalid role:', doctorError)
      return NextResponse.json({ error: 'Invalid doctor ID' }, { status: 400 })
    }

    // Verify patient exists and has client role
    const { data: patient, error: patientError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', patientId)
      .eq('role', 'client')
      .single()

    if (patientError || !patient) {
      console.error('[api/doctor/assign-patient] Patient not found or invalid role:', patientError)
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 })
    }

    // Check if relationship already exists
    const { data: existingRelationship, error: existingError } = await supabase
      .from('doctor_patient_relationships')
      .select('id, status')
      .eq('doctor_id', doctorId)
      .eq('patient_id', patientId)
      .single()

    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[api/doctor/assign-patient] Error checking existing relationship:', existingError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    let relationship

    if (existingRelationship) {
      // Update existing relationship to active
      const { data: updatedRelationship, error: updateError } = await supabase
        .from('doctor_patient_relationships')
        .update({
          status: 'active',
          notes: notes || null,
          assigned_at: new Date().toISOString()
        })
        .eq('id', existingRelationship.id)
        .select()
        .single()

      if (updateError) {
        console.error('[api/doctor/assign-patient] Error updating relationship:', updateError)
        return NextResponse.json({ error: 'Failed to update relationship' }, { status: 500 })
      }

      relationship = updatedRelationship
    } else {
      // Create new relationship
      const { data: newRelationship, error: createError } = await supabase
        .from('doctor_patient_relationships')
        .insert({
          doctor_id: doctorId,
          patient_id: patientId,
          status: 'active',
          notes: notes || null,
          assigned_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('[api/doctor/assign-patient] Error creating relationship:', createError)
        return NextResponse.json({ error: 'Failed to create relationship' }, { status: 500 })
      }

      relationship = newRelationship
    }

    return NextResponse.json({
      success: true,
      relationship
    }, { status: 200 })

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[api/doctor/assign-patient] unexpected error:', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
