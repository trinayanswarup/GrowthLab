'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface HistoryRow {
  id: string
  target_url: string
  competitor_urls: string[]
  status: string
  opportunity_score: number | null
  topic: string | null
  tracked: boolean
  created_at: string
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${Math.max(1, mins)} minute${mins !== 1 ? 's' : ''} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

function OpportunityBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-[#4b5563] text-xs">—</span>
  const cls = score >= 60
    ? 'bg-red-500/15 text-red-400 border-red-500/30'
    : score >= 30
    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    : 'bg-green-500/15 text-green-400 border-green-500/30'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-mono font-bold ${cls}`}>
      {score}%
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    done:    'bg-green-500/15 text-green-400 border-green-500/30',
    running: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    queued:  'bg-blue-500/15 text-blue-400 border-blue-500/30',
    failed:  'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs capitalize ${map[status] ?? 'bg-[#1f1f1f] text-[#6b7280] border-[#2a2a2a]'}`}>
      {status}
    </span>
  )
}

function TrackButton({ reportId, initialTracked }: { reportId: string; initialTracked: boolean }) {
  const [tracked, setTracked] = useState(initialTracked)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/${reportId}/track`, { method: 'PATCH' })
      const data = await res.json()
      if (res.ok) setTracked(data.tracked)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${
        tracked
          ? 'bg-[#22d3ee]/15 text-[#22d3ee] border-[#22d3ee]/30 hover:bg-[#22d3ee]/25'
          : 'bg-[#1f1f1f] text-[#6b7280] border-[#2a2a2a] hover:text-[#a1a1aa] hover:border-[#3a3a3a]'
      }`}
    >
      {tracked ? '● Tracked' : '○ Track'}
    </button>
  )
}

export default function HistoryPage() {
  const [rows, setRows] = useState<HistoryRow[] | null>(null)

  useEffect(() => {
    fetch('/api/reports/history')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRows(data) })
      .catch(() => setRows([]))
  }, [])

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-semibold mb-1">Report History</h1>
      <p className="text-[#6b7280] text-sm mb-8">All competitive reports. Track a report to schedule weekly re-audits.</p>

      {rows === null && (
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse h-12 rounded-lg bg-[#111111] border border-[#1f1f1f]" />
          ))}
        </div>
      )}

      {rows && rows.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#6b7280] text-sm mb-4">No reports yet.</p>
          <Link href="/" className="text-sm text-[#22d3ee] hover:underline">
            Run your first competitive report →
          </Link>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-[#4b5563]">
                <th className="pb-3 pr-4 font-medium">Target</th>
                <th className="pb-3 pr-4 font-medium">Competitors</th>
                <th className="pb-3 pr-4 font-medium">Gap score</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Date</th>
                <th className="pb-3 pr-4 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[#1f1f1f] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4 max-w-[200px]">
                    <p className="text-[#ededed] text-xs font-mono truncate" title={r.target_url}>
                      {extractDomain(r.target_url)}
                    </p>
                    {r.topic && (
                      <p className="text-[#4b5563] text-xs mt-0.5 truncate">{r.topic}</p>
                    )}
                  </td>
                  <td className="py-3 pr-4 max-w-[200px]">
                    <p className="text-[#6b7280] text-xs truncate">
                      {r.competitor_urls.length > 0
                        ? r.competitor_urls.map(extractDomain).join(', ')
                        : '—'}
                    </p>
                  </td>
                  <td className="py-3 pr-4">
                    <OpportunityBadge score={r.opportunity_score} />
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="py-3 pr-4 text-xs text-[#4b5563] whitespace-nowrap">
                    {relativeTime(r.created_at)}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <TrackButton reportId={r.id} initialTracked={r.tracked} />
                      <Link
                        href={`/report/${r.id}`}
                        className="text-xs text-[#22d3ee] hover:underline whitespace-nowrap"
                      >
                        View →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
