export type AgentStatus = 'pending' | 'running' | 'done' | 'failed'

export interface AuditJob {
  id: string
  url: string
  status: 'queued' | 'running' | 'done' | 'failed'
  seo_status: AgentStatus
  content_status: AgentStatus
  monetisation_status: AgentStatus
  cro_status: AgentStatus
  topic: string | null
  overall_score: number | null
  created_at: string
}

export interface PageAudit {
  url: string
  title: string | null
  titleLength: number
  metaDescription: string | null
  metaDescriptionLength: number
  h1Count: number
  h2Count: number
  wordCount: number
  imagesWithoutAlt: number
  internalLinks: number
  externalLinks: number
  hasCanonical: boolean
  loadTimeMs: number
  score: number
  issues: string[]
}

export interface KeywordGap {
  keyword: string
  intent: 'informational' | 'commercial' | 'transactional'
  competitor: string
  gapScore: number
}

export interface MonetisationOpportunity {
  category: string
  commissionRate: string
  programmes: string[]
  matchingPages: string[]
  priority: 'high' | 'medium' | 'low'
}

export interface CROFinding {
  factor: string
  passed: boolean
  recommendation: string
}

export interface GeneratedContent {
  id: string
  audit_id: string | null
  type: 'comparison' | 'brief' | 'headline'
  title: string
  content: string
  created_at: string
}

export interface HeadlineVariant {
  variant: string
  angle: string
  reasoning: string
  estimatedCTRScore: number
}

export interface TavilyResult {
  url: string
  title: string
  content: string
  score: number
}

export interface TavilySearchResponse {
  results: TavilyResult[]
}
