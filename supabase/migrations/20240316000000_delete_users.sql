-- First, delete from profiles (this will cascade to user data)
DELETE FROM auth.users
WHERE id IN (
  'user_id_1_here',  -- Replace with actual UUID
  'user_id_2_here'   -- Replace with actual UUID
);

-- The above will automatically:
-- 1. Delete the user from auth.users
-- 2. Trigger cascade deletion from public.profiles due to our foreign key
-- 3. Remove any associated authentication data 