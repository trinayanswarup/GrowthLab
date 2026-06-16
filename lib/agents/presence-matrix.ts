import { tavilySearch, extractDomain, checkDomainInResults } from './content-gap'
import type { PresenceResult } from '@/types'

const REVENUE_POTENTIAL: Record<string, 'high' | 'medium' | 'low'> = {
  'vpn': 'high', 'security': 'high', 'antivirus': 'high',
  'hosting': 'high', 'finance': 'high', 'investing': 'high',
  'software': 'medium', 'seo': 'medium', 'marketing': 'medium',
  'how to': 'low', 'what is': 'low',
}

function classifyRevenuePotential(keyword: string, intent: string): 'high' | 'medium' | 'low' {
  if (intent === 'informational') return 'low'
  if (intent === 'transactional') return 'high'
  const lower = keyword.toLowerCase()
  for (const [term, potential] of Object.entries(REVENUE_POTENTIAL)) {
    if (lower.includes(term)) return potential
  }
  return 'medium'
}

export async function buildPresenceMatrix(
  targetUrl: string,
  competitorUrls: string[],
  topic: string,
  reportId: string
): Promise<PresenceResult[]> {
  const targetDomain = extractDomain(targetUrl)
  const competitor1Domain = competitorUrls[0] ? extractDomain(competitorUrls[0]) : null
  const competitor2Domain = competitorUrls[1] ? extractDomain(competitorUrls[1]) : null

  // Avoid "SEO tools tools" when topic already ends with "tools"
  const topicEndsWithTools = topic.toLowerCase().endsWith('tools')

  const queries = [
    { keyword: `best ${topic}`,                   intent: 'commercial'    as const },
    { keyword: `${topic} review`,                 intent: 'commercial'    as const },
    { keyword: `${topic} comparison`,             intent: 'transactional' as const },
    { keyword: `top ${topic}`,                    intent: 'commercial'    as const },
    { keyword: `${topic} alternatives`,           intent: 'transactional' as const },
    { keyword: `best ${topic} for beginners`,     intent: 'commercial'    as const },
    { keyword: `${topic} vs`,                     intent: 'transactional' as const },
    { keyword: `how to use ${topic}`,             intent: 'informational' as const },
    { keyword: `${topic} guide`,                  intent: 'informational' as const },
    { keyword: `${topic} pricing`,                intent: 'commercial'    as const },
    { keyword: `${topic} tutorial`,               intent: 'informational' as const },
    { keyword: topicEndsWithTools ? `top rated ${topic}` : `${topic} tools`, intent: 'commercial' as const },
  ]

  const searchResults = await Promise.all(
    queries.map((q) => tavilySearch(q.keyword))
  )

  const results: PresenceResult[] = []

  for (let i = 0; i < queries.length; i++) {
    const srp = searchResults[i]
    const q = queries[i]

    const targetPresent = checkDomainInResults(srp, targetDomain)
    const c1Present = competitor1Domain ? checkDomainInResults(srp, competitor1Domain) : false
    const c2Present = competitor2Domain ? checkDomainInResults(srp, competitor2Domain) : false
    const topResultDomain = srp[0] ? extractDomain(srp[0].url) : null

    results.push({
      id: '',
      report_id: reportId,
      keyword: q.keyword,
      intent: q.intent,
      target_present: targetPresent,
      competitor1_present: c1Present,
      competitor2_present: c2Present,
      target_domain: targetDomain,
      competitor1_domain: competitor1Domain,
      competitor2_domain: competitor2Domain,
      top_result_domain: topResultDomain,
      revenue_potential: classifyRevenuePotential(q.keyword, q.intent),
    })
  }

  return results
}
