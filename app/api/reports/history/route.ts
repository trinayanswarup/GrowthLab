import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = createServerClient()
  const { data } = await db
    .from('reports')
    .select('id, target_url, competitor_urls, status, opportunity_score, topic, tracked, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 'no-store' },
  })
}
