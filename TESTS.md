# GrowthLab — Testing Strategy

Framework: Vitest (consistent with Connecta pattern).

---

## What to test

### Unit tests — pure functions only (no API calls, no DB)

#### SEO Auditor (`/lib/agents/seo-auditor.ts`)

These are deterministic given HTML input — high value to test.

```typescript
// seo-auditor.test.ts

describe('scorePage', () => {
  it('returns 100 for a perfect page', () => {
    const audit = scorePage({
      title: 'Best VPN for Streaming (Under 60 chars)',
      metaDescription: 'Find the best VPN for streaming Netflix in 2025. Under 155 characters.',
      h1Count: 1,
      h2Count: 3,
      wordCount: 800,
      imagesWithoutAlt: 0,
      loadTimeMs: 1200,
      hasCanonical: true,
    })
    expect(audit.score).toBe(100)
    expect(audit.issues).toHaveLength(0)
  })

  it('penalises missing title', () => {
    const audit = scorePage({ title: null, ... })
    expect(audit.score).toBeLessThan(85)
    expect(audit.issues).toContain('Missing title tag')
  })

  it('penalises title over 60 chars', () => { ... })
  it('penalises missing meta description', () => { ... })
  it('penalises multiple H1s', () => { ... })
  it('penalises slow load time (>3000ms)', () => { ... })
  it('penalises images without alt text', () => { ... })
})

describe('extractInternalLinks', () => {
  it('returns up to 4 unique internal links', () => {
    const html = `<a href="/page1">...</a><a href="/page2">...</a><a href="https://external.com">...</a>`
    const links = extractInternalLinks(html, 'https://example.com')
    expect(links).toHaveLength(2)
    expect(links.every(l => l.startsWith('https://example.com'))).toBe(true)
  })

  it('deduplicates links', () => { ... })
  it('ignores anchor links (#section)', () => { ... })
  it('ignores mailto: and tel: links', () => { ... })
})
```

#### Content Gap Agent (`/lib/agents/content-gap.ts`)

```typescript
describe('classifyIntent', () => {
  it('classifies "how to" queries as informational', () => {
    expect(classifyIntent('best vpn how to setup')).toBe('informational')
  })
  it('classifies "best X" as commercial', () => {
    expect(classifyIntent('best vpn for streaming')).toBe('commercial')
  })
  it('classifies "X vs Y" as transactional', () => {
    expect(classifyIntent('nordvpn vs expressvpn')).toBe('transactional')
  })
})

describe('checkDomainInResults', () => {
  it('returns true when domain appears in results', () => { ... })
  it('returns false when domain is absent', () => { ... })
  it('handles subdomain variations', () => { ... })
})
```

#### Dashboard score computation

```typescript
describe('computeOverallScore', () => {
  it('weights correctly: 30% SEO, 25% content, 25% monetisation, 20% CRO', () => {
    const score = computeOverallScore({
      seoScore: 100,
      contentScore: 100,
      monetisationScore: 100,
      croScore: 100,
    })
    expect(score).toBe(100)
  })

  it('handles missing agent data gracefully (treats as 0)', () => { ... })
})

describe('computeRevenueEstimate', () => {
  it('applies correct RPM for VPN/security category', () => {
    const est = computeRevenueEstimate('VPN/security', 5)
    expect(est.low).toBeGreaterThan(0)
    expect(est.high).toBeGreaterThan(est.low)
  })
})
```

#### Action backlog sorting

```typescript
describe("sortByImpactEffort", () => {
  it("sorts by impact/effort ratio descending", () => {
    const actions = [
      { impact: 5, effort: 4 }, // ratio 1.25
      { impact: 8, effort: 2 }, // ratio 4.0 — should be first
      { impact: 3, effort: 3 }, // ratio 1.0
    ];
    const sorted = sortByImpactEffort(actions);
    expect(sorted[0].impact).toBe(8);
  });
});
```

---

## Integration tests (manual, not automated)

Run these manually after each session before committing.

### Session 2 checklist

- [ ] POST /api/audit with `{ url: 'https://cybernews.com' }` returns `{ auditId }`
- [ ] GET /api/audits/[id]/status returns audit row
- [ ] After ~30s, `seo_status` is 'done'
- [ ] `audit_pages` table has 1–5 rows for this audit_id
- [ ] Dashboard renders page cards with scores

### Session 3 checklist

- [ ] `keyword_gaps` table has rows after content agent completes
- [ ] At least one gap has correct intent classification
- [ ] Dashboard shows keyword section

### Session 4 checklist

- [ ] POST /api/generate/comparison with `{ product1: 'NordVPN', product2: 'ExpressVPN' }` returns HTML
- [ ] HTML contains: comparison table, pros/cons, verdict section, FAQ, affiliate CTA placeholders
- [ ] `{{AFFILIATE_LINK_PRODUCT1}}` and `{{AFFILIATE_LINK_PRODUCT2}}` present in output

### Session 5 checklist

- [ ] All 4 agents complete for a test URL
- [ ] `overall_score` is set in audits table
- [ ] `monetisation_opportunities` table has at least 1 row
- [ ] `cro_findings` table has 5 rows (one per factor)

### Session 7 checklist

- [ ] POST /api/generate/brief with `{ keyword: 'best vpn for streaming' }` returns all 9 fields
- [ ] POST /api/generate/headline with `{ headline: 'Best VPN 2025', goal: 'maximize CTR' }` returns array of 5 variants

---

## What NOT to test

- API route handlers directly (too much mocking overhead)
- Gemini / Groq / Tavily responses (external, non-deterministic)
- Supabase reads/writes (integration, needs real DB)
- React components (not worth it for a portfolio project)

---

## Test setup (add after Session 1)

```bash
npm install -D vitest @vitest/coverage-v8
```

`vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
});
```

`package.json` add:

```json
"test": "vitest run",
"test:watch": "vitest"
```
