import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { generateContentBrief } from '@/lib/agents/brief-generator'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const keyword: string = body?.keyword
  const type: 'brief' | 'comparison' = body?.type ?? 'brief'

  if (!keyword) {
    return NextResponse.json({ error: 'keyword required' }, { status: 400 })
  }

  try {
    if (type === 'brief') {
      const brief = await generateContentBrief(keyword)
      const db = createServerClient()
      await db.from('report_generated_content').insert({
        report_id: id,
        keyword,
        type: 'brief',
        title: brief.titleTag,
        content: JSON.stringify(brief),
      })
      return NextResponse.json({ type: 'brief', data: brief })
    }

    return NextResponse.json({ type: 'comparison', redirect: `/api/generate/comparison` })
  } catch (err) {
    console.error('[Generate failed]', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
