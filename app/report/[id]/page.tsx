'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Report, PresenceResult, AgentStatus } from '@/types'

interface MonetisationRow {
  id: string
  category: string
  commission_rate: string
  programmes: string[]
  matching_pages: string[]
  cta_missing_pages: string[]
  priority: 'high' | 'medium' | 'low'
}

interface CRORow {
  id: string
  factor: string
  passed: boolean
  recommendation: string
}

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
  const [monetisation, setMonetisation] = useState<MonetisationRow[] | null>(null)
  const [cro, setCro] = useState<CRORow[] | null>(null)
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

  // Fetch monetisation once done
  useEffect(() => {
    if (!reportId || report?.monetisation_status !== 'done') return
    fetch(`/api/reports/${reportId}/monetisation`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setMonetisation(data) })
      .catch(console.error)
  }, [reportId, report?.monetisation_status])

  // Fetch CRO once done
  useEffect(() => {
    if (!reportId || report?.cro_status !== 'done') return
    fetch(`/api/reports/${reportId}/cro`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCro(data) })
      .catch(console.error)
  }, [reportId, report?.cro_status])

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

      {/* Monetisation */}
      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6b7280] mb-4">
          Monetisation Opportunities
        </h2>

        {(report.monetisation_status === 'pending' || report.monetisation_status === 'running') && (
          <div className="flex flex-col gap-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border border-[#1f1f1f] bg-[#111111] p-4 h-20" />
            ))}
          </div>
        )}

        {report.monetisation_status === 'failed' && (
          <p className="text-[#6b7280] text-sm">Monetisation analysis unavailable.</p>
        )}

        {monetisation && monetisation.length > 0 && (
          <div className="flex flex-col gap-3">
            {monetisation.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg border p-4 ${m.cta_missing_pages.length > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-[#1f1f1f] bg-[#111111]'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-[#ededed]">{m.category}</span>
                  {m.cta_missing_pages.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Quick win
                    </span>
                  )}
                  <span className={`ml-auto text-xs font-mono font-bold ${m.priority === 'high' ? 'text-green-400' : m.priority === 'medium' ? 'text-yellow-400' : 'text-[#6b7280]'}`}>
                    {m.priority}
                  </span>
                </div>
                <p className="text-xs text-[#22d3ee] font-mono mb-2">{m.commission_rate}</p>
                <p className="text-xs text-[#6b7280]">{m.programmes.join(' · ')}</p>
              </div>
            ))}
          </div>
        )}

        {monetisation && monetisation.length === 0 && report.monetisation_status === 'done' && (
          <p className="text-[#6b7280] text-sm">No affiliate opportunities identified.</p>
        )}
      </section>

      {/* CRO */}
      <section className="mt-10 mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6b7280] mb-4">
          CRO Analysis
        </h2>

        {(report.cro_status === 'pending' || report.cro_status === 'running') && (
          <div className="flex flex-col gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse h-10 rounded bg-[#111111] border border-[#1f1f1f]" />
            ))}
          </div>
        )}

        {report.cro_status === 'failed' && (
          <p className="text-[#6b7280] text-sm">CRO analysis unavailable.</p>
        )}

        {cro && cro.length > 0 && (
          <div className="flex flex-col divide-y divide-[#1f1f1f] rounded-lg border border-[#1f1f1f] overflow-hidden">
            {cro.map((c) => (
              <div key={c.id} className="flex items-start gap-3 px-4 py-3 bg-[#111111]">
                <span className={`text-base mt-0.5 ${c.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {c.passed ? '✓' : '✕'}
                </span>
                <div>
                  <p className="text-xs font-mono text-[#a1a1aa] mb-0.5">{c.factor}</p>
                  <p className={`text-sm ${c.passed ? 'text-[#ededed]' : 'text-red-300'}`}>{c.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
