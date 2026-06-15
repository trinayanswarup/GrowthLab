# GrowthLab — Claude Code Context

## What this project is
GrowthLab audits any website URL across four dimensions (SEO, content gaps, monetisation, CRO) using parallel AI agents, then generates publishable content from the findings. Portfolio project targeting Mediatech Vilnius and Paradise Media.

## Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase (Postgres) — audit history, job state, results storage
- Cheerio — SEO crawling, no LLM
- Tavily API — web search for content gap agent and comparison page generator
- Gemini 2.5 Flash (gemini-2.5-flash) — comparison pages, content briefs (long context)
- Groq llama-3.3-70b-versatile — monetisation agent, CRO agent, headline tester (short prompts)
- Vercel — deployment

## Hard constraints
- Free tier only on all APIs — never suggest paid tiers
- No auth, no billing, no user accounts
- No full site crawl — top 5 pages max per audit (homepage + top linked internal pages)
- No Anthropic API
- npm run build must pass clean after every session

## API keys (already in .env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TAVILY_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
```

## LLM routing rules
| Task | Model | Reason |
|------|-------|--------|
| Comparison page generation | Gemini 2.5 Flash | Long context, fetched page content |
| Content brief generation | Gemini 2.5 Flash | Long structured output |
| Monetisation agent | Groq llama-3.3-70b | Short structured prompt |
| CRO agent | Groq llama-3.3-70b | Short structured prompt |
| Headline tester | Groq llama-3.3-70b | Short structured prompt |
| Topic extraction from homepage | Groq llama-3.3-70b | Short prompt |

## Agent architecture
All four audit agents run concurrently via `Promise.allSettled`. Each agent writes its result to Supabase under the shared `audit_id`. Frontend polls `/api/audits/[id]/status` every 2 seconds. Each agent section renders as it completes — no waiting for the full pipeline.

## Project structure
```
/app
  /api
    /audit          POST — creates audit job, triggers parallel agents
    /audits/[id]/status  GET — returns per-agent completion status
    /generate/comparison  POST — comparison page generator
    /generate/brief       POST — content brief generator
    /generate/headline    POST — headline tester
  /(pages)
    /audit          URL input + run button + agent progress
    /dashboard/[id] Metric cards + findings + quick wins
    /tools          Comparison / Brief / Headline tabs
    /history        Past audits list
/lib
  /agents
    seo-auditor.ts
    content-gap.ts
    monetisation.ts
    cro.ts
  /llm
    gemini.ts
    groq.ts
  /crawl
    fetcher.ts      (Cheerio-based)
  supabase.ts
/types
  index.ts
```

## Session workflow
1. `git add -A && git commit -m "checkpoint before session"` before every Claude Code session
2. Run `npm run build` at end of every session — must pass clean
3. Never leave TypeScript errors or missing env references

## Database schema
See PRD.md for full schema. Tables: `audits`, `audit_pages`, `keyword_gaps`, `monetisation_opportunities`, `generated_content`.

## Key types
```typescript
type AgentStatus = 'pending' | 'running' | 'done' | 'failed'

interface AuditJob {
  id: string
  url: string
  status: 'queued' | 'running' | 'done' | 'failed'
  seo_status: AgentStatus
  content_status: AgentStatus
  monetisation_status: AgentStatus
  cro_status: AgentStatus
  topic: string | null
  created_at: string
}

interface PageAudit {
  url: string
  title: string | null
  titleLength: number
  metaDescription: string | null
  metaDescriptionLength: number
  h1Count: number
  h2Count: number
  wordCount: number
  imagesWithoutAlt: number
  internalLinks: number
  externalLinks: number
  hasCanonical: boolean
  loadTimeMs: number
  score: number
  issues: string[]
}

interface KeywordGap {
  keyword: string
  intent: 'informational' | 'commercial' | 'transactional'
  competitor: string
  gapScore: number
}

interface MonetisationOpportunity {
  category: string
  commissionRate: string
  programmes: string[]
  matchingPages: string[]
  priority: 'high' | 'medium' | 'low'
}
```

## Demo script (for interviews)
1. Open GrowthLab, paste cybernews.com or a competitor
2. Watch four agents complete in ~30 seconds
3. Show the opportunity score and quick wins
4. Generate a comparison page (NordVPN vs ExpressVPN)
5. Show the content brief for the top keyword gap
This is a product demo, not a code walkthrough.
