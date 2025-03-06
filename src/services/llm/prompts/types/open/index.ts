export const openPrompt = {
  requirements: {
    content: {
      text: {
        format: "markdown",
        requirements: [
          "שאלה ברורה עם דרישות מפורטות",
          "מבנה ברור של הדרישות",
          "כל המידע הנדרש מוצג בבירור",
          "הנחיות ברורות לגבי פורמט התשובה"
        ]
      },
      options: {
        count: 0,
        format: "markdown"
      }
    },
    metadata: {
      type: "open",
      answerFormat: {
        hasFinalAnswer: false,
        finalAnswerType: "none",
        requiresSolution: true
      }
    },
    schoolAnswer: {
      finalAnswer: null,
      solution: {
        text: "string",
        format: "markdown"
      }
    },
    evaluationGuidelines: {
      requiredCriteria: [
        {
          name: "completeness",
          description: "כיסוי מלא של כל שלבי התהליך",
          weight: 30
        },
        {
          name: "accuracy",
          description: "דיוק במידע והתאמה לתקנים",
          weight: 30
        },
        {
          name: "organization",
          description: "מבנה ברור ומסודר",
          weight: 20
        },
        {
          name: "practicality",
          description: "יישומיות והתאמה לשטח",
          weight: 20
        }
      ]
    }
  }
}; 