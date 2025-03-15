-- Add name columns if they don't exist
DO $$ 
BEGIN 
    -- Add first_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles' 
                  AND column_name = 'first_name') THEN
        ALTER TABLE public.profiles 
        ADD COLUMN first_name text NOT NULL DEFAULT '';
    END IF;

    -- Add last_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles' 
                  AND column_name = 'last_name') THEN
        ALTER TABLE public.profiles 
        ADD COLUMN last_name text NOT NULL DEFAULT '';
    END IF;
END $$;

-- Migrate existing data from auth.users metadata to profiles
DO $$
DECLARE
    user_record RECORD;
    v_first_name text;
    v_last_name text;
BEGIN
    -- Loop through all users in auth.users
    FOR user_record IN 
        SELECT 
            id,
            raw_user_meta_data
        FROM auth.users
    LOOP
        -- Extract names from metadata using the same logic as our trigger
        IF user_record.raw_user_meta_data->>'first_name' IS NOT NULL THEN
            -- Direct first/last name fields
            v_first_name := user_record.raw_user_meta_data->>'first_name';
            v_last_name := user_record.raw_user_meta_data->>'last_name';
        ELSIF user_record.raw_user_meta_data->>'full_name' IS NOT NULL THEN
            -- Full name from Google
            v_first_name := split_part(user_record.raw_user_meta_data->>'full_name', ' ', 1);
            v_last_name := substr(user_record.raw_user_meta_data->>'full_name', 
                              length(split_part(user_record.raw_user_meta_data->>'full_name', ' ', 1)) + 2);
        ELSIF user_record.raw_user_meta_data->>'name' IS NOT NULL THEN
            -- Name from OAuth
            v_first_name := split_part(user_record.raw_user_meta_data->>'name', ' ', 1);
            v_last_name := substr(user_record.raw_user_meta_data->>'name', 
                              length(split_part(user_record.raw_user_meta_data->>'name', ' ', 1)) + 2);
        ELSE
            -- Fallback to empty strings
            v_first_name := '';
            v_last_name := '';
        END IF;

        -- Update the profile if it exists
        UPDATE public.profiles
        SET 
            first_name = COALESCE(v_first_name, ''),
            last_name = COALESCE(v_last_name, ''),
            updated_at = NOW()
        WHERE id = user_record.id
        AND (profiles.first_name IS NULL OR profiles.last_name IS NULL OR profiles.first_name = '' OR profiles.last_name = '');

    END LOOP;
END $$;

-- Update the handle_new_user trigger to ensure it handles names properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_first_name text;
    v_last_name text;
BEGIN
    -- Extract first and last name from metadata
    -- Try different metadata fields in order of preference
    IF new.raw_user_meta_data->>'first_name' IS NOT NULL THEN
        -- Direct first/last name fields (from our signup)
        v_first_name := new.raw_user_meta_data->>'first_name';
        v_last_name := new.raw_user_meta_data->>'last_name';
    ELSIF new.raw_user_meta_data->>'full_name' IS NOT NULL THEN
        -- Full name from Google (split it)
        v_first_name := split_part(new.raw_user_meta_data->>'full_name', ' ', 1);
        v_last_name := substr(new.raw_user_meta_data->>'full_name', length(split_part(new.raw_user_meta_data->>'full_name', ' ', 1)) + 2);
    ELSIF new.raw_user_meta_data->>'name' IS NOT NULL THEN
        -- Name from OAuth (split it)
        v_first_name := split_part(new.raw_user_meta_data->>'name', ' ', 1);
        v_last_name := substr(new.raw_user_meta_data->>'name', length(split_part(new.raw_user_meta_data->>'name', ' ', 1)) + 2);
    ELSE
        -- Fallback to empty strings
        v_first_name := '';
        v_last_name := '';
    END IF;

    -- Insert the new profile
    INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        role,
        subscription_tier,
        updated_at
    ) VALUES (
        new.id,
        COALESCE(v_first_name, ''),
        COALESCE(v_last_name, ''),
        'student',  -- Default role
        'free',     -- Default subscription tier
        NOW()
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user(); 