-- Enable the pgvector extension
create extension if not exists vector;

-- Create the video content table
create table video_content (
    id bigint primary key generated always as identity,
    lesson_number integer not null,
    segment_number integer not null,
    title text not null,
    subtopic text not null,
    content text not null,
    embedding vector(1536),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Add a unique constraint on lesson and segment numbers
    unique(lesson_number, segment_number)
);

-- Create an index for vector similarity search
create index on video_content 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Debug function that returns more details about matching
create or replace function match_videos_debug(
    query_embedding vector(1536),
    subtopic text,
    subtopic_boost float default 0.3,
    similarity_threshold float default 0.6,
    max_results int default 5
)
returns table (
    id bigint,
    lesson_number integer,
    segment_number integer,
    title text,
    subtopic text,
    content text,
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
            lesson_number,
            segment_number,
            title,
            subtopic,
            content,
            1 - (embedding <=> query_embedding) as similarity,
            case 
                when subtopic = $2 then 
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
    id bigint,
    lesson_number integer,
    segment_number integer,
    title text,
    summary text,
    similarity float,
    final_score float
)
language plpgsql
as $$
begin
    return query
    select
        video_content.id,
        video_content.lesson_number,
        video_content.segment_number,
        video_content.title,
        video_content.summary,
        1 - (video_content.embedding <=> query_embedding) as similarity,
        case 
            when video_content.subtopic = subtopic then 
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
    id bigint,
    lesson_number integer,
    segment_number integer,
    title text,
    content text,
    similarity float
)
language plpgsql
as $$
begin
    return query
    select
        video_content.id,
        video_content.lesson_number,
        video_content.segment_number,
        video_content.title,
        video_content.content,
        1 - (video_content.embedding <=> query_embedding) as similarity
    from video_content
    where 
        video_content.subtopic = subtopic
        and 1 - (video_content.embedding <=> query_embedding) > similarity_threshold
    order by video_content.embedding <=> query_embedding
    limit max_results;
end;
$$; 