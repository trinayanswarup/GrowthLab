'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Report, PresenceResult, AgentStatus } from '@/types'

// ─── Helpers ───────────────────────────────────────────────────────────────

const REVENUE_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

function sortMatrix(rows: PresenceResult[]): PresenceResult[] {
  return [...rows].sort((a, b) => {
    // Gaps first (target absent)
    const aGap = !a.target_present ? 0 : 1
    const bGap = !b.target_present ? 0 : 1
    if (aGap !== bGap) return aGap - bGap
    // Then high revenue first
    return (REVENUE_ORDER[a.revenue_potential] ?? 1) - (REVENUE_ORDER[b.revenue_potential] ?? 1)
  })
}

const INTENT_STYLE: Record<string, string> = {
  commercial:    'bg-amber-500/15 text-amber-400 border-amber-500/30',
  transactional: 'bg-green-500/15 text-green-400 border-green-500/30',
  informational: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

const REVENUE_LABEL: Record<string, string> = { high: '$$$', medium: '$$', low: '$' }
const REVENUE_STYLE: Record<string, string> = {
  high:   'text-green-400',
  medium: 'text-yellow-400',
  low:    'text-[#6b7280]',
}

// ─── Sub-components ────────────────────────────────────────────────────────

function TraceItem({ status, label }: { status: AgentStatus; label: string }) {
  const config = {
    done:    { icon: '✓', cls: 'text-green-400' },
    running: { icon: '◌', cls: 'text-amber-400 animate-pulse' },
    failed:  { icon: '✕', cls: 'text-red-400' },
    pending: { icon: '○', cls: 'text-[#4b5563]' },
  }[status]

  return (
    <div className={`flex items-center gap-2 text-sm font-mono ${config.cls}`}>
      <span className="w-4 text-center">{config.icon}</span>
      <span>{label}</span>
    </div>
  )
}

function PresenceCell({ present }: { present: boolean }) {
  return present
    ? <span className="text-green-400 font-bold">✓</span>
    : <span className="text-red-400">✕</span>
}

function QuickWins({ matrix, reportId }: { matrix: PresenceResult[]; reportId: string }) {
  const wins = matrix
    .filter((r) => !r.target_present && (r.competitor1_present || r.competitor2_present) && r.intent !== 'informational')
    .sort((a, b) => (REVENUE_ORDER[a.revenue_potential] ?? 1) - (REVENUE_ORDER[b.revenue_potential] ?? 1))
    .slice(0, 3)

  if (wins.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6b7280] mb-3">
        Quick Wins
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {wins.map((r) => (
          <div key={r.id || r.keyword} className="rounded-lg border border-[#1f1f1f] bg-[#111111] p-4">
            <p className="text-sm text-[#ededed] font-mono mb-3 leading-snug">{r.keyword}</p>
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${INTENT_STYLE[r.intent]}`}>
                {r.intent}
              </span>
              <span className={`text-xs font-mono font-bold ${REVENUE_STYLE[r.revenue_potential]}`}>
                {REVENUE_LABEL[r.revenue_potential]}
              </span>
            </div>
            <Link
              href={`/tools?keyword=${encodeURIComponent(r.keyword)}&reportId=${reportId}`}
              className="text-xs text-[#22d3ee] hover:underline"
            >
              Generate content →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-t border-[#1f1f1f]">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="py-3 px-3">
          <div className="h-3 bg-[#2a2a2a] rounded w-full" />
        </td>
      ))}
    </tr>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────

interface Props {
  params: { id: string }
}

export default function ReportPage({ params }: Props) {
  const reportId = params.id
  const [report, setReport] = useState<Report | null>(null)
  const [matrix, setMatrix] = useState<PresenceResult[] | null>(null)
  const [notFound, setNotFound] = useState(false)

  // Poll report status
  useEffect(() => {
    if (!reportId) return
    let stopped = false

    async function poll() {
      while (!stopped) {
        try {
          const res = await fetch(`/api/reports/${reportId}/status`)
          if (res.status === 404) { setNotFound(true); return }
          const data: Report = await res.json()
          setReport(data)
          if (data.status === 'done' || data.status === 'failed') return
        } catch { /* keep polling */ }
        await new Promise((r) => setTimeout(r, 2000))
      }
    }

    poll()
    return () => { stopped = true }
  }, [reportId])

  // Fetch matrix once presence is done
  useEffect(() => {
    if (!reportId || report?.presence_status !== 'done') return
    fetch(`/api/reports/${reportId}/matrix`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setMatrix(sortMatrix(data)) })
      .catch(console.error)
  }, [reportId, report?.presence_status])

  if (notFound) {
    return <div className="p-8"><p className="text-red-400">Report not found.</p></div>
  }

  if (!report) {
    return <div className="p-8"><p className="text-[#6b7280] text-sm animate-pulse">Loading report…</p></div>
  }

  const targetDomain = report.target_url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const c1Domain = report.competitor_urls[0]?.replace(/^https?:\/\//, '').replace(/\/$/, '') ?? null
  const c2Domain = report.competitor_urls[1]?.replace(/^https?:\/\//, '').replace(/\/$/, '') ?? null
  const isRunning = report.status === 'running' || report.status === 'queued'

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold truncate mb-1">{report.target_url}</h1>
        {report.topic && (
          <p className="text-sm text-[#6b7280]">Topic: <span className="text-[#22d3ee]">{report.topic}</span></p>
        )}
      </div>

      {/* Agent trace */}
      <div className="rounded-lg border border-[#1f1f1f] bg-[#111111] p-4 mb-6 flex flex-col gap-2">
        <TraceItem status={report.seo_status} label="SEO crawl" />
        <TraceItem status={report.presence_status} label="Presence check (12 queries)" />
        <TraceItem status={report.monetisation_status} label="Monetisation mapping" />
        <TraceItem status={report.cro_status} label="CRO analysis" />
      </div>

      {/* Opportunity score */}
      {report.opportunity_score != null && (
        <div className="mb-8 inline-flex items-center gap-4 px-5 py-4 rounded-xl border border-[#1f1f1f] bg-[#111111]">
          <span className="text-5xl font-mono font-bold text-[#22d3ee]">
            {report.opportunity_score}%
          </span>
          <div>
            <p className="text-sm font-medium text-[#ededed]">opportunity score</p>
            <p className="text-xs text-[#6b7280] mt-0.5 max-w-xs">
              % of commercial queries where competitors appear in results and you don&apos;t
            </p>
          </div>
        </div>
      )}

      {/* Quick wins */}
      {matrix && <QuickWins matrix={matrix} reportId={report.id} />}

      {/* Presence matrix */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6b7280] mb-4">
          Presence Matrix
        </h2>

        {(report.presence_status === 'pending' || report.presence_status === 'running') && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <tbody>{[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}</tbody>
            </table>
          </div>
        )}

        {report.presence_status === 'failed' && (
          <p className="text-[#6b7280] text-sm">Presence check failed — search API may be unavailable.</p>
        )}

        {matrix && matrix.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[#4b5563]">
                  <th className="pb-3 pr-3 font-medium">Keyword</th>
                  <th className="pb-3 pr-3 font-medium">Intent</th>
                  <th className="pb-3 pr-3 font-medium truncate max-w-[120px]">{targetDomain}</th>
                  {c1Domain && <th className="pb-3 pr-3 font-medium truncate max-w-[120px]">{c1Domain}</th>}
                  {c2Domain && <th className="pb-3 pr-3 font-medium truncate max-w-[120px]">{c2Domain}</th>}
                  <th className="pb-3 pr-3 font-medium">Revenue</th>
                  <th className="pb-3 font-medium"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => {
                  const isGap = !row.target_present && (row.competitor1_present || row.competitor2_present)
                  return (
                    <tr
                      key={row.id || row.keyword}
                      className={`border-t border-[#1f1f1f] ${isGap ? 'bg-red-500/5' : ''}`}
                    >
                      <td className="py-3 pr-3 font-mono text-xs text-[#ededed] max-w-[200px]">
                        <span title={row.keyword} className="block truncate">{row.keyword}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs capitalize ${INTENT_STYLE[row.intent]}`}>
                          {row.intent}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-center">
                        <PresenceCell present={row.target_present} />
                      </td>
                      {c1Domain && (
                        <td className="py-3 pr-3 text-center">
                          <PresenceCell present={row.competitor1_present} />
                        </td>
                      )}
                      {c2Domain && (
                        <td className="py-3 pr-3 text-center">
                          <PresenceCell present={row.competitor2_present} />
                        </td>
                      )}
                      <td className={`py-3 pr-3 text-xs font-mono font-bold ${REVENUE_STYLE[row.revenue_potential]}`}>
                        {REVENUE_LABEL[row.revenue_potential]}
                      </td>
                      <td className="py-3">
                        {isGap && (
                          <Link
                            href={`/tools?keyword=${encodeURIComponent(row.keyword)}&reportId=${report.id}`}
                            className="text-xs text-[#22d3ee] hover:underline whitespace-nowrap"
                          >
                            Generate →
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {matrix && matrix.length === 0 && !isRunning && (
          <p className="text-[#6b7280] text-sm">No presence data found.</p>
        )}
      </section>
    </div>
  )
}
