-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- audits: one row per audit job
CREATE TABLE IF NOT EXISTS audits (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  url                   text NOT NULL,
  status                text NOT NULL DEFAULT 'queued',
  seo_status            text NOT NULL DEFAULT 'pending',
  content_status        text NOT NULL DEFAULT 'pending',
  monetisation_status   text NOT NULL DEFAULT 'pending',
  cro_status            text NOT NULL DEFAULT 'pending',
  topic                 text,
  overall_score         int,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- audit_pages: one row per crawled page per audit
CREATE TABLE IF NOT EXISTS audit_pages (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id     uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  url          text NOT NULL,
  title        text,
  seo_score    int,
  word_count   int,
  load_time_ms int,
  issues       jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- keyword_gaps: content gap findings per audit
CREATE TABLE IF NOT EXISTS keyword_gaps (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id   uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  keyword    text NOT NULL,
  intent     text NOT NULL,
  gap_score  int,
  competitor text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- monetisation_opportunities: affiliate opportunities per audit
CREATE TABLE IF NOT EXISTS monetisation_opportunities (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id        uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  category        text NOT NULL,
  commission_rate text,
  programmes      jsonb,
  matching_pages  jsonb,
  priority        text NOT NULL DEFAULT 'medium',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- cro_findings: CRO pass/fail factors per audit
CREATE TABLE IF NOT EXISTS cro_findings (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id       uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  factor         text NOT NULL,
  passed         bool NOT NULL,
  recommendation text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- generated_content: comparison pages, briefs, headline sets
CREATE TABLE IF NOT EXISTS generated_content (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id   uuid REFERENCES audits(id) ON DELETE SET NULL,
  type       text NOT NULL,
  title      text NOT NULL,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Session 5: Competitive intelligence tables ─────────────────────────────

CREATE TABLE IF NOT EXISTS reports (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_url           text NOT NULL,
  competitor_urls      text[] NOT NULL DEFAULT '{}',
  status               text NOT NULL DEFAULT 'queued',
  seo_status           text NOT NULL DEFAULT 'pending',
  presence_status      text NOT NULL DEFAULT 'pending',
  monetisation_status  text NOT NULL DEFAULT 'pending',
  cro_status           text NOT NULL DEFAULT 'pending',
  topic                text,
  opportunity_score    int,
  created_at           timestamptz NOT NULL DEFAULT now(),
  tracked              boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS presence_results (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id            uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  keyword              text NOT NULL,
  intent               text NOT NULL,
  target_present       boolean NOT NULL DEFAULT false,
  competitor1_present  boolean NOT NULL DEFAULT false,
  competitor2_present  boolean NOT NULL DEFAULT false,
  target_domain        text,
  competitor1_domain   text,
  competitor2_domain   text,
  top_result_domain    text,
  revenue_potential    text NOT NULL DEFAULT 'medium',
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_seo_pages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id    uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  url          text NOT NULL,
  title        text,
  seo_score    int NOT NULL DEFAULT 0,
  word_count   int NOT NULL DEFAULT 0,
  load_time_ms int NOT NULL DEFAULT 0,
  issues       jsonb NOT NULL DEFAULT '[]',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_generated_content (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id  uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  keyword    text,
  type       text NOT NULL,
  title      text NOT NULL,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
