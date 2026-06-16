import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { runSEOAudit } from '@/lib/agents/seo-auditor'
import { buildPresenceMatrix } from '@/lib/agents/presence-matrix'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const targetUrl: string = body?.targetUrl?.trim()
  const topic: string = body?.topic?.trim()
  const competitorUrls: string[] = (body?.competitorUrls ?? [])
    .map((u: string) => u.trim())
    .filter(Boolean)
    .slice(0, 2)

  if (!targetUrl) {
    return NextResponse.json({ error: 'targetUrl is required' }, { status: 400 })
  }
  if (!topic) {
    return NextResponse.json({ error: 'topic is required' }, { status: 400 })
  }

  const db = createServerClient()
  const { data: report, error } = await db
    .from('reports')
    .insert({ target_url: targetUrl, competitor_urls: competitorUrls, topic, status: 'queued' })
    .select('id')
    .single()

  if (error || !report) {
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }

  void runReportBackground(report.id, targetUrl, topic, competitorUrls)
  return NextResponse.json({ reportId: report.id })
}

async function runReportBackground(
  reportId: string,
  targetUrl: string,
  topic: string,
  competitorUrls: string[]
) {
  const db = createServerClient()
  try {
    await db.from('reports').update({
      status: 'running',
      seo_status: 'running',
      presence_status: 'running',
    }).eq('id', reportId)

    const [seoResult, presenceResult] = await Promise.allSettled([
      runSEOAudit(targetUrl),
      buildPresenceMatrix(targetUrl, competitorUrls, topic, reportId),
    ])

    // ── SEO ──
    if (seoResult.status === 'fulfilled') {
      const pages = seoResult.value
      if (pages.length > 0) {
        await db.from('report_seo_pages').insert(
          pages.map((p) => ({
            report_id: reportId,
            url: p.url,
            title: p.title,
            seo_score: p.score,
            word_count: p.wordCount,
            load_time_ms: p.loadTimeMs,
            issues: p.issues,
          }))
        )
      }
      await db.from('reports').update({ seo_status: 'done' }).eq('id', reportId)
    } else {
      console.error('[SEO failed]', seoResult.reason)
      await db.from('reports').update({ seo_status: 'failed' }).eq('id', reportId)
    }

    // ── Presence matrix ──
    if (presenceResult.status === 'fulfilled') {
      const matrix = presenceResult.value
      if (matrix.length > 0) {
        await db.from('presence_results').insert(
          matrix.map((r) => ({
            report_id: r.report_id,
            keyword: r.keyword,
            intent: r.intent,
            target_present: r.target_present,
            competitor1_present: r.competitor1_present,
            competitor2_present: r.competitor2_present,
            target_domain: r.target_domain,
            competitor1_domain: r.competitor1_domain,
            competitor2_domain: r.competitor2_domain,
            top_result_domain: r.top_result_domain,
            revenue_potential: r.revenue_potential,
          }))
        )
      }

      const commercialGaps = matrix.filter(
        (r) => r.intent !== 'informational' && !r.target_present && (r.competitor1_present || r.competitor2_present)
      )
      const commercialTotal = matrix.filter((r) => r.intent !== 'informational').length
      const opportunityScore = commercialTotal > 0
        ? Math.round((commercialGaps.length / commercialTotal) * 100)
        : 0

      await db.from('reports').update({
        presence_status: 'done',
        opportunity_score: opportunityScore,
      }).eq('id', reportId)
    } else {
      console.error('[Presence matrix failed]', presenceResult.reason)
      await db.from('reports').update({ presence_status: 'failed' }).eq('id', reportId)
    }

    await db.from('reports').update({ status: 'done' }).eq('id', reportId)
  } catch (err) {
    console.error('[Report pipeline failed]', err)
    await db.from('reports').update({
      status: 'failed',
      seo_status: 'failed',
      presence_status: 'failed',
    }).eq('id', reportId)
  }
}
