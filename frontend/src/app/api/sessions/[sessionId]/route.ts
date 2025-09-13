import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side operations
function createSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = createSupabaseServer();
    const { sessionId } = await params;

    console.log('📋 Fetching session:', sessionId);

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('❌ Error fetching session:', error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Fetched session:', data);

    // Fetch evaluation data if evaluation_id exists
    let evaluationData = null;
    if (data.evaluation_id) {
      const { data: evaluation } = await supabase
        .from('evaluation_metrics')
        .select('*')
        .eq('id', data.evaluation_id)
        .single();
      evaluationData = evaluation;
    }

    // Format response to include evaluation as treatment for backward compatibility
    const responseData = {
      ...data,
      treatment: evaluationData ? {
        id: evaluationData.id,
        name: evaluationData.name
      } : null
    };

    return Response.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('❌ Error in session GET:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
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
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error updating session:', error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Updated session:', data);

    // Fetch evaluation data if evaluation_id exists
    let evaluationData = null;
    if (data.evaluation_id) {
      const { data: evaluation } = await supabase
        .from('evaluation_metrics')
        .select('*')
        .eq('id', data.evaluation_id)
        .single();
      evaluationData = evaluation;
    }

    // Format response to include evaluation as treatment for backward compatibility
    const responseData = {
      ...data,
      treatment: evaluationData ? {
        id: evaluationData.id,
        name: evaluationData.name
      } : null
    };

    return Response.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('❌ Error in session PUT:', error);
    return Response.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    );
  }
} 