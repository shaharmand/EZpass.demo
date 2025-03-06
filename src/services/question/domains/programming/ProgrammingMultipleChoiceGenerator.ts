import { BaseMultipleChoiceGenerator } from '../../base/types/BaseMultipleChoiceGenerator';
import { Question, QuestionType } from '../../../../types/question';

interface CodeExample {
  code: string;
  language: string;
  explanation: string;
  topic: string;
  difficulty: number;
}

interface QuestionPattern {
  type: 'output' | 'complexity' | 'best_practice' | 'bug_finding';
  template: string;
  examples: CodeExample[];
}

/**
 * Programming-specific multiple choice question generator
 */
export class ProgrammingMultipleChoiceGenerator extends BaseMultipleChoiceGenerator {
  // Example patterns that can be extended
  private readonly questionPatterns: QuestionPattern[] = [
    {
      type: 'output',
      template: 'מה יהיה הפלט של הקוד הבא?',
      examples: [
        {
          code: `def process_list(numbers):
    result = []
    for num in numbers:
        if num > 0:
            result.append(num * 2)
    return result

print(process_list([1, -2, 3, -4, 5]))`,
          language: 'python',
          explanation: 'הפונקציה מכפילה רק מספרים חיוביים ב-2',
          topic: 'list_processing',
          difficulty: 2
        },
        {
          code: `class Counter:
    def __init__(self):
        self._count = 0
    
    def increment(self):
        self._count += 1
        return self._count

counter = Counter()
print(counter.increment())
print(counter.increment())`,
          language: 'python',
          explanation: 'המחלקה מנהלת מונה פנימי ומחזירה את ערכו בכל קריאה',
          topic: 'oop_basics',
          difficulty: 3
        }
      ]
    },
    {
      type: 'complexity',
      template: 'מה סיבוכיות הזמן של האלגוריתם הבא?',
      examples: [
        {
          code: `def find_pairs(arr):
    n = len(arr)
    for i in range(n):
        for j in range(i + 1, n):
            if arr[i] + arr[j] == 0:
                print(f"Found pair: {arr[i]}, {arr[j]}")`,
          language: 'python',
          explanation: 'האלגוריתם עובר על כל הזוגות האפשריים במערך',
          topic: 'time_complexity',
          difficulty: 3
        }
      ]
    },
    {
      type: 'best_practice',
      template: 'איזו מהגרסאות הבאות היא הדרך המומלצת לממש את הפונקציונליות?',
      examples: [
        {
          code: `# Version 1
def calculate_average(numbers):
    if not numbers:
        return 0
    return sum(numbers) / len(numbers)

# Version 2
def calculate_average(numbers):
    total = 0
    count = 0
    for num in numbers:
        total += num
        count += 1
    if count == 0:
        return 0
    return total / count`,
          language: 'python',
          explanation: 'השוואה בין גרסה תמציתית לגרסה מפורטת',
          topic: 'code_style',
          difficulty: 2
        }
      ]
    }
  ];

  /**
   * Override base prompt with programming-specific guidelines and examples
   */
  protected getBasePrompt(): string {
    return `${super.getBasePrompt()}

PROGRAMMING SPECIFIC GUIDELINES:

1. Code Examples:
   - Use markdown code blocks
   - Clear variable names
   - Consistent indentation
   - Comments where needed

2. Option Types:
   - Code output prediction
   - Best practice selection
   - Algorithm complexity
   - Design pattern identification
   - Error identification
   - Code completion

3. Common Patterns:
   - Edge case handling
   - Performance considerations
   - Memory usage
   - Time complexity
   - Space complexity
   - Code style

EXAMPLE QUESTIONS:

${this.getExampleQuestions()}`;
  }

  /**
   * Generate programming-specific multiple choice options based on patterns
   */
  async generateOptions(): Promise<string[]> {
    const pattern = this.questionPatterns[Math.floor(Math.random() * this.questionPatterns.length)];
    const example = pattern.examples[Math.floor(Math.random() * pattern.examples.length)];

    switch (pattern.type) {
      case 'output':
        return this.generateOutputOptions(example);
      case 'complexity':
        return this.generateComplexityOptions();
      case 'best_practice':
        return this.generateBestPracticeOptions(example);
      default:
        return [
          'O(n) - Linear time complexity',
          'O(n²) - Quadratic time complexity',
          'O(log n) - Logarithmic time complexity',
          'O(1) - Constant time complexity'
        ];
    }
  }

  /**
   * Generate example questions for the prompt
   */
  private getExampleQuestions(): string {
    return this.questionPatterns
      .map(pattern => {
        const example = pattern.examples[0];
        return `
### ${pattern.template}

\`\`\`${example.language}
${example.code}
\`\`\`

**אפשרויות:**
1. תשובה א
2. תשובה ב
3. תשובה ג
4. תשובה ד

**הסבר:**
${example.explanation}
`;
      })
      .join('\n\n');
  }

  /**
   * Generate options for code output questions
   */
  private generateOutputOptions(example: CodeExample): string[] {
    // In a real implementation, we would:
    // 1. Actually run the code to get the correct output
    // 2. Generate plausible wrong outputs by slightly modifying the code
    // 3. Use common misconceptions to create wrong answers
    return [
      '[2, 6, 10]',
      '[2, -4, 6, -8, 10]',
      '[1, 3, 5]',
      '[1, -2, 3, -4, 5]'
    ];
  }

  /**
   * Generate options for complexity questions
   */
  private generateComplexityOptions(): string[] {
    return [
      'O(n) - סיבוכיות לינארית',
      'O(n²) - סיבוכיות ריבועית',
      'O(log n) - סיבוכיות לוגריתמית',
      'O(1) - סיבוכיות קבועה'
    ];
  }

  /**
   * Generate options for best practice questions
   */
  private generateBestPracticeOptions(example: CodeExample): string[] {
    return [
      'גרסה 1 - שימוש בפונקציות מובנות',
      'גרסה 2 - מימוש מפורט',
      'שתי הגרסאות שקולות ומקובלות',
      'אף אחת מהגרסאות אינה מומלצת'
    ];
  }

  /**
   * Override with programming-specific wrong answer explanations
   */
  protected explainWrongOption(option: string): string {
    if (option.includes('O(')) {
      return `שגויה מכיוון שהאלגוריתם אינו ${option} - ניתן לראות זאת על ידי ניתוח מספר הפעולות ביחס לגודל הקלט`;
    }
    
    if (option.includes('גרסה')) {
      return `שגויה מכיוון שגישה זו ${option.toLowerCase()} אינה מיטבית מבחינת קריאות וביצועים`;
    }

    return `שגויה מכיוון שהפלט ${option} אינו מתאים לאופן פעולת הקוד`;
  }

  /**
   * Add programming-specific option validation
   */
  validateOptions(options: string[]): boolean {
    if (!super.validateOptions(options)) {
      return false;
    }

    // Add programming-specific validation:
    // - Check for code block formatting
    // - Validate syntax in code examples
    // - Check for consistent style
    return true;
  }

  /**
   * Helper method to format code in options
   */
  protected formatCodeOption(code: string, language: string = 'python'): string {
    return `\`\`\`${language}\n${code}\n\`\`\``;
  }

  /**
   * Helper method to generate code-based options
   */
  protected async generateCodeOptions(
    baseCode: string,
    variations: Array<{ change: string, explanation: string }>
  ): Promise<string[]> {
    return variations.map(v => this.formatCodeOption(
      baseCode.replace('// VARIATION', v.change)
    ));
  }
} 