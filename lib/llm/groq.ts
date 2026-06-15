import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function groqComplete(
  userPrompt: string,
  systemPrompt?: string
): Promise<string> {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: userPrompt })

  const MAX_ATTEMPTS = 3
  let lastError: unknown

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 1024,
      })
      return response.choices[0]?.message?.content ?? ''
    } catch (err) {
      lastError = err
      const isRateLimit =
        err instanceof Error &&
        (err.message.includes('429') || (err as { status?: number }).status === 429)
      if (isRateLimit && attempt < MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, 2000))
        continue
      }
      throw err
    }
  }

  throw lastError
}
