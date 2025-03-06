export interface MultipleChoiceParams {
  difficulty: number;
  topic: string;
  subtopic?: string;
}

export const buildMultipleChoicePrompt = (params: MultipleChoiceParams): string => {
  return `
MULTIPLE CHOICE QUESTION REQUIREMENTS:

1. Question Content:
   - Clear, unambiguous question text in Hebrew
   - All necessary information included
   - No trick questions or misleading wording
   - Use markdown for formatting
   - For math: use LaTeX notation within $$ markers
   - Text should be RTL (right-to-left)

2. Options Structure (CRITICAL):
   - You MUST include exactly 4 options in the content.options array
   - Each option MUST have this exact structure:
     {
       "text": "Option text in Hebrew",
       "format": "markdown"
     }
   - Example of correct options structure:
     "options": [
       { "text": "תשובה א", "format": "markdown" },
       { "text": "תשובה ב", "format": "markdown" },
       { "text": "תשובה ג", "format": "markdown" },
       { "text": "תשובה ד", "format": "markdown" }
     ]

3. Final Answer Structure (CRITICAL):
   - You MUST include a finalAnswer in schoolAnswer with this exact structure:
     {
       "type": "multiple_choice",
       "value": 1  // Must be 1, 2, 3, or 4 indicating the correct option
     }

4. Solution Requirements:
   - Explain why the correct answer is right
   - Point out why other options are incorrect
   - Include complete solution process
   - Highlight common misconceptions

5. Evaluation Criteria:
   {
     "requiredCriteria": [
       {
         "name": "correct_answer",
         "description": "בחירת התשובה הנכונה",
         "weight": 50
       },
       {
         "name": "explanation_quality",
         "description": "איכות ההסבר - כולל התייחסות לפרוטוקולי בטיחות, הערכת סיכונים והסבר למה התשובות האחרות שגויות",
         "weight": 50
       }
     ]
   }

6. Option Design Guidelines:
   - All options must be plausible
   - No obviously wrong answers
   - No trick or joke options
   - Similar length and structure
   - Independent of each other
   - Only one clearly correct answer
`;
};

// Structured requirements for validation
export const multipleChoiceRequirements = {
  content: {
    question: {
      requirements: [
        "שאלה ברורה וחד משמעית",
        "כל המידע הנדרש לפתרון",
        "ללא שאלות מלכודת",
        "פורמט מרקדאון תקין"
      ]
    },
    options: {
      count: 4,
      requirements: [
        "כל התשובות סבירות",
        "אורך דומה לכל התשובות",
        "תשובה נכונה אחת ברורה",
        "ללא תשובות מבלבלות"
      ]
    }
  },
  solution: {
    requirements: [
      "הסבר לתשובה הנכונה",
      "הסבר לשגיאות בתשובות האחרות",
      "תהליך פתרון מלא",
      "התייחסות לטעויות נפוצות"
    ]
  }
}; 