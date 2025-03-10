-- Drop existing objects if they exist
DROP FUNCTION IF EXISTS get_users_with_emails();
DROP VIEW IF EXISTS users_with_emails;

-- Create a secure function to get users with emails
CREATE OR REPLACE FUNCTION get_users_with_emails()
RETURNS TABLE (
    id uuid,
    role varchar,
    created_at timestamptz,
    first_name varchar,
    last_name varchar,
    avatar_url varchar,
    updated_at timestamptz,
    subscription_tier varchar,
    email varchar(255)
)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    SELECT 
        p.id::uuid,
        p.role::varchar,
        p.created_at::timestamptz,
        p.first_name::varchar,
        p.last_name::varchar,
        p.avatar_url::varchar,
        p.updated_at::timestamptz,
        p.subscription_tier::varchar,
        u.email::varchar(255)
    FROM profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_users_with_emails() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_users_with_emails IS 'Gets all users with their profile information and emails';

-- Rollback
-- DROP FUNCTION IF EXISTS get_users_with_emails(); 