-- Migration script to update existing data to use UUIDs

-- Function to update existing preps in prep_state JSON
CREATE OR REPLACE FUNCTION update_prep_ids_in_json() RETURNS void AS $$
DECLARE
    prep RECORD;
BEGIN
    -- Process each preparation
    FOR prep IN SELECT id, prep_state FROM user_preparations 
    LOOP
        -- If the prep_state has an id that doesn't match the record id
        -- Update it to match the UUID now in the id column
        IF prep.prep_state->>'id' <> prep.id::text THEN
            UPDATE user_preparations
            SET prep_state = jsonb_set(prep_state, '{id}', to_jsonb(prep.id::text))
            WHERE id = prep.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function
SELECT update_prep_ids_in_json();

-- Drop the function after use
DROP FUNCTION update_prep_ids_in_json();

-- Add metadata field to existing preparations
UPDATE user_preparations
SET prep_state = jsonb_set(
    prep_state, 
    '{metadata}', 
    jsonb_build_object(
        'examId', COALESCE(prep_state->'exam'->>'id', 'unknown'),
        'createdAt', extract(epoch from created_at)::bigint * 1000,
        'migrated', true,
        'originalId', prep_state->>'id'
    )
)
WHERE prep_state->>'metadata' IS NULL; 