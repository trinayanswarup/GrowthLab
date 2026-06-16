'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Search, FileText, BarChart2, Zap, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [targetUrl, setTargetUrl] = useState('')
  const [topic, setTopic] = useState('')
  const [competitor1, setCompetitor1] = useState('')
  const [competitor2, setCompetitor2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!targetUrl || !topic) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          topic,
          competitorUrls: [competitor1, competitor2].filter(Boolean),
        }),
      })
      const data = await res.json()
      if (data.reportId) router.push(`/report/${data.reportId}`)
      else setError('Failed to create report')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleDemo() {
    setTargetUrl('https://backlinko.com')
    setTopic('SEO tools')
    setCompetitor1('https://ahrefs.com')
    setCompetitor2('https://semrush.com')
  }

  const tools = [
    {
      category: 'PRESENCE ANALYSIS',
      icon: Search,
      title: 'See every keyword your competitors rank for — and you don\'t',
      description: 'Map the competitive landscape across 12 commercial queries. Know exactly where to attack, backed by real SERP signals.',
      href: '/',
    },
    {
      category: 'CONTENT GENERATION',
      icon: FileText,
      title: 'One keyword gap, one click, one publish-ready page',
      description: 'SEO-optimized comparison pages with affiliate CTAs, researched and written by AI in under 60 seconds.',
      href: '/tools',
    },
    {
      category: 'EDITORIAL PLANNING',
      icon: BarChart2,
      title: 'Brief your writers with data, not assumptions',
      description: 'Full editorial briefs for any keyword gap — structure, word count, CTAs, secondary keywords, and commissioning notes.',
      href: '/tools',
    },
    {
      category: 'COPY OPTIMIZATION',
      icon: Zap,
      title: 'Stop guessing which headline will win clicks',
      description: '5 AI-scored variants per goal. Combine the strongest elements into one title that drives traffic before you publish.',
      href: '/tools',
    },
    {
      category: 'MONITORING',
      icon: Clock,
      title: 'Never miss a shift in your competitive landscape',
      description: 'Presence checks re-run every 24 hours. Track any report and wake up to fresh, accurate competitive data.',
      href: '/history',
    },
    {
      category: 'TECHNICAL SEO',
      icon: TrendingUp,
      title: 'Know exactly what\'s holding your pages back',
      description: 'Score every crawled page 0-100. Instantly surface title tag, meta description, alt text, and speed issues.',
      href: '/',
    },
  ]

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[700px] h-[400px] -z-10 pointer-events-none">
          <div className="absolute inset-0 rounded-full bg-[var(--accent)]/10 blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-14 text-center">

          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-10)] border border-[var(--accent-30)] px-3.5 py-1.5 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            <span className="text-xs font-semibold text-[var(--accent)] tracking-wide">Competitive Growth Intelligence</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-extrabold text-[var(--text-primary)] leading-[1.1] tracking-tight mb-5 max-w-2xl mx-auto">
            Find every gap.<br />Win every keyword.
          </h1>

          {/* Subtext */}
          <p className="text-base text-[var(--text-secondary)] max-w-lg mx-auto mb-10 leading-relaxed">
            Enter your site and two competitors. GrowthLab maps where they rank and you don&apos;t — then generates publish-ready content to close the gap.
          </p>

          {/* Form card */}
          <div className="max-w-2xl mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 text-left shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1.5">Your site</label>
                  <input
                    type="url"
                    value={targetUrl}
                    onChange={e => setTargetUrl(e.target.value)}
                    placeholder="https://yoursite.com"
                    required
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1.5">Topic / niche</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. SEO tools, VPN software"
                    required
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1.5">Competitor 1 <span className="font-normal normal-case">(optional)</span></label>
                  <input
                    type="url"
                    value={competitor1}
                    onChange={e => setCompetitor1(e.target.value)}
                    placeholder="https://competitor1.com"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1.5">Competitor 2 <span className="font-normal normal-case">(optional)</span></label>
                  <input
                    type="url"
                    value={competitor2}
                    onChange={e => setCompetitor2(e.target.value)}
                    placeholder="https://competitor2.com"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-[var(--error)]">{error}</p>}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading || !targetUrl || !topic}
                  className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? 'Running analysis…' : (
                    <>Run Analysis <ArrowRight className="h-3.5 w-3.5" /></>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDemo}
                  className="px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-2)] transition-colors whitespace-nowrap"
                >
                  Try demo
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--border)]" />

      {/* Tools section */}
      <div className="max-w-6xl mx-auto px-6 py-16 pb-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)] mb-2">SOLUTIONS (6)</p>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Everything you need to compete.</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map(tool => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group block bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--accent-40)] hover:bg-[var(--surface-2)] transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--accent)]">{tool.category}</p>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] leading-snug mb-3">
                {tool.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
