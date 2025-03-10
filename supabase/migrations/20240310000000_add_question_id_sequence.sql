-- Create a table to store the last used ID for each subject-domain combination
CREATE TABLE IF NOT EXISTS question_id_sequences (
    subject_code text NOT NULL,
    domain_code text NOT NULL,
    last_used_id integer NOT NULL DEFAULT 0,
    PRIMARY KEY (subject_code, domain_code)
);

-- Create function to get next question number
CREATE OR REPLACE FUNCTION get_next_question_number(
    p_subject_code text,
    p_domain_code text
) RETURNS jsonb AS $$
DECLARE
    v_next_id integer;
BEGIN
    -- Insert or update the sequence row with advisory lock to prevent concurrent access
    -- The lock is based on the hash of subject_code and domain_code
    -- This ensures different subject-domain combinations can proceed in parallel
    IF pg_try_advisory_xact_lock(hashtext(p_subject_code || '-' || p_domain_code)) THEN
        INSERT INTO question_id_sequences (subject_code, domain_code, last_used_id)
        VALUES (p_subject_code, p_domain_code, 1)
        ON CONFLICT (subject_code, domain_code) DO UPDATE
        SET last_used_id = question_id_sequences.last_used_id + 1
        RETURNING last_used_id INTO v_next_id;

        -- Return the next ID as JSON
        RETURN jsonb_build_object('next_id', v_next_id);
    ELSE
        RAISE EXCEPTION 'Could not acquire lock for subject % domain %', p_subject_code, p_domain_code;
    END IF;
END;
$$ LANGUAGE plpgsql; 