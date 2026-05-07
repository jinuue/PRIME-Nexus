-- Migration: Align schema with supervisor/HR backend refactor
-- Ensures school_docs and company_docs in applications can store status and signedBy per document

ALTER TABLE IF EXISTS applications
  ALTER COLUMN school_docs TYPE jsonb USING school_docs::jsonb,
  ALTER COLUMN company_docs TYPE jsonb USING company_docs::jsonb;

-- No new columns are strictly required for DTR or document actions, as all fields are present.
-- If you need to enforce a structure for school_docs/company_docs, consider using JSON Schema validation or triggers (not included here).

-- Add any further ALTER TABLE statements below if new fields are added in the future.
