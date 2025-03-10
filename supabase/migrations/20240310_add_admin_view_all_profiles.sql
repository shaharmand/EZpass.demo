-- Add policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
        )
    );

-- In case we need to rollback
-- DROP POLICY "Admins can view all profiles" ON public.profiles; 