
ALTER TABLE applications
  ALTER COLUMN school_docs TYPE jsonb USING school_docs::jsonb;
ALTER TABLE applications
  ALTER COLUMN company_docs TYPE jsonb USING company_docs::jsonb;


