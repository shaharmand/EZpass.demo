export const fullGenerationPrompt = {
  requirements: {
    input: {
      subjectId: "string",
      domainId: "string",
      topicId: "string",
      subtopicId: "string",
      type: "multiple_choice" | "numerical" | "open",
      difficulty: number,
      estimatedTime: number
    },
    output: {
      format: "json",
      structure: {
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
            creatorType: "ai"
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
    },
    validation: {
      required: [
        "כל השדות החובה מלאים",
        "הפורמט נכון",
        "המבנה תואם את סוג השאלה",
        "הקריטריונים להערכה מסתכמים ל-100%",
        "התשובה והפתרון תואמים את סוג השאלה"
      ]
    }
  }
}; 