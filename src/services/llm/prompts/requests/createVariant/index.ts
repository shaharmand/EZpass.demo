export const createVariantPrompt = {
  requirements: {
    input: {
      originalQuestion: {
        id: "string",
        type: "string",
        content: {
          text: "string",
          format: "markdown",
          options: Array<{
            text: "string",
            format: "markdown"
          }>
        },
        metadata: {
          subjectId: "string",
          domainId: "string",
          topicId: "string",
          subtopicId: "string",
          type: "string",
          difficulty: number,
          estimatedTime: number
        },
        schoolAnswer: {
          finalAnswer: {
            type: string,
            value: any,
            tolerance?: number,
            unit?: string
          } | null,
          solution: {
            text: "string",
            format: "markdown"
          }
        },
        evaluationGuidelines: {
          requiredCriteria: Array<{
            name: string,
            description: string,
            weight: number
          }>
        }
      },
      variantType: "difficulty" | "complexity" | "context",
      variantParams: {
        difficulty?: number,
        complexity?: number,
        context?: string
      }
    },
    output: {
      format: "json",
      structure: {
        variant: {
          id: "string",
          name: "string",
          type: "string",
          content: {
            text: "string",
            format: "markdown",
            options: Array<{
              text: "string",
              format: "markdown"
            }>
          },
          metadata: {
            subjectId: "string",
            domainId: "string",
            topicId: "string",
            subtopicId: "string",
            type: "string",
            difficulty: number,
            estimatedTime: number,
            answerFormat: {
              hasFinalAnswer: boolean,
              finalAnswerType: string,
              requiresSolution: boolean
            },
            source: {
              type: "ezpass",
              creatorType: "ai",
              variantOf: "string"
            }
          },
          schoolAnswer: {
            finalAnswer: {
              type: string,
              value: any,
              tolerance?: number,
              unit?: string
            } | null,
            solution: {
              text: "string",
              format: "markdown"
            }
          },
          evaluationGuidelines: {
            requiredCriteria: Array<{
              name: string,
              description: string,
              weight: number
            }>
          }
        }
      }
    },
    validation: {
      required: [
        "השאלה החדשה שומרת על המבנה המקורי",
        "התוכן שונה משמעותית מהמקור",
        "רמת הקושי תואמת את הפרמטרים המבוקשים",
        "הקריטריונים להערכה מסתכמים ל-100%",
        "התשובה והפתרון תואמים את סוג השאלה"
      ]
    }
  }
}; 