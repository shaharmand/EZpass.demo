-- Create question_video_matches table
create table if not exists public.question_video_matches (
    question_id text references public.questions(id),
    video_matches jsonb,
    last_updated timestamp with time zone default timezone('utc'::text, now()),
    is_reviewed boolean default false,
    primary key (question_id)
);

-- Add RLS policies
alter table public.question_video_matches enable row level security;

-- Allow authenticated users to view matches
create policy "Users can view question video matches"
    on public.question_video_matches
    for select
    to authenticated
    using (true);

-- Allow service role to manage matches
create policy "Service role can manage question video matches"
    on public.question_video_matches
    for all
    to service_role
    using (true)
    with check (true);

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant select on public.question_video_matches to anon, authenticated;
grant all on public.question_video_matches to service_role; 