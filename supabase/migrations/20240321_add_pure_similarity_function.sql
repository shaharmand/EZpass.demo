-- Function to match videos based on pure cosine similarity
create or replace function match_videos_pure(
    query_embedding vector(1536),
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
    where 1 - (video_content.embedding <=> query_embedding) > similarity_threshold
    order by video_content.embedding <=> query_embedding
    limit max_results;
end;
$$; 