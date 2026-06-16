'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface RecentReport {
  id: string
  target_url: string
  competitor_urls: string[]
  status: string
  opportunity_score: number | null
  created_at: string
}

function normaliseUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export default function HomePage() {
  const router = useRouter()
  const [targetUrl, setTargetUrl] = useState('')
  const [topic, setTopic] = useState('')
  const [competitor1, setCompetitor1] = useState('')
  const [competitor2, setCompetitor2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])

  useEffect(() => {
    fetch('/api/reports/recent')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRecentReports(data) })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const target = normaliseUrl(targetUrl)
    if (!target) { setError('Please enter your site URL'); return }
    if (!topic.trim()) { setError('Please enter a topic / niche'); return }

    const competitors = [competitor1, competitor2]
      .map(normaliseUrl)
      .filter(Boolean)

    setLoading(true)
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: target, topic: topic.trim(), competitorUrls: competitors }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start report')
      router.push(`/report/${data.reportId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold font-mono text-[#22d3ee] mb-3 tracking-tight">
          GrowthLab
        </h1>
        <p className="text-[#a1a1aa] text-base leading-relaxed">
          Find the keywords your competitors win.<br />
          Ship the content to close the gap.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-10">
        <div>
          <label className="block text-xs font-medium text-[#6b7280] mb-1.5 uppercase tracking-wider">
            Your site
          </label>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://yoursite.com"
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg bg-[#111111] border border-[#2a2a2a] text-[#ededed] placeholder-[#4b5563] text-sm focus:outline-none focus:border-[#22d3ee] transition-colors disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6b7280] mb-1.5 uppercase tracking-wider">
            Site topic / niche
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. SEO tools, VPN software, keyword research"
            required
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg bg-[#111111] border border-[#2a2a2a] text-[#ededed] placeholder-[#4b5563] text-sm focus:outline-none focus:border-[#22d3ee] transition-colors disabled:opacity-50"
          />
          <p className="text-xs text-[#4b5563] mt-1">Be specific — this determines what keywords we search for</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6b7280] mb-1.5 uppercase tracking-wider">
            Competitors <span className="text-[#4b5563] normal-case font-normal">(up to 2, optional)</span>
          </label>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={competitor1}
              onChange={(e) => setCompetitor1(e.target.value)}
              placeholder="https://competitor1.com"
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-lg bg-[#111111] border border-[#2a2a2a] text-[#ededed] placeholder-[#4b5563] text-sm focus:outline-none focus:border-[#2a2a2a] transition-colors disabled:opacity-50"
            />
            <input
              type="text"
              value={competitor2}
              onChange={(e) => setCompetitor2(e.target.value)}
              placeholder="https://competitor2.com"
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-lg bg-[#111111] border border-[#2a2a2a] text-[#ededed] placeholder-[#4b5563] text-sm focus:outline-none focus:border-[#2a2a2a] transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !targetUrl.trim() || !topic.trim()}
          className="px-5 py-3 rounded-lg bg-[#1d4ed8] text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Starting analysis…' : 'Run Competitive Analysis'}
        </button>
      </form>

      {/* Recent Reports */}
      {recentReports.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-[#4b5563] uppercase tracking-wider mb-3">
            Recent Reports
          </h2>
          <ul className="flex flex-col gap-1">
            {recentReports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/report/${r.id}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <span className="text-sm text-[#a1a1aa] group-hover:text-[#ededed] truncate">
                    {r.target_url.replace(/^https?:\/\//, '')}
                  </span>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {r.opportunity_score != null && (
                      <span className="text-xs font-mono text-[#22d3ee]">
                        {r.opportunity_score}% gap
                      </span>
                    )}
                    <span className="text-xs text-[#4b5563]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
