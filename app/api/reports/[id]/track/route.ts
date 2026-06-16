import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const tracked: boolean = body.tracked

  if (typeof tracked !== 'boolean') {
    return NextResponse.json({ error: 'tracked must be boolean' }, { status: 400 })
  }

  const db = createServerClient()
  const { error } = await db
    .from('reports')
    .update({ tracked })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ tracked })
}
