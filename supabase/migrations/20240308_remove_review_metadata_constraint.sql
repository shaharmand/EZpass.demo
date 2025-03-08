-- Remove the review metadata constraint
ALTER TABLE IF EXISTS questions DROP CONSTRAINT IF EXISTS valid_review_metadata;

-- Note: The trigger that manages review_metadata will remain in place
-- This allows the trigger to handle the metadata updates without constraint interference 