-- First, drop ALL existing policies
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update roles and subscriptions" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Make sure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create all necessary policies
CREATE POLICY "Enable read access for all profiles" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);  -- Allow all authenticated users to read all profiles

CREATE POLICY "Enable insert access for own profile" ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update access for own profile" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        -- Allow users to update their own profile
        auth.uid() = id
        OR
        -- Or if they are updating someone else's profile, check if they are an admin
        EXISTS (
            SELECT 1 FROM profiles admin_check 
            WHERE admin_check.id = auth.uid() 
            AND admin_check.role = 'admin'
            AND admin_check.id != profiles.id  -- Prevent recursion by excluding self-update
        )
    )
    WITH CHECK (
        -- Same conditions as USING clause
        auth.uid() = id
        OR
        EXISTS (
            SELECT 1 FROM profiles admin_check 
            WHERE admin_check.id = auth.uid() 
            AND admin_check.role = 'admin'
            AND admin_check.id != profiles.id
        )
    );

-- Update your role to admin first (this needs to happen before the policies take effect)
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = '5846a714-9cc8-4317-b2c6-b50ea365efc7';

-- In case we need to rollback
-- DROP POLICY IF EXISTS "Enable read access for all profiles" ON public.profiles;
-- DROP POLICY IF EXISTS "Enable insert access for own profile" ON public.profiles;
-- DROP POLICY IF EXISTS "Enable update access for own profile" ON public.profiles;
-- UPDATE public.profiles SET role = 'student' WHERE id = '5846a714-9cc8-4317-b2c6-b50ea365efc7'; 