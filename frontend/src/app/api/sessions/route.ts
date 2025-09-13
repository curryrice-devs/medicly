import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side operations
function createSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    
    // Get user ID from query params
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return Response.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('📋 Fetching sessions for user:', userId);

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        treatment:treatments(*)
      `)
      .eq('patient_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching sessions:', error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Fetched sessions:', data?.length || 0);

    return Response.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('❌ Error in sessions GET:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const sessionData = await request.json();

    console.log('📝 Creating session:', sessionData);

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        patient_id: sessionData.patient_id,
        treatment_id: sessionData.treatment_id,
        status: sessionData.status || 'pending',
        due_date: sessionData.due_date,
        exercise_sets: sessionData.exercise_sets || 3,
        exercise_reps: sessionData.exercise_reps || 10,
        exercise_frequency_daily: sessionData.exercise_frequency_daily || 1,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        treatment:treatments(*)
      `)
      .single();

    if (error) {
      console.error('❌ Error creating session:', error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Created session:', data);

    return Response.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ Error in sessions POST:', error);
    return Response.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
} 