import { groqComplete } from '@/lib/llm/groq'
import type { HeadlineVariant } from '@/types'

export async function testHeadline(
  headline: string,
  goal: string
): Promise<HeadlineVariant[]> {
  const prompt = `Original headline: "${headline}"
Goal: ${goal}

Generate 5 headline variants optimised for this goal.
Return ONLY a JSON array (no markdown):
[{
  "variant": string,
  "angle": string,
  "reasoning": string,
  "estimatedCTRScore": number (0-100)
}]`

  try {
    const raw = await groqComplete(prompt, 'You are a headline optimisation expert. Return only valid JSON arrays.')
    const cleaned = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned) as HeadlineVariant[]
  } catch {
    return []
  }
}

export async function combineHeadlines(variants: HeadlineVariant[]): Promise<string> {
  const prompt = `These are 5 headline variants:
${variants.map((v, i) => `${i + 1}. ${v.variant} (angle: ${v.angle})`).join('\n')}

Combine the strongest elements into one single best headline.
Return only the headline text, nothing else.`

  return groqComplete(prompt, 'You are a headline expert. Return only the headline text.')
}
