-- Create courses table
create table if not exists public.courses (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    code text not null unique,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create lessons table
create table if not exists public.lessons (
    id uuid default gen_random_uuid() primary key,
    course_id uuid references public.courses(id) not null,
    title text not null,
    description text,
    lesson_number integer not null,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(course_id, lesson_number)
);

-- Add lesson_id to video_content table
alter table public.video_content
add column lesson_id uuid references public.lessons(id);

-- Create indexes
create index lessons_course_id_idx on public.lessons(course_id);
create index video_content_lesson_id_idx on public.video_content(lesson_id);

-- Enable RLS
alter table public.courses enable row level security;
alter table public.lessons enable row level security;

-- Create RLS policies for courses
create policy "Enable read access for all users" on public.courses
    for select using (true);

create policy "Enable insert for authenticated users only" on public.courses
    for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on public.courses
    for update using (auth.role() = 'authenticated');

-- Create RLS policies for lessons
create policy "Enable read access for all users" on public.lessons
    for select using (true);

create policy "Enable insert for authenticated users only" on public.lessons
    for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on public.lessons
    for update using (auth.role() = 'authenticated');

-- Insert the Construction Safety course
insert into public.courses (title, description, code)
values (
    'Construction Safety',
    'Comprehensive course covering all aspects of construction safety and workplace safety roles',
    'CIV-SAF'
)
on conflict (code) do nothing; 