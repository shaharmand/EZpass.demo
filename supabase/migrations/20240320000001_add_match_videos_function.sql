-- Enable the vector extension if not already enabled
create extension if not exists vector;

-- Function to match videos based on embedding similarity
create or replace function match_videos(
    query_embedding vector(512),
    similarity_threshold float default 0.5,
    max_results int default 3,
    subtopic text default '',
    subtopic_boost float default 0.0
) returns table (
    id text,
    title text,
    content text,
    subtopic_name_he text,
    similarity float
) language plpgsql as $$
begin
    return query
    select 
        v.id,
        v.title,
        v.content,
        v.subtopic_name_he,
        (
            case 
                when v.subtopic_name_he = subtopic then
                    (1.0 - subtopic_boost) * (1 - (v.embedding <=> query_embedding)) + subtopic_boost
                else
                    (1 - (v.embedding <=> query_embedding))
            end
        ) as similarity
    from videos v
    where (1 - (v.embedding <=> query_embedding)) > similarity_threshold
    order by similarity desc
    limit max_results;
end;
$$; 