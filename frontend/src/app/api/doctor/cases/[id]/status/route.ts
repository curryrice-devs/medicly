import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status, notes } = await request.json()

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

    if (!url || !serviceKey) {
      console.error('[api/doctor/cases/status] Missing envs')
      return NextResponse.json({ error: 'Missing Supabase server env' }, { status: 500 })
    }

    const supabase = createClient(url, serviceKey)

    // Update session status
    const updateData: any = {
      status: status.toLowerCase(),
      reviewed_at: new Date().toISOString()
    }

    if (notes) {
      if (status === 'rejected') {
        updateData.rejection_reason = notes
      } else {
        updateData.doctor_notes = notes
      }
    }

    const { data, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()

    if (error) {
      console.error('[api/doctor/cases/status] update error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[api/doctor/cases/status] status updated successfully', data)
    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[api/doctor/cases/status] unexpected error', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}