import { groqComplete } from '@/lib/llm/groq'
import type { KeywordGap, TavilyResult, TavilySearchResponse } from '@/types'

export async function extractTopic(html: string): Promise<string> {
  const result = await groqComplete(
    'What is the main topic of this website? HTML: ' + html.slice(0, 3000),
    'Return only a 2-3 word topic phrase. No punctuation. No explanation.'
  )
  return result.trim() || 'general content'
}

export async function tavilySearch(query: string): Promise<TavilyResult[]> {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        max_results: 10,
        include_answer: false,
      }),
    })
    if (!res.ok) return []
    const data: TavilySearchResponse = await res.json()
    return data.results ?? []
  } catch {
    return []
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function checkDomainInResults(results: TavilyResult[], domain: string): boolean {
  const lowerDomain = domain.toLowerCase()
  return results.some((r) => {
    const resultDomain = extractDomain(r.url).toLowerCase()
    return resultDomain === lowerDomain || resultDomain.endsWith('.' + lowerDomain)
  })
}

export async function runContentGapAgent(url: string, topic: string): Promise<KeywordGap[]> {
  const targetDomain = extractDomain(url)
  const year = new Date().getFullYear()

  const queries = [
    { keyword: `${topic} best ${year}`,  intent: 'commercial'    as const },
    { keyword: `${topic} vs`,            intent: 'transactional' as const },
    { keyword: `how to ${topic}`,        intent: 'informational' as const },
    { keyword: `${topic} review`,        intent: 'commercial'    as const },
  ]

  const results = await Promise.all(
    queries.map((q) => tavilySearch(q.keyword))
  )

  const gaps: KeywordGap[] = []

  for (let i = 0; i < queries.length; i++) {
    const searchResults = results[i]
    const isPresent = checkDomainInResults(searchResults, targetDomain)
    if (!isPresent) {
      const topCompetitorUrl = searchResults[0]?.url ?? ''
      const competitor = extractDomain(topCompetitorUrl) || 'unknown'
      const foundIndex = searchResults.findIndex(
        (r) => extractDomain(r.url) === targetDomain
      )
      const gapScore = Math.round((1 - (foundIndex + 1) / 10) * 100)
      gaps.push({
        keyword: queries[i].keyword,
        intent: queries[i].intent,
        competitor,
        gapScore: isNaN(gapScore) ? 80 : gapScore,
      })
    }
  }

  return gaps
}
