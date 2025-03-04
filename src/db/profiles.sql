-- Create profiles table
create table profiles (
  id uuid references auth.users(id) primary key,
  first_name text not null,
  last_name text not null,
  role text not null check (role in ('student', 'teacher', 'admin')),
  subscription_tier text not null check (subscription_tier in ('free', 'plus', 'pro')),
  usage_limits jsonb not null default '{
    "dailyFeedbackLimit": 10,
    "dailyQuestionLimit": 20,
    "hasPremiumQuestions": false,
    "hasDetailedAnalytics": false
  }',
  usage_history jsonb not null default '{
    "feedback_requests": [],
    "question_attempts": []
  }',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login_at timestamp with time zone default timezone('utc'::text, now()) not null,
  subscription_ends_at timestamp with time zone,
  
  constraint valid_usage_limits check (
    jsonb_typeof(usage_limits) = 'object' 
    and usage_limits ? 'dailyFeedbackLimit'
    and usage_limits ? 'dailyQuestionLimit'
    and usage_limits ? 'hasPremiumQuestions'
    and usage_limits ? 'hasDetailedAnalytics'
  ),
  constraint valid_usage_history check (
    jsonb_typeof(usage_history) = 'object'
    and usage_history ? 'feedback_requests'
    and usage_history ? 'question_attempts'
    and jsonb_typeof(usage_history->'feedback_requests') = 'array'
    and jsonb_typeof(usage_history->'question_attempts') = 'array'
  )
);

-- Create trigger to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, role, subscription_tier)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'firstName', ''),
    coalesce(new.raw_user_meta_data->>'lastName', ''),
    'student',  -- Default role
    'free'      -- Default tier
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable Row Level Security
alter table profiles enable row level security;

-- Create policies
-- Users can read their own profile
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

-- Users can update their own profile (except role and subscription)
create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id )
  with check (
    auth.uid() = id
    -- Prevent users from updating their role or subscription
    and role = OLD.role 
    and subscription_tier = OLD.subscription_tier
  );

-- Only admins can update roles and subscriptions
create policy "Admins can update all profiles"
  on profiles for update
  using ( 
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Only admins can delete profiles
create policy "Admins can delete profiles"
  on profiles for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  ); 