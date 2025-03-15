-- Enable the moddatetime extension
create extension if not exists moddatetime schema extensions;

create table video_content (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  vimeo_id text not null,
  subtopic_id uuid not null,
  duration text not null,
  thumbnail text not null,
  "order" integer,
  tags text[],
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index video_content_subtopic_id_idx on video_content(subtopic_id);
create index video_content_is_active_idx on video_content(is_active);

-- Enable RLS
alter table video_content enable row level security;

-- Create RLS policies
create policy "Enable read access for all users" on video_content
  for select using (true);

create policy "Enable insert for authenticated users only" on video_content
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on video_content
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only" on video_content
  for delete using (auth.role() = 'authenticated');

-- Create updated_at trigger
create trigger handle_updated_at before update on video_content
  for each row execute procedure moddatetime (updated_at); 