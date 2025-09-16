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

    // Create or update the user's profile using upsert for reliability
    const userName = user.user_metadata?.full_name || fullName || user.email;

    console.log('[patient-onboarding-api] Attempting to upsert profile for user:', user.id, 'with name:', userName);

    // Use upsert to handle both new and existing users
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        role: 'client',
        onboarded: true,
        name: userName
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error upserting profile:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    console.log('[patient-onboarding-api] Profile upserted successfully:', profileData);

    // Note: We only use the profiles table now, no separate patient_profiles table
    // The patient information is stored in the main profiles table with the name field

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