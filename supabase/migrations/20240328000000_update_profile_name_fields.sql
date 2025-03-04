-- Step 1: Add new columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Step 2: Migrate existing data from full_name to first_name and last_name
DO $$
BEGIN
  -- Only run if full_name column exists
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'full_name'
  ) THEN
    -- Update the new columns with data from full_name
    UPDATE public.profiles 
    SET 
      first_name = COALESCE(split_part(full_name, ' ', 1), ''),
      last_name = CASE 
        WHEN position(' ' in full_name) > 0 
        THEN substring(full_name from position(' ' in full_name) + 1)
        ELSE ''
      END
    WHERE full_name IS NOT NULL;

    -- Drop the old column
    ALTER TABLE public.profiles DROP COLUMN full_name;
  END IF;
END $$;

-- Step 3: Update RLS Policies to include new columns
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  
  -- Recreate policies with updated columns
  CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

  -- For UPDATE policies, we don't compare with old values in the policy
  -- Instead, we only check what fields they're trying to update
  CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
      auth.uid() = id
      AND (
        CASE WHEN auth.role() != 'admin' THEN
          -- Regular users can't update role or subscription_tier
          role IS NULL AND subscription_tier IS NULL
        ELSE true
        END
      )
    );
END $$;

-- Step 4: Add trigger to sync auth.users metadata with profiles
CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user metadata in auth.users when profile is updated
  IF (TG_OP = 'UPDATE') THEN
    IF (NEW.first_name IS DISTINCT FROM OLD.first_name OR NEW.last_name IS DISTINCT FROM OLD.last_name) THEN
      UPDATE auth.users
      SET raw_user_meta_data = raw_user_meta_data || 
        jsonb_build_object(
          'first_name', NEW.first_name,
          'last_name', NEW.last_name
        )
      WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'sync_user_metadata_trigger'
  ) THEN
    CREATE TRIGGER sync_user_metadata_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_metadata();
  END IF;
END $$; 