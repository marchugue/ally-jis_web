-- ============================================================================
-- moderation_schema.sql
-- Blocks + Reports for Ally-jis moderation feature.
-- Run after schema.sql (needs profiles, conversations already created).
-- Violation taxonomy mirrors src/constants/communityStandards.ts exactly —
-- id strings here match ReportCategory.id / ReportViolation.id 1:1, so the
-- frontend's static list and the DB never drift out of sync silently.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- blocks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT blocks_not_self CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON blocks(blocked_id);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Backend uses supabaseAdmin (service role), which bypasses RLS. These
-- policies are defense-in-depth in case a client ever queries directly.
CREATE POLICY "Users can view their own blocks"
  ON blocks FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can create their own blocks"
  ON blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can remove their own blocks"
  ON blocks FOR DELETE
  USING (auth.uid() = blocker_id);


-- ----------------------------------------------------------------------------
-- report_categories (lookup) — top-level groups in COMMUNITY_STANDARDS.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_categories (
  id          text PRIMARY KEY,   -- matches ReportCategory.id, e.g. 'harassment'
  label       text NOT NULL,
  description text NOT NULL,
  sort_order  int  NOT NULL DEFAULT 0
);

ALTER TABLE report_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read report categories"
  ON report_categories FOR SELECT
  USING (true);


-- ----------------------------------------------------------------------------
-- violations (lookup) — leaf reasons nested under each category.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS violations (
  id          text PRIMARY KEY,   -- matches ReportViolation.id, e.g. 'harassment-direct'
  category_id text NOT NULL REFERENCES report_categories(id) ON DELETE CASCADE,
  label       text NOT NULL,
  description text NOT NULL,
  sort_order  int  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_violations_category_id ON violations(category_id);

ALTER TABLE violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read violations"
  ON violations FOR SELECT
  USING (true);


-- ----------------------------------------------------------------------------
-- Seed data — copied 1:1 from COMMUNITY_STANDARDS in the frontend.
-- If you edit the taxonomy on the frontend, mirror the change here too
-- (or move the source of truth to the DB and generate the frontend list
-- from a GET /lookups/violations endpoint instead — say the word if you
-- want that refactor).
-- ----------------------------------------------------------------------------

INSERT INTO report_categories (id, label, description, sort_order) VALUES
  ('harassment',            'Harassment & Bullying',       'Targeted, repeated, or intimidating behavior toward you or someone else.', 1),
  ('hate-speech',            'Hate Speech & Discrimination', 'Attacks based on identity, background, or protected characteristics.', 2),
  ('inappropriate-content',  'Inappropriate Content',        'Content that violates campus or platform decency standards.', 3),
  ('safety',                 'Safety Concerns',              'Situations that may put someone at real-world risk.', 4),
  ('academic-integrity',     'Academic Integrity',           'Misuse of the platform related to coursework or exams.', 5),
  ('other',                  'Something Else',               'Doesn''t fit the categories above but still feels wrong.', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO violations (id, category_id, label, description, sort_order) VALUES
  -- harassment
  ('harassment-direct',        'harassment', 'Direct harassment',            'Repeated unwanted messages, insults, or threats directed at you.', 1),
  ('harassment-bullying',      'harassment', 'Bullying or mocking',          'Demeaning, humiliating, or mocking content targeting a person.', 2),
  ('harassment-doxxing',       'harassment', 'Sharing private information',  'Posting someone''s personal details without consent.', 3),
  ('harassment-impersonation', 'harassment', 'Impersonation',                'Pretending to be another student, staff member, or organization.', 4),

  -- hate-speech
  ('hate-identity', 'hate-speech', 'Attacks based on identity',      'Content targeting race, religion, gender, sexuality, or disability.', 1),
  ('hate-slurs',     'hate-speech', 'Slurs or derogatory language',  'Use of slurs or dehumanizing language toward a group.', 2),

  -- inappropriate-content
  ('content-sexual',   'inappropriate-content', 'Sexual content',    'Explicit or sexually suggestive messages, images, or links.', 1),
  ('content-violence', 'inappropriate-content', 'Graphic violence',  'Disturbing, graphic, or violent images or descriptions.', 2),
  ('content-spam',     'inappropriate-content', 'Spam or scams',     'Unsolicited ads, links, or repeated promotional messages.', 3),

  -- safety
  ('safety-self-harm', 'safety', 'Self-harm or suicide risk', 'Messages indicating someone may be at risk of harming themselves.', 1),
  ('safety-threats',   'safety', 'Threats of violence',       'Explicit or implied threats of physical harm toward someone.', 2),
  ('safety-minor',     'safety', 'Concern involving a minor', 'Content or behavior that may endanger someone underage.', 3),

  -- academic-integrity
  ('academic-cheating',   'academic-integrity', 'Sharing exam answers or cheating', 'Coordinating cheating or distributing exam content.', 1),
  ('academic-plagiarism', 'academic-integrity', 'Selling or distributing coursework', 'Selling assignments, theses, or other academic work.', 2),

  -- other
  ('other-unspecified', 'other', 'Other issue', 'A concern that doesn''t match the listed categories.', 1)
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- reports
--
-- reporter_id / reported_user_id are nullable with ON DELETE SET NULL
-- (rather than CASCADE) so a report survives if either account is later
-- deleted — otherwise a reported user could delete their account to erase
-- the report, and you'd lose the audit trail for repeat-offender patterns.
-- The *_snapshot columns preserve a human-readable identity even after the
-- FK is nulled out. Populate them at insert time in createReport().
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id               uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  reported_user_id          uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  reporter_username_snapshot   text,
  reported_username_snapshot   text,
  violation_id              text        NOT NULL REFERENCES violations(id),
  conversation_id            uuid        REFERENCES conversations(id) ON DELETE SET NULL,
  status                    text        NOT NULL DEFAULT 'pending'
                                         CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at                timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT reports_not_self CHECK (
    reporter_id IS NULL OR reported_user_id IS NULL OR reporter_id <> reported_user_id
  )
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_id      ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status           ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_violation_id      ON reports(violation_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own submitted reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can submit reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- No UPDATE/DELETE policy for regular users — status changes to
-- 'reviewed'/'dismissed' should only happen via an admin/moderator role
-- using supabaseAdmin.