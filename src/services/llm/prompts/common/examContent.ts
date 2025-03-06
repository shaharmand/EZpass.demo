import { ExamType } from '../../../types/examTemplate';

export const EXAM_CONTEXT: Record<ExamType, string> = {
  [ExamType.MAHAT_EXAM]: 'This is a MAHAT exam, a technical college certification exam that requires demonstrating both theoretical knowledge and practical understanding of industry standards.',
  [ExamType.BAGRUT_EXAM]: 'This is a Bagrut exam, the Israeli high school matriculation exam that tests comprehensive understanding of the curriculum.',
  [ExamType.UNI_COURSE_EXAM]: 'This is a university-level exam that requires demonstrating in-depth academic understanding.',
  [ExamType.ENTRY_EXAM]: 'This is an entry exam that evaluates foundational knowledge and readiness for advanced studies.',
  [ExamType.GOVERNMENT_EXAM]: 'This is a government certification exam that focuses on regulatory requirements and professional standards.'
};

export interface ExamContentRequirements {
  examType: ExamType;
  subject: string;
  level: string;
  specificRequirements?: string[];
}

export const buildExamPrompt = (params: ExamContentRequirements): string => {
  return `
EXAM-SPECIFIC REQUIREMENTS for ${params.examType}:

${EXAM_CONTEXT[params.examType]}

Subject: ${params.subject}
Level: ${params.level}

${params.specificRequirements ? `
Additional Requirements:
${params.specificRequirements.map(req => `- ${req}`).join('\n')}
` : ''}

Question Generation Guidelines:
1. Match the exam's academic level and style
2. Follow standard terminology for this exam type
3. Align with curriculum requirements
4. Use appropriate complexity for the exam level
5. Include practical applications where relevant
`;
};

// Structure for future exam-specific requirements
export const examRequirements = {
  questionStyle: {
    [ExamType.MAHAT_EXAM]: {
      focus: "practical_application",
      complexity: "medium_high",
      requirements: [
        "שילוב ידע תיאורטי ומעשי",
        "התייחסות לתקנים מקצועיים",
        "דגש על בטיחות ונהלים"
      ]
    },
    [ExamType.UNI_COURSE_EXAM]: {
      focus: "theoretical_understanding",
      complexity: "high",
      requirements: [
        "הבנה מעמיקה של החומר",
        "יישום עקרונות תיאורטיים",
        "ניתוח ופתרון בעיות מורכבות"
      ]
    }
    // To be expanded with other exam types
  }
}; 