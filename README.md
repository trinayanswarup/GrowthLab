# GrowthLab

**An AI-native growth auditing tool.** Paste any URL — GrowthLab runs four AI agents in parallel to find every SEO gap, keyword opportunity, monetisation opening, and conversion problem on the site, then generates the content to close those gaps.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/trinayanswarup/growthlab)

![Tech Stack](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-green)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)

---

## What it does

1. **SEO Audit** — Cheerio crawls the top 5 pages. Checks title tags, meta descriptions, H1 structure, word count, image alt tags, load time, and canonical tags. Scores each page 0–100.

2. **Keyword Gap Detection** — Finds keywords the site should be ranking for but isn't, using Tavily search. Classifies intent (informational / commercial / transactional) and identifies which competitor is winning each gap.

3. **Monetisation Mapping** — Identifies which affiliate categories fit the site's content and which pages are the best candidates. Flags pages that mention products but have no CTAs.

4. **CRO Analysis** — Checks for value proposition clarity, CTA presence, social proof, trust signals, and content freshness on the top pages.

All four agents run concurrently. The dashboard renders each section as it completes.

---

## Content generation tools

- **Comparison page generator** — Input two products, get a full publish-ready HTML comparison page with feature table, pros/cons, verdict, FAQ, and affiliate CTA placeholders. Built for Mediatech's cybernews.com format.
- **Content brief generator** — Full brief for any keyword: structure, word count, competitor analysis, internal linking suggestions, affiliate CTAs.
- **Headline tester** — 5 optimised variants per headline goal, scored by an AI judge.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres) |
| Crawling | Cheerio |
| Web search | Tavily API |
| Long-form LLM | Gemini 1.5 Flash |
| Short-form LLM | Groq llama-3.3-70b-versatile |
| Deployment | Vercel |

All free-tier APIs.

---

## Local setup

```bash
git clone https://github.com/trinayanswarup/growthlab
cd growthlab
npm install
cp .env.example .env.local
# Fill in API keys (see .env.example)
npm run dev
```

### Required environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TAVILY_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
```

### Supabase schema

Run `/supabase/schema.sql` in your Supabase SQL editor.

---

## Architecture

```
POST /api/audit
  └── Promise.allSettled([
        runSEOAudit(),        # Cheerio
        runContentGapAgent(), # Tavily + Groq
        runMonetisationAgent(), # Groq
        runCROAgent()         # Groq
      ])
      
Each agent writes to Supabase → frontend polls /api/audits/[id]/status every 2s
```

---

## Portfolio context

Built as the final project in a 4-project AI-native portfolio targeting Mediatech Vilnius, Paradise Media, and AI engineering internships. The comparison page output format is directly modelled on cybernews.com's review pages.

Other projects in the series: [Connecta](https://github.com/trinayanswarup/Connecta) · [BreachWatch](https://github.com/trinayanswarup/breachwatchsite) · [AgentFlow Studio](https://github.com/trinayanswarup/agentflow-studio)
