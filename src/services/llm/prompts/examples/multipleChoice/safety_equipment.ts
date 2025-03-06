import { Question } from '../../../../types/question';

export const safetyEquipmentExample: Question = {
  id: "CIVIL-construction_safety-000001",
  name: "בחירת ציוד מגן אישי",
  type: "multiple_choice",
  content: {
    text: "איזה ציוד מגן אישי חובה להשתמש בו בעת עבודה בגובה של מעל 2 מטר?",
    format: "markdown",
    options: [
      { text: "קסדה, נעלי בטיחות וחגורת בטיחות", format: "markdown" },
      { text: "קסדה ונעלי בטיחות בלבד", format: "markdown" },
      { text: "חגורת בטיחות בלבד", format: "markdown" },
      { text: "קסדה וחגורת בטיחות בלבד", format: "markdown" }
    ]
  },
  metadata: {
    subjectId: "civil_engineering",
    domainId: "construction_safety",
    topicId: "safety_management_fundamentals",
    subtopicId: "work_inspection_service",
    type: "multiple_choice",
    difficulty: 2,
    estimatedTime: 5,
    answerFormat: {
      hasFinalAnswer: true,
      finalAnswerType: "multiple_choice",
      requiresSolution: true
    },
    source: {
      type: "ezpass",
      creatorType: "ai"
    }
  },
  schoolAnswer: {
    finalAnswer: {
      type: "multiple_choice",
      value: 1
    },
    solution: {
      text: "התשובה הנכונה היא א' - קסדה, נעלי בטיחות וחגורת בטיחות.\n\n**הסבר:**\n1. **קסדה** - חובה להגנה מפני נפילת חפצים\n2. **נעלי בטיחות** - חובה להגנה מפני פציעות רגליים\n3. **חגורת בטיחות** - חובה בעבודה בגובה מעל 2 מטר\n\n**למה התשובות האחרות שגויות:**\n- ב' - חסרה חגורת בטיחות שהיא חובה בגובה\n- ג' - חסרים קסדה ונעלי בטיחות שהינם חובה בכל עבודה\n- ד' - חסרות נעלי בטיחות שהינן חובה בכל עבודה",
      format: "markdown"
    }
  },
  evaluationGuidelines: {
    requiredCriteria: [
      {
        name: "correct_answer",
        description: "בחירת התשובה הנכונה",
        weight: 50
      },
      {
        name: "explanation_quality",
        description: "איכות ההסבר - כולל התייחסות לפרוטוקולי בטיחות, הערכת סיכונים והסבר למה התשובות האחרות שגויות",
        weight: 50
      }
    ]
  }
}; 