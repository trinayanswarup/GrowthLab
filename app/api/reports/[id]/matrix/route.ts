import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = createServerClient()

  const { data, error } = await db
    .from('presence_results')
    .select('*')
    .eq('report_id', id)
    .order('revenue_potential', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch matrix' }, { status: 500 })
  }

  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 'no-store' },
  })
}
