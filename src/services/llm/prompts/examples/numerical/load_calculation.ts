import { Question } from '../../../../types/question';

export const loadCalculationExample: Question = {
  id: "CIVIL-construction_safety-000002",
  name: "חישוב עומס מקסימלי על פיגום",
  type: "numerical",
  content: {
    text: "חשב את העומס המקסימלי המותר על פיגום בגובה 10 מטר, אם:\n- משקל הפיגום עצמו: 500 ק\"ג\n- פקטור בטיחות נדרש: 4\n- שטח הפיגום: 20 מ\"ר\n\nהשתמש בנוסחה: $$F_{max} = \\frac{W}{FS \\cdot A}$$ כאשר:\n- $F_{max}$ הוא העומס המקסימלי המותר\n- $W$ הוא המשקל הכולל\n- $FS$ הוא פקטור הבטיחות\n- $A$ הוא שטח הפיגום",
    format: "markdown",
    options: []
  },
  metadata: {
    subjectId: "civil_engineering",
    domainId: "construction_safety",
    topicId: "safety_management_fundamentals",
    subtopicId: "work_inspection_service",
    type: "numerical",
    difficulty: 3,
    estimatedTime: 10,
    answerFormat: {
      hasFinalAnswer: true,
      finalAnswerType: "numerical",
      requiresSolution: true
    },
    source: {
      type: "ezpass",
      creatorType: "ai"
    }
  },
  schoolAnswer: {
    finalAnswer: {
      type: "numerical",
      value: 6.25,
      tolerance: 0.01,
      unit: "ק\"ג/מ\"ר"
    },
    solution: {
      text: "פתרון:\n\n1. **חישוב משקל כולל**\n   $$W = 500$$ ק\"ג\n\n2. **חישוב עומס מקסימלי**\n   $$F_{max} = \\frac{W}{FS \\cdot A} = \\frac{500}{4 \\cdot 20} = 6.25$$ ק\"ג/מ\"ר\n\n3. **הסבר**\n   - משקל הפיגום: 500 ק\"ג\n   - פקטור בטיחות: 4\n   - שטח הפיגום: 20 מ\"ר\n   - העומס המקסימלי המותר: 6.25 ק\"ג/מ\"ר\n\n4. **בדיקות**\n   - העומס נמוך מהמשקל הכולל (בטיחותי)\n   - התוצאה הגיונית ביחס למשקל ושטח\n   - היחידות נכונות (ק\"ג/מ\"ר)",
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
}; 