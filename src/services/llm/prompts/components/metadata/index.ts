import { QuestionType } from '../../../../../types/question';
import { ExamType } from '../../../../../types/examTemplate';

export interface MetadataParams {
  subject: string;
  domain: string;
  topic: string;
  subtopic?: string;
  type: QuestionType;
  difficulty: number;
  examType: ExamType;
}

export const buildMetadataPrompt = (params: MetadataParams): string => {
  return `
METADATA REQUIREMENTS:
The metadata object MUST follow this exact structure:
{
  "metadata": {
    "subjectId": "${params.subject}",
    "domainId": "${params.domain}",
    "topicId": "${params.topic}",
    "subtopicId": "${params.subtopic || ''}",
    "type": "${params.type}",
    "difficulty": ${params.difficulty},  // Must be 1-5
    "source": {
      "type": "ezpass",
      "creatorType": "ai"
    },
    "answerFormat": {
      "hasFinalAnswer": ${params.type !== QuestionType.OPEN},
      "finalAnswerType": "${params.type === QuestionType.MULTIPLE_CHOICE ? 'multiple_choice' : 
                          params.type === QuestionType.NUMERICAL ? 'numerical' : 'none'}",
      "requiresSolution": true
    },
    "estimatedTime": 5  // MAHAT questions typically take 5 minutes
  }
}

MAHAT EXAM STYLE REQUIREMENTS:
1. Question Format:
   - Clear, concise professional language
   - Focus on practical applications
   - Reference to relevant regulations and standards
   - Industry-standard terminology

2. Difficulty Scale (MAHAT context):
   1 (קל מאוד): Basic regulation knowledge
   2 (קל): Simple application of regulations
   3 (בינוני): Multiple regulations or concepts
   4 (קשה): Complex scenarios, multiple considerations
   5 (קשה מאוד): Advanced integration of regulations and practical considerations

3. Time Management:
   - Questions should be answerable in ~5 minutes
   - Clear, focused scope
   - No unnecessary complexity

4. Professional Focus:
   - Emphasis on practical engineering scenarios
   - Real-world construction safety situations
   - Current industry standards and practices
   - Regulatory compliance requirements
`;
} 