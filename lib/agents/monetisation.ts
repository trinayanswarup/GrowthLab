import { groqComplete } from '@/lib/llm/groq'

export interface MonetisationResult {
  category: string
  commissionRate: string
  programmes: string[]
  matchingPages: string[]
  ctaMissingPages: string[]
  priority: 'high' | 'medium' | 'low'
}

export async function runMonetisationAgent(
  topic: string,
  pageUrls: string[]
): Promise<MonetisationResult[]> {
  const prompt = `Site topic: "${topic}". Pages: ${pageUrls.slice(0, 5).join(', ')}.

Which affiliate categories are relevant from this list:
VPN/security, web hosting, finance/investing, health/supplements, software/SaaS, travel, e-commerce

For each relevant category return JSON (array, no markdown):
[{
  "category": string,
  "commissionRate": string (e.g. "25-45% recurring"),
  "programmes": string[] (2-3 real programme names),
  "matchingPages": string[] (which of the provided pages fit),
  "ctaMissingPages": string[] (pages that mention products but likely have no CTA),
  "priority": "high" | "medium" | "low"
}]

Return only the JSON array. No explanation. No markdown.`

  try {
    const raw = await groqComplete(prompt, 'You are an affiliate marketing expert. Return only valid JSON arrays.')
    const cleaned = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned) as MonetisationResult[]
  } catch {
    return []
  }
}
