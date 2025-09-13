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

    // Create or update the user's profile using the same pattern as doctor role API
    const userName = user.user_metadata?.full_name || fullName || user.email;

    // Use update instead of upsert to ensure the profile exists and is properly updated
    const { error } = await supabase
      .from("profiles")
      .update({
        role: 'client',
        onboarded: true,
        name: userName
      })
      .eq("id", user.id);

    if (error) {
      // If update fails, try insert (for new users)
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          role: 'client',
          onboarded: true,
          name: userName
        });

      if (insertError) {
        console.error('Error creating profile:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
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

    // Wait longer to ensure database propagation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify the profile was actually updated before returning
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('role, onboarded, name')
      .eq('id', user.id)
      .single()

    console.log('[patient-onboarding-api] Profile verification:', { verifyProfile, verifyError, userId: user.id });

    if (!verifyProfile?.onboarded) {
      console.error('[patient-onboarding-api] Profile verification failed - onboarded is still false');
      return NextResponse.json({ error: 'Profile update failed' }, { status: 500 });
    }

    if (verifyProfile.role !== 'client') {
      console.error('[patient-onboarding-api] Profile verification failed - role is not client:', verifyProfile.role);
      return NextResponse.json({ error: 'Role update failed' }, { status: 500 });
    }

    // Refresh the session to ensure updated data is available
    await supabase.auth.refreshSession()

    return NextResponse.json({
      success: true,
      message: 'Patient profile created successfully',
      profile: verifyProfile
    })

  } catch (error) {
    console.error('Patient onboarding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}