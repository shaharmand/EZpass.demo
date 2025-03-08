-- First, ensure all existing rows have default values
UPDATE questions 
SET publication_metadata = '{"publishedAt": null, "publishedBy": null, "archivedAt": null, "archivedBy": null, "reason": null}'::jsonb
WHERE publication_metadata IS NULL;

UPDATE questions 
SET review_metadata = '{"reviewedAt": null, "reviewedBy": "system", "comments": null}'::jsonb
WHERE review_metadata IS NULL;

UPDATE questions 
SET ai_generated_fields = '{"fields": [], "confidence": {}, "generatedAt": null}'::jsonb
WHERE ai_generated_fields IS NULL;

-- Then make the columns non-nullable with default values
ALTER TABLE questions 
  ALTER COLUMN publication_metadata SET NOT NULL,
  ALTER COLUMN publication_metadata SET DEFAULT '{"publishedAt": null, "publishedBy": null, "archivedAt": null, "archivedBy": null, "reason": null}'::jsonb,
  ALTER COLUMN review_metadata SET NOT NULL,
  ALTER COLUMN review_metadata SET DEFAULT '{"reviewedAt": null, "reviewedBy": "system", "comments": null}'::jsonb,
  ALTER COLUMN ai_generated_fields SET NOT NULL,
  ALTER COLUMN ai_generated_fields SET DEFAULT '{"fields": [], "confidence": {}, "generatedAt": null}'::jsonb; 