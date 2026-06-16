import { NextRequest, NextResponse } from 'next/server'
import { combineHeadlines } from '@/lib/agents/headline-tester'
import type { HeadlineVariant } from '@/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const variants: HeadlineVariant[] = body?.variants

  if (!Array.isArray(variants) || variants.length === 0) {
    return NextResponse.json({ error: 'variants required' }, { status: 400 })
  }

  const combined = await combineHeadlines(variants)
  return NextResponse.json({ combined })
}
