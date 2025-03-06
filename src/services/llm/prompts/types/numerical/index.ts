export const numericalPrompt = {
  requirements: {
    content: {
      text: {
        format: "markdown",
        requirements: [
          "שאלה ברורה עם כל הנתונים הנדרשים",
          "נוסחה ברורה עם הסבר לכל המשתנים",
          "יחידות מידה מוגדרות בבירור",
          "תנאים מיוחדים או הנחות מוגדרים בבירור"
        ]
      },
      options: {
        count: 0,
        format: "markdown"
      }
    },
    metadata: {
      type: "numerical",
      answerFormat: {
        hasFinalAnswer: true,
        finalAnswerType: "numerical",
        requiresSolution: true
      }
    },
    schoolAnswer: {
      finalAnswer: {
        type: "numerical",
        value: 0,
        tolerance: 0,
        unit: ""
      },
      solution: {
        text: "",
        format: "markdown"
      }
    },
    evaluationGuidelines: {
      requiredCriteria: [
        {
          name: "calculation_accuracy",
          description: "דיוק בחישובים",
          weight: 40
        },
        {
          name: "solution_steps",
          description: "שלבי הפתרון והסבר",
          weight: 30
        },
        {
          name: "units_and_format",
          description: "שימוש נכון ביחידות ופורמט",
          weight: 30
        }
      ]
    }
  }
}; 