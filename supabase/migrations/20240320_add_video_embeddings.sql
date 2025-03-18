-- Enable the vector extension
create extension if not exists vector;

-- Add embedding column to video_content if it doesn't exist
do $$ 
begin
    if not exists (
        select 1 
        from information_schema.columns 
        where table_name = 'video_content' 
        and column_name = 'embedding'
    ) then
        alter table video_content
        add column embedding vector(1536);
    end if;
end $$;

-- Create an index for vector similarity search if it doesn't exist
do $$
begin
    if not exists (
        select 1
        from pg_indexes
        where tablename = 'video_content'
        and indexname = 'video_content_embedding_idx'
    ) then
        create index video_content_embedding_idx on video_content 
        using ivfflat (embedding vector_cosine_ops)
        with (lists = 100);
    end if;
end $$;

-- Debug function that returns more details about matching
create or replace function match_videos_debug(
    query_embedding vector(1536),
    subtopic text,
    subtopic_boost float default 0.3,
    similarity_threshold float default 0.6,
    max_results int default 5
)
returns table (
    id uuid,
    title text,
    description text,
    vimeo_id text,
    subtopic_id uuid,
    similarity float,
    final_score float,
    rank int
)
language plpgsql
as $$
begin
    return query
    with similarities as (
        select
            id,
            title,
            description,
            vimeo_id,
            subtopic_id,
            1 - (embedding <=> query_embedding) as similarity,
            case 
                when subtopic_id::text = subtopic then 
                    (1 - (embedding <=> query_embedding)) * (1 + subtopic_boost)
                else 
                    1 - (embedding <=> query_embedding)
            end as final_score
        from video_content
        where 1 - (embedding <=> query_embedding) > similarity_threshold
    )
    select 
        *,
        row_number() over (order by final_score desc) as rank
    from similarities
    order by final_score desc
    limit max_results;
end;
$$;

-- Production function with cleaner output
create or replace function match_videos_weighted(
    query_embedding vector(1536),
    subtopic text,
    subtopic_boost float default 0.3,
    similarity_threshold float default 0.6,
    max_results int default 3
)
returns table (
    id uuid,
    title text,
    description text,
    vimeo_id text,
    subtopic_id uuid,
    similarity float,
    final_score float
)
language plpgsql
as $$
begin
    return query
    select
        video_content.id,
        video_content.title,
        video_content.description,
        video_content.vimeo_id,
        video_content.subtopic_id,
        1 - (video_content.embedding <=> query_embedding) as similarity,
        case 
            when video_content.subtopic_id::text = subtopic then 
                (1 - (video_content.embedding <=> query_embedding)) * (1 + subtopic_boost)
            else 
                1 - (video_content.embedding <=> query_embedding)
        end as final_score
    from video_content
    where 1 - (video_content.embedding <=> query_embedding) > similarity_threshold
    order by final_score desc
    limit max_results;
end;
$$;

-- Helper function to search within specific subtopic only
create or replace function match_videos_subtopic(
    query_embedding vector(1536),
    subtopic text,
    similarity_threshold float default 0.6,
    max_results int default 3
)
returns table (
    id uuid,
    title text,
    description text,
    vimeo_id text,
    subtopic_id uuid,
    similarity float
)
language plpgsql
as $$
begin
    return query
    select
        video_content.id,
        video_content.title,
        video_content.description,
        video_content.vimeo_id,
        video_content.subtopic_id,
        1 - (video_content.embedding <=> query_embedding) as similarity
    from video_content
    where 
        video_content.subtopic_id::text = subtopic
        and 1 - (video_content.embedding <=> query_embedding) > similarity_threshold
    order by video_content.embedding <=> query_embedding
    limit max_results;
end;
$$;

-- Add subtopic_id to lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS subtopic_id uuid REFERENCES subtopics(id);

-- Update existing lessons with their subtopic_ids based on video_content
UPDATE public.lessons l
SET subtopic_id = vc.subtopic_id::uuid
FROM video_content vc
WHERE vc.lesson_id = l.id
AND vc.subtopic_id IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lessons_subtopic_id ON public.lessons(subtopic_id);

-- Remove subtopic_id from lessons table since it's better to determine a lesson's subtopics through its videos
ALTER TABLE public.lessons DROP COLUMN IF EXISTS subtopic_id;
DROP INDEX IF EXISTS idx_lessons_subtopic_id; 