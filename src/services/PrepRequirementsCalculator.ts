import { SubTopicProgressInfo } from './PrepProgressTracker';

export interface TypeRequirements {
  totalHours: number;
  remainingHours: number;
  totalQuestions: number;
  remainingQuestions: number;
  subTopicBreakdown?: Array<{
    subTopicId: string;
    weight: number;
    totalQuestions: number;
    remainingQuestions: number;
    totalHours: number;
    remainingHours: number;
  }>;
}

export interface Requirements {
  multipleChoice: TypeRequirements;
  open: TypeRequirements;
  numerical: TypeRequirements;
  total: {
    totalHours: number;
    remainingHours: number;
    totalQuestions: number;
    remainingQuestions: number;
  };
}

export class PrepRequirementsCalculator {
  private static readonly TOTAL_HOURS = 63.33;
  private static readonly MULTIPLE_CHOICE_HOURS_PERCENTAGE = 0.526; // 33.33/63.33
  private static readonly OPEN_HOURS_PERCENTAGE = 0.395; // 25/63.33
  private static readonly NUMERICAL_HOURS_PERCENTAGE = 0.079; // 5/63.33

  static readonly TOTAL_MULTIPLE_CHOICE_QUESTIONS = 1000;
  static readonly TOTAL_OPEN_QUESTIONS = 100;
  static readonly TOTAL_NUMERICAL_QUESTIONS = 20;

  // Average time per question type (in minutes)
  private static readonly TIME_PER_MULTIPLE_CHOICE = 2; // 2 minutes per MC question
  private static readonly TIME_PER_OPEN = 15; // 15 minutes per open question
  private static readonly TIME_PER_NUMERICAL = 15; // 15 minutes per numerical question
  public static calculateRequirements(subTopicProgress: SubTopicProgressInfo[]): Requirements {
    console.log('📊 Calculating prep requirements:', {
      totalSubTopics: subTopicProgress.length,
      subTopics: subTopicProgress.map(st => ({
        id: st.subTopicId,
        weight: st.weight,
        mcProgress: st.multipleChoiceProgress,
        openProgress: st.openProgress
      }))
    });

    // Calculate Multiple Choice Requirements
    const multipleChoice = this.calculateMultipleChoiceRequirements(subTopicProgress);
    console.log('📝 Multiple Choice requirements:', {
      totalHours: multipleChoice.totalHours,
      remainingHours: multipleChoice.remainingHours,
      totalQuestions: multipleChoice.totalQuestions,
      remainingQuestions: multipleChoice.remainingQuestions,
      subTopicBreakdown: multipleChoice.subTopicBreakdown
    });

    // Calculate Open Questions Requirements
    const open = this.calculateOpenRequirements(subTopicProgress);
    console.log('✍️ Open Questions requirements:', {
      totalHours: open.totalHours,
      remainingHours: open.remainingHours,
      totalQuestions: open.totalQuestions,
      remainingQuestions: open.remainingQuestions,
      subTopicBreakdown: open.subTopicBreakdown
    });

    // Calculate Numerical Requirements
    const numerical = this.calculateNumericalRequirements();
    console.log('🔢 Numerical requirements:', {
      totalHours: numerical.totalHours,
      remainingHours: numerical.remainingHours,
      totalQuestions: numerical.totalQuestions,
      remainingQuestions: numerical.remainingQuestions
    });

    // Calculate Totals
    const total = {
      totalHours: this.TOTAL_HOURS,
      remainingHours: multipleChoice.remainingHours + open.remainingHours + numerical.remainingHours,
      totalQuestions: this.TOTAL_MULTIPLE_CHOICE_QUESTIONS + this.TOTAL_OPEN_QUESTIONS + this.TOTAL_NUMERICAL_QUESTIONS,
      remainingQuestions: multipleChoice.remainingQuestions + open.remainingQuestions + numerical.remainingQuestions
    };

    return {
      multipleChoice,
      open,
      numerical,
      total
    };
  }

  private static calculateMultipleChoiceRequirements(subTopicProgress: SubTopicProgressInfo[]): TypeRequirements {
    const totalHours = this.TOTAL_HOURS * this.MULTIPLE_CHOICE_HOURS_PERCENTAGE;
    const subTopicBreakdown = this.calculateSubTopicBreakdown(
      subTopicProgress,
      this.TOTAL_MULTIPLE_CHOICE_QUESTIONS,
      this.TIME_PER_MULTIPLE_CHOICE,
      'multipleChoiceProgress'
    );

    return {
      totalHours,
      remainingHours: subTopicBreakdown.reduce((sum, st) => sum + st.remainingHours, 0),
      totalQuestions: this.TOTAL_MULTIPLE_CHOICE_QUESTIONS,
      remainingQuestions: subTopicBreakdown.reduce((sum, st) => sum + st.remainingQuestions, 0),
      subTopicBreakdown
    };
  }

  private static calculateOpenRequirements(subTopicProgress: SubTopicProgressInfo[]): TypeRequirements {
    const totalHours = this.TOTAL_HOURS * this.OPEN_HOURS_PERCENTAGE;
    const subTopicBreakdown = this.calculateSubTopicBreakdown(
      subTopicProgress,
      this.TOTAL_OPEN_QUESTIONS,
      this.TIME_PER_OPEN,
      'openProgress'
    );

    return {
      totalHours,
      remainingHours: subTopicBreakdown.reduce((sum, st) => sum + st.remainingHours, 0),
      totalQuestions: this.TOTAL_OPEN_QUESTIONS,
      remainingQuestions: subTopicBreakdown.reduce((sum, st) => sum + st.remainingQuestions, 0),
      subTopicBreakdown
    };
  }

  private static calculateNumericalRequirements(): TypeRequirements {
    const totalHours = this.TOTAL_HOURS * this.NUMERICAL_HOURS_PERCENTAGE;
    const totalQuestions = this.TOTAL_NUMERICAL_QUESTIONS;
    
    // For numerical questions, we use the progress directly without subtopics
    const remainingQuestions = totalQuestions; // This should be adjusted based on actual progress
    const remainingHours = (remainingQuestions * this.TIME_PER_NUMERICAL) / 60;

    return {
      totalHours,
      remainingHours,
      totalQuestions,
      remainingQuestions
    };
  }

  private static calculateSubTopicBreakdown(
    subTopicProgress: SubTopicProgressInfo[],
    totalQuestions: number,
    timePerQuestion: number,
    progressField: 'multipleChoiceProgress' | 'openProgress'
  ) {
    const totalWeight = subTopicProgress.reduce((sum, st) => sum + st.weight, 0);

    return subTopicProgress.map(subTopic => {
      const normalizedWeight = subTopic.weight / totalWeight;
      const subTopicTotalQuestions = Math.round(totalQuestions * normalizedWeight);
      const progress = subTopic[progressField] / 100; // Convert from percentage to decimal
      const remainingQuestions = Math.round(subTopicTotalQuestions * (1 - progress));
      const remainingHours = (remainingQuestions * timePerQuestion) / 60; // Convert minutes to hours

      return {
        subTopicId: subTopic.subTopicId,
        weight: subTopic.weight,
        totalQuestions: subTopicTotalQuestions,
        remainingQuestions,
        totalHours: (remainingQuestions * timePerQuestion) / 60,
        remainingHours
      };
    });
  }

  public static getFormattedSummary(requirements: Requirements): string {
    return `
=== Study Requirements Summary ===

Multiple Choice Questions:
- Total: ${requirements.multipleChoice.totalQuestions} questions (${requirements.multipleChoice.totalHours.toFixed(1)} hours)
- Remaining: ${requirements.multipleChoice.remainingQuestions} questions (${requirements.multipleChoice.remainingHours.toFixed(1)} hours)

Open Questions:
- Total: ${requirements.open.totalQuestions} questions (${requirements.open.totalHours.toFixed(1)} hours)
- Remaining: ${requirements.open.remainingQuestions} questions (${requirements.open.remainingHours.toFixed(1)} hours)

Numerical Questions:
- Total: ${requirements.numerical.totalQuestions} questions (${requirements.numerical.totalHours.toFixed(1)} hours)
- Remaining: ${requirements.numerical.remainingQuestions} questions (${requirements.numerical.remainingHours.toFixed(1)} hours)

Overall Progress:
- Total Questions: ${requirements.total.totalQuestions}
- Remaining Questions: ${requirements.total.remainingQuestions}
- Total Hours: ${requirements.total.totalHours.toFixed(1)}
- Remaining Hours: ${requirements.total.remainingHours.toFixed(1)}
`;
  }
} 