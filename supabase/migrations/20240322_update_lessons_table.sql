-- Add topic_id column to lessons table
alter table lessons
  add column topic_id uuid references topics(id) on delete set null;

-- Create index for topic_id
create index lessons_topic_id_idx on lessons(topic_id); 