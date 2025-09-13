import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { sessionId, affectedModelUrl, exerciseModelUrls } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    console.log('💾 Saving BioDigital URLs for session:', sessionId)
    console.log('📊 Affected model URL:', affectedModelUrl)
    console.log('🏃 Exercise model URLs:', exerciseModelUrls)

    // Prepare update object - only update fields that have values
    const updateData: any = {}
    
    if (affectedModelUrl) {
      updateData.affected_model = affectedModelUrl
    }
    
    if (exerciseModelUrls && exerciseModelUrls.length > 0) {
      updateData.exercise_models = exerciseModelUrls.join(',')
    }

    // Update the session with BioDigital URLs
    const { data, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()

    if (error) {
      console.error('❌ Error updating session with BioDigital URLs:', error)
      return NextResponse.json({ error: 'Failed to save BioDigital URLs' }, { status: 500 })
    }

    console.log('✅ Successfully saved BioDigital URLs:', data)

    return NextResponse.json({
      success: true,
      message: 'BioDigital URLs saved successfully',
      data
    })

  } catch (error) {
    console.error('❌ Error saving BioDigital URLs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
