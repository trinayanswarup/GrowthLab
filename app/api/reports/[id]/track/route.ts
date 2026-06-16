import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = createServerClient()

  const { data: current } = await db
    .from('reports')
    .select('tracked')
    .eq('id', id)
    .single()

  if (!current) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  const { data, error } = await db
    .from('reports')
    .update({ tracked: !current.tracked })
    .eq('id', id)
    .select('tracked')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ tracked: data.tracked })
}
