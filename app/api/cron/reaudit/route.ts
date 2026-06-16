import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { buildPresenceMatrix } from '@/lib/agents/presence-matrix'
import { extractTopic } from '@/lib/agents/content-gap'
import { fetchPage } from '@/lib/crawl/fetcher'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServerClient()

  const { data: trackedReports } = await db
    .from('reports')
    .select('id, target_url, competitor_urls, topic')
    .eq('tracked', true)
    .eq('status', 'done')

  if (!trackedReports || trackedReports.length === 0) {
    return NextResponse.json({ message: 'No tracked reports' })
  }

  const results = await Promise.allSettled(
    trackedReports.map(async (report) => {
      const { html } = await fetchPage(report.target_url)
      const topic = report.topic ?? await extractTopic(html)
      const matrix = await buildPresenceMatrix(
        report.target_url,
        report.competitor_urls,
        topic,
        report.id
      )

      await db.from('presence_results').delete().eq('report_id', report.id)
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
        opportunity_score: opportunityScore,
      }).eq('id', report.id)

      return { reportId: report.id, opportunityScore }
    })
  )

  return NextResponse.json({
    processed: trackedReports.length,
    results: results.map((r) => r.status),
  })
}
