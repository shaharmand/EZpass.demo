-- Set initial admin user
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = '5846a714-9cc8-4317-b2c6-b50ea365efc7';

-- In case we need to rollback
-- UPDATE public.profiles SET role = 'student' WHERE id = '5846a714-9cc8-4317-b2c6-b50ea365efc7'; 