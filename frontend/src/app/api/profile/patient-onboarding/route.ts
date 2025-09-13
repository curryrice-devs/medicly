import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { role, patientInfo } = await req.json()

    if (!role || !patientInfo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (role !== 'client') {
      return NextResponse.json({ error: 'Invalid role for patient onboarding' }, { status: 400 })
    }

    const { fullName, phone, age, gender } = patientInfo

    if (!fullName || !phone || !age || !gender) {
      return NextResponse.json({ error: 'Missing patient information' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Create or update the user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        role: 'client',
        onboarded: true
      })

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Create patient profile
    const { error: patientError } = await supabase
      .from('patient_profiles')
      .insert({
        id: user.id,
        full_name: fullName,
        email: user.email,
        phone: phone,
        age: parseInt(age),
        gender: gender,
      })

    if (patientError) {
      console.error('Error creating patient profile:', patientError)
      return NextResponse.json(
        { error: 'Failed to create patient profile' },
        { status: 500 }
      )
    }

    // Refresh the session to ensure updated data is available
    await supabase.auth.refreshSession()

    return NextResponse.json({
      success: true,
      message: 'Patient profile created successfully'
    })

  } catch (error) {
    console.error('Patient onboarding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}