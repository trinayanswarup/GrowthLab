import { groqComplete } from '@/lib/llm/groq'

export interface CROResult {
  factor: string
  passed: boolean
  recommendation: string
}

export async function runCROAgent(html: string): Promise<CROResult[]> {
  const truncated = html.slice(0, 4000)
  const prompt = `Analyse this webpage HTML for conversion rate optimisation.

For exactly these 5 factors, return JSON (array, no markdown):
1. valueProp — Is there a clear value proposition above the fold?
2. ctaPresence — Are there clear call-to-action buttons?
3. socialProof — Are there testimonials, user counts, or press mentions?
4. trustSignals — Are there privacy policy, about page, or contact info links?
5. contentFreshness — Are there dates on articles indicating fresh content?

Return format (array of exactly 5 objects, no markdown):
[{ "factor": string, "passed": boolean, "recommendation": string }]

HTML: ${truncated}`

  try {
    const raw = await groqComplete(prompt, 'You are a CRO expert. Return only valid JSON arrays.')
    const cleaned = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned) as CROResult[]
  } catch {
    return [
      { factor: 'valueProp', passed: false, recommendation: 'Could not analyse page' },
      { factor: 'ctaPresence', passed: false, recommendation: 'Could not analyse page' },
      { factor: 'socialProof', passed: false, recommendation: 'Could not analyse page' },
      { factor: 'trustSignals', passed: false, recommendation: 'Could not analyse page' },
      { factor: 'contentFreshness', passed: false, recommendation: 'Could not analyse page' },
    ]
  }
}
