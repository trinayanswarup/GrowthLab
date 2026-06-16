# GrowthLab — Claude Code Context

## What this product is

GrowthLab is a competitive growth intelligence tool for affiliate and content sites.
You enter your site + up to 2 competitors. GrowthLab runs 4 AI agents in parallel,
finds every commercial keyword where competitors appear in top search results and you don't, scores each gap
by commercial priority, and generates publish-ready first draft to close those gaps.

Target companies: Mediatech Vilnius (cybernews.com), Paradise Media (iGaming affiliate).

## The demo that gets the job

"I enter my site and two competitors. GrowthLab finds commercial keywords where
competitors rank but I don't. I click one gap and generate a publish-ready comparison
page or content brief in under 60 seconds."

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase (Postgres) — reports, job state, results, tracking
- Cheerio — SEO crawling, no LLM
- Tavily API — presence checks and comparison page research
- Gemini 2.5 Flash (@google/genai, model: gemini-2.5-flash) — comparison pages, content briefs
- Groq llama-3.3-70b-versatile (groq-sdk) — monetisation, CRO, headline tester, topic extraction
- Vercel Cron — scheduled re-audits for tracked reports
- Vercel — deployment

## Hard constraints

- Free tier only on ALL APIs — never suggest paid tiers
- No auth, no billing, no user accounts
- Max 5 pages crawled per site
- No Anthropic API
- No fabricated metrics — every number must be defensible
  - Keyword presence = real Tavily SERP signal
  - Revenue potential = transparent RPM heuristic, labelled as estimate
  - Never say "estimated X monthly searches" — say "competitor present in top 10"
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

## LLM routing — never deviate from this

| Task                       | Model                   | Package       |
| -------------------------- | ----------------------- | ------------- |
| Comparison page generation | gemini-2.5-flash        | @google/genai |
| Content brief generation   | gemini-2.5-flash        | @google/genai |
| Monetisation agent         | llama-3.3-70b-versatile | groq-sdk      |
| CRO agent                  | llama-3.3-70b-versatile | groq-sdk      |
| Headline tester            | llama-3.3-70b-versatile | groq-sdk      |
| Topic extraction           | llama-3.3-70b-versatile | groq-sdk      |

## Architecture — how it works

1. User enters: target URL + up to 2 competitor URLs
2. POST /api/report creates a report row, fires runReportBackground async
3. runReportBackground:
   a. For each site (target + competitors): run SEO audit + presence checks in parallel
   b. Build presence matrix: keyword × site grid
   c. Run monetisation + CRO agents on target site only
   d. Compute opportunity score
   e. Write all results to Supabase
4. Frontend polls /api/reports/[id]/status every 2s, renders as agents complete
5. User clicks gap row → generates comparison page or content brief inline

## Critical fixes already in codebase (do not revert)

- fetchPage returns empty HTML on 403 instead of throwing
- seo-auditor guards against empty HTML (returns score:0 with blocking message)
- status route has: export const dynamic = 'force-dynamic' and Cache-Control: no-store
- All route handlers use: const { id } = await params (Next.js 15 async params)
- runAuditBackground catch block sets ALL agent statuses to failed, not just top-level

## Current file structure

app/
api/
audit/route.ts ← will be replaced by /api/report/route.ts in Session 5
audits/[id]/status/ ← will be replaced by /api/reports/[id]/status/
audits/[id]/gaps/
audits/[id]/pages/
generate/comparison/route.ts ← keep as-is
health/route.ts
audit/page.tsx ← will be redesigned in Session 5
dashboard/[id]/page.tsx ← will be redesigned in Session 5
tools/page.tsx
history/page.tsx
lib/
agents/
content-gap.ts ← extractTopic, tavilySearch, extractDomain, checkDomainInResults, runContentGapAgent
seo-auditor.ts
crawl/fetcher.ts
llm/
gemini.ts ← geminiComplete()
groq.ts ← groqComplete()
supabase.ts
types/index.ts

## Session workflow

1. git add -A && git commit -m "checkpoint before session" before EVERY session
2. npm run build at end of every session — must pass clean
3. Never leave TypeScript errors

## Demo script (memorise this)

1. Open GrowthLab, enter: target=backlinko.com, competitor1=ahrefs.com, competitor2=semrush.com
2. Watch agent trace complete in ~30s
3. Show presence matrix — highlight rows where both competitors rank, target doesn't
4. Click one gap → generate comparison page
5. Show the HTML output — "this is publish-ready, affiliate CTAs already placed"
6. Show opportunity score formula — "transparent, no black box"
