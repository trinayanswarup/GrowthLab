import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { testHeadline } from '@/lib/agents/headline-tester'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const headline: string = body?.headline?.trim()
  const goal: string = body?.goal?.trim()

  if (!headline || !goal) {
    return NextResponse.json({ error: 'headline and goal required' }, { status: 400 })
  }

  const variants = await testHeadline(headline, goal)

  const db = createServerClient()
  await db.from('generated_content').insert({
    type: 'headline',
    title: headline,
    content: JSON.stringify(variants),
  })

  return NextResponse.json({ variants })
}
