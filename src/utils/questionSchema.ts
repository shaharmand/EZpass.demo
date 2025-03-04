import { QuestionType } from '../types/question';

export const questionSchema = {
  type: "object",
  required: ["id", "type", "content", "solution", "metadata"],
  properties: {
    id: {
      type: "string",
      pattern: "^[A-Z]{3}-[A-Z]{3}-\\d{6}$",
      description: "Question ID in format SUB-DOM-123456"
    },
    name: {
      type: "string",
      maxLength: 100,
      description: "Short descriptive name for the question"
    },
    type: {
      type: "string",
      enum: Object.values(QuestionType),
      description: "Type of question (multiple choice, numerical, or open)"
    },
    content: {
      type: "object",
      required: ["text", "format"],
      properties: {
        text: {
          type: "string",
          description: "Question text in markdown. Math must use $$ or \\[\\]. Code must use ``` with language"
        },
        format: {
          type: "string",
          enum: ["markdown"]
        }
      }
    },
    solution: {
      type: "object",
      required: ["text", "format"],
      properties: {
        text: {
          type: "string",
          description: "Solution text in markdown format"
        },
        format: {
          type: "string",
          enum: ["markdown"]
        }
      }
    },
    options: {
      type: "array",
      items: { type: "string" },
      minItems: 4,
      maxItems: 4,
      description: "Required for multiple_choice questions"
    },
    correctOption: {
      type: "number",
      minimum: 1,
      maximum: 4,
      description: "Required for multiple_choice questions - index of correct answer"
    },
    metadata: {
      type: "object",
      required: ["subjectId", "domainId", "topicId", "subtopicId", "difficulty", "estimatedTime", "source"],
      properties: {
        subjectId: { type: "string" },
        domainId: { type: "string" },
        topicId: { type: "string" },
        subtopicId: { type: "string" },
        difficulty: {
          type: "number",
          minimum: 1,
          maximum: 5
        },
        estimatedTime: {
          type: "number",
          minimum: 1
        },
        programmingLanguage: {
          type: "string",
          enum: ["java", "c#", "python"]
        },
        source: {
          type: "object",
          required: ["sourceType"],
          properties: {
            sourceType: {
              type: "string", 
              enum: ["exam", "book", "author", "ezpass"]
            },
            examTemplateId: { type: "string" },
            year: { 
              type: "number",
              minimum: 1900
            },
            season: {
              type: "string",
              enum: ["spring", "summer"]
            },
            moed: {
              type: "string",
              enum: ["a", "b"]
            },
            bookName: { type: "string" },
            authorName: { type: "string" }
          }
        }
      }
    },
    evaluation: {
      type: "object",
      required: ["rubricAssessment", "answerRequirements"],
      properties: {
        rubricAssessment: {
          type: "object",
          required: ["criteria"],
          properties: {
            criteria: {
              type: "array",
              items: { type: "string" },
              minItems: 1
            }
          }
        },
        answerRequirements: {
          type: "object",
          required: ["requiredElements"],
          properties: {
            requiredElements: {
              type: "array",
              items: { type: "string" },
              minItems: 1
            }
          }
        }
      }
    }
  }
}; 