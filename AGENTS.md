# GrowthLab — AGENTS.md (Session Build Plan)

Each session ends with `npm run build` passing clean. Commit before every session.

---

## Session 1 — Project scaffold + Supabase schema

**Goal:** Runnable Next.js app with DB schema, env setup, and base layout.

Tasks:
- `npx create-next-app@latest growthlab --typescript --tailwind --app --no-src-dir`
- Install dependencies: `cheerio`, `@supabase/supabase-js`, `@google/generative-ai`, `groq-sdk`, `@tavily/core`
- Create `.env.local` with all 5 API key slots
- Set up `/lib/supabase.ts` (client + server)
- Run Supabase migrations for all 6 tables (SQL in `/supabase/schema.sql`)
- Base layout: dark sidebar nav (Audit / Dashboard / Tools / History), top bar
- Placeholder pages for all 4 routes
- `npm run build` clean

Deliverable: Deployed scaffold on Vercel with empty nav and DB connected.

---

## Session 2 — SEO Auditor (Cheerio, no LLM)

**Goal:** Working SEO agent that scores pages and writes results to Supabase.

Tasks:
- `/lib/crawl/fetcher.ts`: fetch URL with timeout (8s), return HTML + latency
- `/lib/agents/seo-auditor.ts`:
  - Extract internal links from homepage, pick top 4
  - For each page: run all 9 checks, compute weighted score, collect issues array
  - Return `PageAudit[]`
- `/app/api/audit/route.ts` POST:
  - Create audit row (status: queued)
  - Kick off SEO agent only (others stubbed)
  - Write `audit_pages` rows
  - Update `seo_status` to done/failed
- `/app/audit` page: URL input form, submits to POST /api/audit, redirects to dashboard
- `/app/dashboard/[id]` page: polls status, renders SEO section with page cards and scores
- `npm run build` clean

Deliverable: Paste a URL, see SEO scores per page render in dashboard.

---

## Session 3 — Content Gap Agent (Tavily)

**Goal:** Keyword gap detection running alongside SEO agent.

Tasks:
- `/lib/llm/groq.ts`: wrapper with retry on 429 (exponential backoff, max 3 retries)
- `/lib/agents/content-gap.ts`:
  - Extract topic from homepage HTML using Groq (short prompt)
  - Run 4 Tavily searches with `searchDepth: 'basic'`, `maxResults: 10`
  - For each: check if target domain appears in results
  - Build `KeywordGap[]` with intent classification
- Update `/app/api/audit/route.ts`: run SEO + content gap in parallel (Promise.allSettled)
- Write `keyword_gaps` rows to Supabase
- Dashboard: add content gap section, renders as it completes (poll detects `content_status: done`)
- `npm run build` clean

Deliverable: Dashboard shows keyword gaps with intent badges alongside SEO findings.

---

## Session 4 — Comparison Page Generator (Gemini 1.5 Flash) ⭐

**Goal:** Most impressive feature. Polished output, demo-ready.

Tasks:
- `/lib/llm/gemini.ts`: wrapper for Gemini 1.5 Flash with retry
- `/app/api/generate/comparison/route.ts` POST:
  - Accept `{ product1: string, product2: string }`
  - Run 2 Tavily searches in parallel
  - Fetch top 2 results each via `fetcher.ts`
  - Send all 4 pages as context to Gemini: extract structured data
  - Second Gemini call: generate full comparison HTML from structured data
  - Insert affiliate CTA placeholders
  - Write to `generated_content`
  - Return HTML
- `/app/tools` page: comparison tab, product input form, rendered HTML preview iframe, "Copy HTML" button
- `npm run build` clean

Deliverable: Type in "NordVPN vs ExpressVPN" → get a publishable comparison page in ~15s.

---

## Session 5 — Monetisation + CRO agents

**Goal:** Complete the four-agent pipeline.

Tasks:
- `/lib/agents/monetisation.ts`:
  - Groq prompt: map topics to affiliate categories
  - For each category: programmes, commission, matching pages, CTA-missing pages
  - Return `MonetisationOpportunity[]`
- `/lib/agents/cro.ts`:
  - Fetch homepage + top page
  - Groq prompt: analyse 5 CRO factors, return pass/fail + recommendation per factor
- Update `/app/api/audit/route.ts`: all 4 agents in `Promise.allSettled`
- Write `cro_findings` rows
- Dashboard: monetisation + CRO sections
- Compute overall opportunity score (composite of 4 agent scores)
- Update `audits.overall_score`
- `npm run build` clean

Deliverable: Full 4-agent audit running in parallel. Dashboard renders all sections.

---

## Session 6 — Growth Dashboard polish + action backlog

**Goal:** Dashboard feels like a real product.

Tasks:
- Metric cards at top: overall score (gauge or big number), SEO issues count, keyword gaps count, estimated revenue potential
- Revenue estimate: `gapScore average × 0.3 × niche RPM` (hardcoded RPM per category: VPN=$12, finance=$18, software=$8, default=$5)
- Quick wins: top 3 highest-impact/lowest-effort items across all agents
- Prioritised action backlog: flat list sorted by `impact - effort` ratio
- Effort scoring: fix missing meta = 1, add CTA = 1, write comparison page = 3, build new content = 4
- Impact scoring: based on agent confidence scores and gap scores
- Collapsible sections with expand/collapse state in localStorage
- Loading skeleton per section while agent is pending/running
- `npm run build` clean

---

## Session 7 — Content Brief + Headline Tester

**Goal:** Complete the tools screen.

Tasks:
- `/app/api/generate/brief/route.ts` POST:
  - Accept `{ keyword: string, auditId?: string }`
  - Gemini 1.5 Flash: generate full brief as JSON (9 fields)
  - Render as formatted card layout on frontend
- `/app/api/generate/headline/route.ts` POST:
  - Accept `{ headline: string, goal: string }`
  - Groq: return `[{ variant, angle, reasoning, estimatedCTRScore }]` as JSON array
  - "Combine best elements" — second Groq call
- `/app/tools` page: three tabs (Comparison / Brief / Headline), each tab self-contained
- `npm run build` clean

---

## Session 8 — History screen + final polish + deploy

**Goal:** Portfolio-ready. Live URL. Demo-ready.

Tasks:
- `/app/history`: list of past audits from Supabase, sorted by created_at desc, show URL + score + date + link
- Add error states: failed audit shows which agent failed with retry button
- Add "Demo audit" button on home that pre-fills cybernews.com URL
- Favicon, page titles, OG meta tags
- README badges (Vercel deploy status, tech stack)
- Final Vercel deploy with all env vars set
- Run demo script from CLAUDE.md to verify end-to-end
- `npm run build` clean

---

## Agent dependency map

```
Session 1: scaffold
Session 2: SEO auditor → dashboard skeleton
Session 3: content gap → dashboard section 2
Session 4: comparison generator → tools screen (tab 1) ← demo-ready milestone
Session 5: monetisation + CRO → dashboard sections 3+4
Session 6: dashboard polish
Session 7: brief + headline → tools screen (tabs 2+3)
Session 8: history + deploy
```

## Total estimated sessions: 8
Realistic pace: 2-3 sessions/day = ~3 days to MVP.
