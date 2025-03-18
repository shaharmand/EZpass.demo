-- Enable the moddatetime extension
create extension if not exists moddatetime schema extensions;

-- Create subjects table
create table subjects (
    id uuid default gen_random_uuid() primary key,
    code text not null unique,
    name text not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create domains table
create table domains (
    id uuid default gen_random_uuid() primary key,
    subject_id uuid not null references subjects(id) on delete cascade,
    code text not null,
    name text not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(subject_id, code)
);

-- Create topics table
create table topics (
    id uuid default gen_random_uuid() primary key,
    domain_id uuid not null references domains(id) on delete cascade,
    code text not null,
    name text not null,
    description text,
    "order" integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(domain_id, code)
);

-- Create subtopics table
create table subtopics (
    id uuid default gen_random_uuid() primary key,
    topic_id uuid not null references topics(id) on delete cascade,
    code text not null,
    name text not null,
    description text,
    "order" integer default 0,
    question_template jsonb,
    typical_questions jsonb,
    percentage_of_total float,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(topic_id, code)
);

-- Create indexes
create index domains_subject_id_idx on domains(subject_id);
create index topics_domain_id_idx on topics(domain_id);
create index subtopics_topic_id_idx on subtopics(topic_id);

-- Enable RLS
alter table subjects enable row level security;
alter table domains enable row level security;
alter table topics enable row level security;
alter table subtopics enable row level security;

-- Create RLS policies for subjects
create policy "Enable read access for all users" on subjects
    for select using (true);

create policy "Enable insert for authenticated users only" on subjects
    for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on subjects
    for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only" on subjects
    for delete using (auth.role() = 'authenticated');

-- Create RLS policies for domains
create policy "Enable read access for all users" on domains
    for select using (true);

create policy "Enable insert for authenticated users only" on domains
    for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on domains
    for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only" on domains
    for delete using (auth.role() = 'authenticated');

-- Create RLS policies for topics
create policy "Enable read access for all users" on topics
    for select using (true);

create policy "Enable insert for authenticated users only" on topics
    for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on topics
    for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only" on topics
    for delete using (auth.role() = 'authenticated');

-- Create RLS policies for subtopics
create policy "Enable read access for all users" on subtopics
    for select using (true);

create policy "Enable insert for authenticated users only" on subtopics
    for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on subtopics
    for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only" on subtopics
    for delete using (auth.role() = 'authenticated');

-- Create updated_at triggers
create trigger handle_updated_at before update on subjects
    for each row execute procedure moddatetime (updated_at);

create trigger handle_updated_at before update on domains
    for each row execute procedure moddatetime (updated_at);

create trigger handle_updated_at before update on topics
    for each row execute procedure moddatetime (updated_at);

create trigger handle_updated_at before update on subtopics
    for each row execute procedure moddatetime (updated_at); 