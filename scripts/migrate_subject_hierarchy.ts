import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check required environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables: REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

// Initialize Supabase client with service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseKey);

interface Domain {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  description: string;
  domains: Domain[];
}

interface SubTopic {
  id: string;
  name: string;
  description: string;
  typicalQuestions?: {
    multiple_choice?: string;
    open?: string;
    numerical?: string;
  };
  percentageOfTotal?: number;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  subTopics: SubTopic[];
}

interface SubjectData {
  domainID: string;
  subjectID: string;
  description: string;
  topics: Topic[];
}

async function migrateSubjectHierarchy() {
  try {
    // Read subjects and domains
    const subjectsDomainsPath = path.join(process.cwd(), 'data/subjects/subjects_domains.json');
    const subjectsData = JSON.parse(fs.readFileSync(subjectsDomainsPath, 'utf8')) as { Subjects: Subject[] };

    // Read subject-specific data
    const subjectFiles = fs.readdirSync(path.join(process.cwd(), 'data/subjects'))
      .filter(file => file.endsWith('.json') && file !== 'subjects_domains.json');

    for (const subject of subjectsData.Subjects) {
      // Insert subject
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .insert({
          code: subject.code,
          name: subject.name,
          description: subject.description
        })
        .select('id')
        .single();

      if (subjectError) throw subjectError;
      const subjectId = subjectData.id;

      // Insert domains
      for (const domain of subject.domains) {
        const { data: domainData, error: domainError } = await supabase
          .from('domains')
          .insert({
            subject_id: subjectId,
            code: domain.code,
            name: domain.name,
            description: domain.description
          })
          .select('id')
          .single();

        if (domainError) throw domainError;
        const domainId = domainData.id;

        // Find and process subject-specific data
        const subjectFile = subjectFiles.find(file => file.startsWith(domain.id));
        if (subjectFile) {
          const subjectDataPath = path.join(process.cwd(), 'data/subjects', subjectFile);
          const subjectData = JSON.parse(fs.readFileSync(subjectDataPath, 'utf8')) as SubjectData;

          // Insert topics
          for (const topic of subjectData.topics) {
            const { data: topicData, error: topicError } = await supabase
              .from('topics')
              .insert({
                domain_id: domainId,
                code: topic.id,
                name: topic.name,
                description: topic.description,
                order: 0
              })
              .select('id')
              .single();

            if (topicError) throw topicError;
            const topicId = topicData.id;

            // Insert subtopics
            for (const subtopic of topic.subTopics) {
              const { error: subtopicError } = await supabase
                .from('subtopics')
                .insert({
                  topic_id: topicId,
                  code: subtopic.id,
                  name: subtopic.name,
                  description: subtopic.description,
                  order: 0,
                  question_template: subtopic.typicalQuestions,
                  percentage_of_total: subtopic.percentageOfTotal
                });

              if (subtopicError) throw subtopicError;
            }
          }
        }
      }
    }

    console.log('Subject hierarchy migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateSubjectHierarchy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 