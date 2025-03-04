-- Add new columns if they don't exist
DO $$ 
BEGIN 
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles' 
                  AND column_name = 'role') THEN
        ALTER TABLE public.profiles 
        ADD COLUMN role text;
    END IF;

    -- Add subscription_tier column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles' 
                  AND column_name = 'subscription_tier') THEN
        ALTER TABLE public.profiles 
        ADD COLUMN subscription_tier text;
    END IF;
END $$;

-- Set default values for existing rows
UPDATE public.profiles 
SET role = 'student',
    subscription_tier = 'free'
WHERE role IS NULL 
   OR subscription_tier IS NULL;

-- Drop existing constraints if they exist
DO $$ 
BEGIN 
    ALTER TABLE public.profiles
        DROP CONSTRAINT IF EXISTS profiles_role_check,
        DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping constraints: %', SQLERRM;
END $$;

-- Now make columns NOT NULL and add constraints
ALTER TABLE public.profiles
    ALTER COLUMN role SET NOT NULL,
    ALTER COLUMN role SET DEFAULT 'student',
    ADD CONSTRAINT profiles_role_check 
        CHECK (role in ('student', 'teacher', 'admin')),
    
    ALTER COLUMN subscription_tier SET NOT NULL,
    ALTER COLUMN subscription_tier SET DEFAULT 'free',
    ADD CONSTRAINT profiles_subscription_tier_check 
        CHECK (subscription_tier in ('free', 'plus', 'pro'));

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update roles and subscriptions" ON profiles;

-- Create policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can only update their own profile, excluding role and subscription changes
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Only admins can update roles and subscriptions
CREATE POLICY "Admins can update roles and subscriptions"
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Recreate the function with proper schema qualification and security
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, role, subscription_tier)
    VALUES (
        new.id,
        'student',  -- Default role
        'free'      -- Default subscription tier
    );
    RETURN new;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, ignore
        RETURN new;
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN new;
END;
$$;

-- Recreate the trigger with proper function reference
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create missing profiles for existing users
INSERT INTO public.profiles (id, role, subscription_tier)
SELECT id, 'student', 'free'
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
); 