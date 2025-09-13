import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side operations
function createSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = createSupabaseServer();
    const { sessionId } = await params;
    const updates = await request.json();

    console.log('📝 Updating session:', sessionId, updates);

    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', sessionId)
      .select(`
        *,
        treatment:treatments(*)
      `)
      .single();

    if (error) {
      console.error('❌ Error updating session:', error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Updated session:', data);

    return Response.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ Error in session PUT:', error);
    return Response.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    );
  }
} 