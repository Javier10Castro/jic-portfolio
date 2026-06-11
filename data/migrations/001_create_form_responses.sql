CREATE TABLE IF NOT EXISTS form_responses (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  section VARCHAR(64) NOT NULL,
  field_key VARCHAR(128) NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_responses_project_id ON form_responses(project_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_section ON form_responses(section);
