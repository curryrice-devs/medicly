import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side operations
function createSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = createSupabaseServer();

    console.log('📋 Fetching treatments...');

    const { data, error } = await supabase
      .from('treatments')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching treatments:', error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Fetched treatments:', data?.length || 0);

    return Response.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('❌ Error in treatments GET:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch treatments' },
      { status: 500 }
    );
  }
} 