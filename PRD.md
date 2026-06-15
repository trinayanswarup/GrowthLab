# GrowthLab — Product Requirements Document

## Problem
Affiliate and content sites leave revenue on the table because auditing tools are either purely technical (Ahrefs, Screaming Frog) or too expensive for solo operators. There's no tool that combines SEO auditing, keyword gap detection, monetisation mapping, and CRO analysis into one pipeline — and then generates the actual content to close those gaps.

## Target users (portfolio demo context)
- Mediatech Vilnius: growth team that runs cybernews.com, investorsobserver.com — exactly this product category
- Paradise Media: affiliate SEO publisher — needs comparison pages and content briefs
- Interviewers: see commercial thinking, not just technical correctness

## Core user flow
1. User pastes a URL → clicks "Run Audit"
2. Four agents fire in parallel, each section of dashboard renders as it completes
3. User sees overall opportunity score + prioritised quick wins
4. User generates a comparison page, content brief, or headline variants from findings

---

## Features

### F1 — SEO Auditor (Cheerio, no LLM)
For each of the top 5 pages (homepage + top 4 linked internal pages):
- Title tag: present? ≤60 chars?
- Meta description: present? ≤155 chars?
- H1: exactly one?
- H2/H3 count
- Word count
- Images without alt tags
- Internal vs external link count
- Canonical tag present?
- Page load time (fetch latency)

Output: `PageAudit[]`, each page scored 0–100 weighted by importance.
Scoring weights: title (15), meta (10), H1 (20), word count (15), alt tags (15), load time (15), canonical (10).

### F2 — Content Gap Agent (Tavily)
Extracts site topic from homepage (Groq, short prompt). Runs 4 Tavily searches:
- `{topic} best {year}`
- `{topic} vs {competitor}`  
- `{topic} how to`
- `{topic} review`

For each search, checks if target site appears in top 10. If not → gap. Extracts: keyword, intent, top-ranking competitor, gap score (based on Tavily result position and estimated volume proxy).

Output: `KeywordGap[]` ranked by gap score.

### F3 — Monetisation Agent (Groq)
Takes site topic + page list. Prompt maps topics to affiliate categories:
`VPN/security | web hosting | finance/investing | health | software/SaaS | travel | e-commerce`

For each matched category: affiliate programme examples, typical commission range, which existing pages are candidates, pages with product mentions but no CTA (quick wins).

Output: `MonetisationOpportunity[]` with priority rating.

### F4 — CRO Agent (Groq)
Fetches homepage + top pages. Analyses:
- Clear value proposition above the fold?
- CTA presence and strength
- Social proof signals (testimonials, user counts, press)
- Trust signals (privacy policy, about page, contact)
- Content freshness indicators (dates on articles)

Output: pass/fail per factor with specific recommendation string.

### F5 — Growth Dashboard
Top metric cards:
- Overall opportunity score (0–100, composite)
- SEO issues count
- Keyword gaps count
- Estimated monthly revenue potential (keyword gaps × avg RPM for niche)

Below: 4 collapsible sections (one per agent), each with "Quick wins" list at top.
Bottom: Prioritised action backlog — all findings sorted by impact/effort ratio.

### F6 — Comparison Page Generator (Gemini 1.5 Flash)
User inputs two products. Pipeline:
1. Tavily search: `{product} features pricing review 2025` × 2
2. Fetch top 2 results each → pass full HTML to Gemini
3. Gemini extracts structured data: `{ name, price, keyFeatures, pros, cons, bestFor, rating }`
4. Gemini generates full comparison page HTML:
   - Intro paragraph
   - Feature comparison table (rows = features, columns = products)
   - Pros/cons per product
   - Verdict section (recommended for specific use cases)
   - FAQ (5 questions)
   - Affiliate CTA placeholders: `<a href="{{AFFILIATE_LINK_PRODUCT1}}" class="cta-button">Try {product} →</a>`

Output: rendered preview + raw HTML copy button.

### F7 — Content Brief Generator (Gemini 1.5 Flash)
Input: keyword (from gap list or manual entry). Output JSON rendered as formatted brief:
- Primary keyword + secondary keywords + related questions
- Recommended title tag and meta description
- Article structure (H2s and H3s in order)
- Recommended word count and depth
- Top 3 ranking competitors and what makes their content strong
- Claims to verify
- Internal linking suggestions
- Suggested affiliate CTAs
- One-paragraph commissioning note

Generation time target: ~8 seconds.

### F8 — Headline Tester (Groq)
Input: headline + goal (maximize CTR / increase authority / curiosity gap / target keyword / emotional resonance).
Output: 5 variants as JSON array `[{ variant, angle, reasoning, estimatedCTRScore }]` rendered as sortable cards.
"Combine best elements" button: sends all 5 back to Groq → synthesises single strongest headline.

### F9 — Audit History
List of past audits: URL, date, overall score, quick link to dashboard. Stored in Supabase. No auth — all audits visible to all users (demo context, no sensitive data).

---

## Data model

### `audits`
| column | type | notes |
|--------|------|-------|
| id | uuid | PK |
| url | text | input URL |
| status | text | queued / running / done / failed |
| seo_status | text | AgentStatus per agent |
| content_status | text | |
| monetisation_status | text | |
| cro_status | text | |
| topic | text | extracted by Groq from homepage |
| overall_score | int | 0–100 composite |
| created_at | timestamptz | |

### `audit_pages`
| column | type |
|--------|------|
| id | uuid |
| audit_id | uuid FK |
| url | text |
| title | text |
| seo_score | int |
| word_count | int |
| load_time_ms | int |
| issues | jsonb |
| created_at | timestamptz |

### `keyword_gaps`
| column | type |
|--------|------|
| id | uuid |
| audit_id | uuid FK |
| keyword | text |
| intent | text |
| gap_score | int |
| competitor | text |
| created_at | timestamptz |

### `monetisation_opportunities`
| column | type |
|--------|------|
| id | uuid |
| audit_id | uuid FK |
| category | text |
| commission_rate | text |
| programmes | jsonb |
| matching_pages | jsonb |
| priority | text |
| created_at | timestamptz |

### `cro_findings`
| column | type |
|--------|------|
| id | uuid |
| audit_id | uuid FK |
| factor | text |
| passed | bool |
| recommendation | text |
| created_at | timestamptz |

### `generated_content`
| column | type |
|--------|------|
| id | uuid |
| audit_id | uuid FK nullable |
| type | text | comparison / brief / headline |
| title | text |
| content | text | HTML or markdown |
| created_at | timestamptz |

---

## Non-requirements (explicitly out of scope)
- User authentication
- Billing / paywalls
- Full site crawl (>5 pages)
- Real-time keyword volume data (Tavily proxy only)
- PDF export (nice to have, not MVP)
- Anthropic API

---

## Success criteria for portfolio demo
- Audit completes in under 60 seconds for a real URL
- Comparison page output is publish-ready HTML
- Content brief covers all 9 fields
- Dashboard loads progressively as agents complete
- Deployed on Vercel with live URL
