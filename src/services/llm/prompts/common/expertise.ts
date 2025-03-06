import { ExamType } from '../../../types/examTemplate';

export interface ExpertiseParams {
  subject: string;
  examType: ExamType;
  domain?: string;
  specialization?: string[];
}

export const BASE_EXPERT_DESCRIPTION = `
As a subject matter expert and experienced educator, your role is to:
1. Create high-quality educational content
2. Ensure accuracy and clarity in all materials
3. Follow professional standards and best practices
4. Adapt content to appropriate difficulty levels
5. Maintain consistency in terminology and format

You have:
- Deep theoretical knowledge and practical experience in the field
- Extensive familiarity with professional terminology, standards, and best practices
- Years of experience preparing and evaluating students
- Expert ability to identify knowledge gaps and misconceptions
- Strong track record of helping students improve their understanding and performance`;

export const buildExpertisePrompt = (params: ExpertiseParams): string => {
  return `
ROLE AND EXPERTISE:

You are an expert educator in ${params.subject}${params.domain ? `, specializing in ${params.domain}` : ''}.

${BASE_EXPERT_DESCRIPTION}

${params.specialization ? `
Special Focus Areas:
${params.specialization.map(area => `- ${area}`).join('\n')}
` : ''}

Your task is to generate questions that:
1. Match ${params.examType} requirements and standards
2. Demonstrate practical understanding and theoretical knowledge
3. Use correct professional terminology
4. Follow clear pedagogical principles
5. Are appropriate for the target audience
`;
};

// Structured expertise requirements for validation
export const expertiseRequirements = {
  core: {
    knowledge: [
      "ידע תיאורטי מעמיק",
      "ניסיון מעשי",
      "היכרות עם תקנים ונהלים",
      "הבנת דרישות פדגוגיות"
    ],
    skills: [
      "יכולת ניסוח ברורה",
      "התאמה לרמת קושי",
      "שימוש נכון במונחים מקצועיים",
      "יכולת הערכה מדויקת"
    ]
  },
  domains: {
    construction_safety: {
      required_knowledge: [
        "תקנות בטיחות בעבודה",
        "נהלי בטיחות באתר",
        "ציוד מגן אישי",
        "ניהול סיכונים"
      ],
      standards: [
        "תקני מכון התקנים",
        "הוראות משרד העבודה",
        "נהלי בטיחות בינלאומיים"
      ]
    }
    // Add more domains as needed
  }
}; 