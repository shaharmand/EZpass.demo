import { QuestionType } from '../../../types/question';
import { GENERAL_FORMATTING_GUIDELINES } from './common/formatting';
import { universalTopicsV2 } from '../../universalTopics';
import type { Topic, SubTopic } from '../../../types/subject';

// Default guidance for each question type if no domain-specific guidance exists
const DEFAULT_TYPE_GUIDANCE = {
  [QuestionType.MULTIPLE_CHOICE]: {
    focus: [
      'שאלה ברורה עם תשובה נכונה אחת',
      'אפשרויות מסיחות הגיוניות',
      'דרישה להסבר הבחירה',
      'התייחסות לידע מעשי ותיאורטי'
    ]
  },
  [QuestionType.OPEN]: {
    focus: [
      'שאלה המעודדת חשיבה וניתוח',
      'דרישה להסבר מפורט',
      'יישום ידע תיאורטי במצבים מעשיים',
      'הצגת פתרונות מנומקים'
    ]
  },
  [QuestionType.NUMERICAL]: {
    focus: [
      'נתונים ברורים לחישוב',
      'דרישה להצגת דרך הפתרון',
      'שימוש ביחידות מידה מתאימות',
      'הסבר משמעות התוצאה'
    ]
  }
} as const;

export function buildQuestionGenerationPrompt(params: {
  type: QuestionType;
  subject: string;
  domain: string;
  topic?: string;
  subtopic?: string;
  additionalContext?: string; // For future knowledge enrichment
}) {
  // Get hierarchy info from universalTopics
  const subject = universalTopicsV2.getSubjectSafe(params.subject);
  if (!subject) throw new Error('Subject not found');

  const domain = universalTopicsV2.getDomainSafe(params.subject, params.domain);
  if (!domain) throw new Error('Domain not found');

  // If topic is provided, validate it exists
  let topic: Topic | undefined;
  if (params.topic) {
    topic = domain.topics.find((t: Topic) => t.id === params.topic);
    if (!topic) throw new Error('Topic not found');
  }

  // If subtopic is provided, validate it exists under the topic
  let subtopic: SubTopic | undefined;
  if (topic && params.subtopic) {
    subtopic = topic.subTopics.find((s: SubTopic) => s.id === params.subtopic);
    if (!subtopic) throw new Error('Subtopic not found');
  }

  // Build context based on whether we have a topic or need to list all
  let contextSection: string;
  if (topic) {
    // If we have a specific topic, focus just on that
    const topicContext = [
      `Topic: ${topic.name} (${topic.id})`,
      `Description: ${topic.description}`,
      '',
      'Available Subtopics:',
      ...topic.subTopics.map(s => `  - ${s.name} (${s.id}): ${s.description}`)
    ].join('\n');

    contextSection = `CONTEXT:
Subject: ${subject.name}
Domain: ${domain.name}
${topicContext}
${subtopic ? `\nSelected Subtopic: ${subtopic.name}\nDescription: ${subtopic.description}` : ''}`;
  } else {
    // If no topic specified, list all topics for selection
    const availableTopics = domain.topics.map(t => 
      `  * ${t.name} (${t.id}): ${t.description}`
    ).join('\n');

    contextSection = `CONTEXT:
Subject: ${subject.name}
Domain: ${domain.name}

Available Topics in ${domain.name}:
${availableTopics}

Please select an appropriate topic and subtopic for the question based on the content.`;
  }

  return `${GENERAL_FORMATTING_GUIDELINES}

${contextSection}

Question Type: ${params.type}

${params.additionalContext || ''}`; // Place for future knowledge enrichment
} 