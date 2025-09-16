import { NextRequest } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const patientData = await request.json()

    console.log('📝 Creating patient profile:', patientData)

    // Generate a unique case ID
    const caseId = `P-${Date.now().toString().slice(-6).padStart(6, '0')}`

    const { data, error } = await supabase
      .from('patient_profiles')
      .insert({
        case_id: caseId,
        full_name: patientData.full_name,
        email: patientData.email,
        phone: patientData.phone,
        age: patientData.age,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating patient profile:', error)
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Created patient profile:', data)

    return Response.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('❌ Error in patient profiles POST:', error)
    return Response.json(
      { success: false, error: 'Failed to create patient profile' },
      { status: 500 }
    )
  }
}