import { PrepRequirementsCalculator, Requirements } from './PrepRequirementsCalculator';
import { QuestionType } from '../types/question';

interface SubTopicProgress {
  multipleChoice: {
    lastResults: { score: number, timestamp: number }[];  // Last 20
    progress: number;  // 0, 50, or 100
  };
  open: {
    lastResults: { score: number, timestamp: number }[];  // Last 2
    progress: number;  // 0, 50, or 100
  };
}

interface NumericProgress {
  lastResults: { score: number, timestamp: number }[];  // Last 6
  progress: number;  // 0, 50, or 100
}

interface TimeTracking {
  activeTime: number;     // Total accumulated active time
  lastTick: number;       // Last time we updated activeTime
  startedAt: number;      // When this active session started
}

export interface ProgressHeaderMetrics {
  overallProgress: number;
  successRate: number;  // 0-100 percentage
  remainingHours: number;
  remainingQuestions: number;
  hoursPracticed: number;
  questionsAnswered: number;
  weeklyNeededHours: number;
  dailyNeededHours: number;
  examDate: number;
  totalQuestions: number;
  typeSpecificMetrics: Array<{
    type: QuestionType;
    progress: number;
    successRate: number;
    remainingHours: number;
    remainingQuestions: number;
    questionsAnswered: number;
  }>;
}

export interface SubTopicProgressInfo {
  subTopicId: string;
  weight: number;
  multipleChoiceProgress: number;
  openProgress: number;
}

export class PrepProgressTracker {
  private subTopicProgress: Map<string, SubTopicProgress> = new Map();
  private numericProgress: NumericProgress = { lastResults: [], progress: 0 };
  private subTopicWeights: Map<string, number> = new Map();
  private startTime: number;
  private questionHistory: Array<{
    questionId: string;
    score: number;
    isCorrect: boolean;
    timestamp: number;
    type: QuestionType;
  }> = [];
  private timeTracking: TimeTracking;
  private completedQuestions: number = 0;
  private correctAnswers: number = 0;
  private examDate: number;
  private successRate: number = 0;
  private headerMetrics: ProgressHeaderMetrics = {
    overallProgress: 0,
    successRate: 0,
    remainingHours: 0,
    remainingQuestions: 0,
    hoursPracticed: 0,
    questionsAnswered: 0,
    weeklyNeededHours: 0,
    dailyNeededHours: 0,
    examDate: 0,
    totalQuestions: 0,
    typeSpecificMetrics: []
  };
  private typeSpecificMetrics: Array<{
    type: QuestionType;
    progress: number;
    successRate: number;
    remainingHours: number;
    remainingQuestions: number;
    questionsAnswered: number;
  }> = [];
  
  constructor(subTopicWeights: Array<{ id: string; percentageOfTotal: number }>, examDate: number) {
    console.log('🎯 Creating new PrepProgressTracker instance:', {
      timestamp: new Date().toISOString(),
      weightCount: subTopicWeights.length,
      stack: new Error().stack
    });
    
    this.startTime = Date.now();
    this.timeTracking = {
      activeTime: 0,
      lastTick: Date.now(),
      startedAt: Date.now()
    };
    
    this.examDate = examDate;
    
    // Initialize all subtopics with 0 progress
    subTopicWeights.forEach(({ id, percentageOfTotal }) => {
      this.subTopicWeights.set(id, percentageOfTotal);
      // Initialize progress entry for each subtopic
      this.subTopicProgress.set(id, {
        multipleChoice: { lastResults: [], progress: 0 },
        open: { lastResults: [], progress: 0 }
      });
    });

    console.log('🎲 PrepProgressTracker initialized with weights and progress:', {
      timestamp: new Date().toISOString(),
      weights: Array.from(this.subTopicWeights.entries()),
      progress: Array.from(this.subTopicProgress.entries())
    });

    // Initialize header metrics
    this.updateHeaderMetrics();
  }

  public updateTime(): void {
    const now = Date.now();
    this.timeTracking.activeTime += now - this.timeTracking.lastTick;
    this.timeTracking.lastTick = now;
    this.updateHeaderMetrics();
  }

  public getActiveTime(): number {
    return this.timeTracking.activeTime + (Date.now() - this.timeTracking.lastTick);
  }

  private logProgressUpdate(): void {
    this.updateHeaderMetrics();

    // Get requirements for overall progress calculation
    const requirements = PrepRequirementsCalculator.calculateRequirements(
      Array.from(this.subTopicProgress.entries()).map(([id, progress]) => ({
        subTopicId: id,
        weight: this.subTopicWeights.get(id) || 0,
        multipleChoiceProgress: progress.multipleChoice.progress,
        openProgress: progress.open.progress
      }))
    );

    console.log('Progress Update:', {
      timestamp: new Date().toISOString(),
      metrics: this.headerMetrics,
      totalTrackedQuestions: this.questionHistory.length,
      completedQuestions: this.completedQuestions,
      correctAnswers: this.correctAnswers,
      activeTime: this.getActiveTime(),
      successRate: this.calcSuccessRate(),
      overallProgress: this.getOverallProgress()
    });
  }

  private calculateAverage(results: Array<{ score: number }>): number {
    if (results.length === 0) return 0;
    const average = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    console.log('PrepProgressTracker: Calculating average', {
      resultsCount: results.length,
      scores: results.map(r => r.score),
      average
    });
    
    return average;
  }

  private getProgressLevel(average: number, resultCount: number = 0, questionType: QuestionType = QuestionType.MULTIPLE_CHOICE): number {
    // Only multiple choice requires minimum questions
    if (questionType === QuestionType.MULTIPLE_CHOICE && resultCount < 3) {
        return 0;
    }
    
    // Only count progress if average is at least 60%
    if (average < 60) return 0;
    
    // Use different divisors based on question type
    const divisor = questionType === QuestionType.MULTIPLE_CHOICE ? 20 :
                   questionType === QuestionType.NUMERICAL ? 6 : 2;
    const progressPercentage = average * (resultCount / divisor);
    
    // Cap at 100% but keep decimal precision
    return Math.min(100, progressPercentage);
  }

  public addResult(
    subTopicId: string | null,
    questionType: QuestionType,
    score: number,
    timestamp: number,
    questionId: string,
    isCorrect: boolean
  ): void {
    // Check if this is a first submission for this question
    const isFirstSubmission = !this.questionHistory.some(q => q.questionId === questionId);
    
    // Add to question history
    console.log('PrepProgressTracker: Adding result', {
      questionId,
      score,
      isCorrect,
      timestamp: new Date(timestamp).toISOString(),
      type: questionType,
      isFirstSubmission
    });
    
    this.questionHistory.push({
      questionId,
      score,
      isCorrect,
      timestamp,
      type: questionType
    });

    // Update metrics only on first submission
    if (isFirstSubmission) {
      this.completedQuestions++;
      if (isCorrect) {
        this.correctAnswers++;
      }
      this.successRate = this.calcSuccessRate();
    }

    if (questionType === QuestionType.NUMERICAL) {
      this.updateNumericProgress(score, timestamp);
    } else if (subTopicId) {
      this.updateSubTopicProgress(subTopicId, questionType, score, timestamp);
    }

    this.updateHeaderMetrics();
    this.logProgressUpdate();
  }

  private updateSubTopicProgress(
    subTopicId: string,
    questionType: QuestionType,
    score: number,
    timestamp: number
  ): void {
    console.log('🔄 Updating subtopic progress:', {
      subTopicId,
      questionType,
      score,
      timestamp: new Date(timestamp).toISOString(),
      existingProgress: this.subTopicProgress.has(subTopicId)
    });

    if (!this.subTopicProgress.has(subTopicId)) {
      this.subTopicProgress.set(subTopicId, {
        multipleChoice: { lastResults: [], progress: 0 },
        open: { lastResults: [], progress: 0 }
      });
    }

    const progress = this.subTopicProgress.get(subTopicId)!;
    const results = questionType === QuestionType.MULTIPLE_CHOICE ? 
      progress.multipleChoice : progress.open;

    results.lastResults.push({ score, timestamp });
    
    const keepCount = questionType === QuestionType.MULTIPLE_CHOICE ? 20 : 2;
    if (results.lastResults.length > keepCount) {
      results.lastResults = results.lastResults.slice(-keepCount);
    }

    // Calculate progress based on sliding window
    if (results.lastResults.length < 3) {
      results.progress = 0;
    } else {
      const average = this.calculateAverage(results.lastResults);
      if (average >= 60) {
        // Progress is proportional to number of results if average >= 60%
        const baseProgress = (results.lastResults.length / 20) * average;
        
        // Apply type weight (55% for MC, 37% for Open)
        const typeWeight = questionType === QuestionType.MULTIPLE_CHOICE ? 0.55 : 0.37;
        
        if (average >= 80 && results.lastResults.length >= 20) {
          results.progress = 100 * typeWeight;  // Full progress for this type
        } else {
          results.progress = baseProgress * typeWeight;
        }
      } else {
        results.progress = 0;
      }
    }

    const currentAverage = this.calculateAverage(results.lastResults);
    console.log('✅ Updated subtopic progress:', {
      subTopicId,
      questionType,
      resultsCount: results.lastResults.length,
      average: currentAverage,
      progress: results.progress,
      successRate: this.calcSuccessRate()
    });
  }

  private updateNumericProgress(score: number, timestamp: number): void {
    console.log('🔢 Updating numeric progress:', {
      score,
      timestamp: new Date(timestamp).toISOString(),
      currentResults: this.numericProgress.lastResults.length
    });

    this.numericProgress.lastResults.push({ score, timestamp });
    
    if (this.numericProgress.lastResults.length > 6) {
      this.numericProgress.lastResults = this.numericProgress.lastResults.slice(-6);
    }

    const average = this.calculateAverage(this.numericProgress.lastResults);
    const baseProgress = this.getProgressLevel(average, this.numericProgress.lastResults.length, QuestionType.NUMERICAL);
    
    // Apply 8% weight for numerical questions
    this.numericProgress.progress = baseProgress * 0.08;

    console.log('✅ Updated numeric progress:', {
      resultsCount: this.numericProgress.lastResults.length,
      average,
      newProgress: this.numericProgress.progress
    });
  }

  private updateHeaderMetrics(): void {
    const now = Date.now();
    
    // Get total questions from history instead of just completedQuestions
    const questionsAnswered = this.questionHistory.length;
    
    // Calculate total questions from all type-specific metrics
    const totalQuestions = this.typeSpecificMetrics.reduce((acc, metric) => acc + metric.questionsAnswered, 0);
    
    // Calculate type-specific progress from subtopic progress
    let totalMultipleChoiceProgress = 0;
    let totalOpenProgress = 0;
    let totalWeight = 0;

    this.subTopicProgress.forEach((progress, subTopicId) => {
      const weight = this.subTopicWeights.get(subTopicId) || 0;
      totalMultipleChoiceProgress += progress.multipleChoice.progress * weight;
      totalOpenProgress += progress.open.progress * weight;
      totalWeight += weight;
    });

    // Normalize by total weight
    if (totalWeight > 0) {
      totalMultipleChoiceProgress = totalMultipleChoiceProgress / totalWeight;
      totalOpenProgress = totalOpenProgress / totalWeight;
    }

    // Calculate requirements using PrepRequirementsCalculator
    const requirements = PrepRequirementsCalculator.calculateRequirements(
      Array.from(this.subTopicProgress.entries()).map(([id, progress]) => ({
        subTopicId: id,
        weight: this.subTopicWeights.get(id) || 0,
        multipleChoiceProgress: progress.multipleChoice.progress,
        openProgress: progress.open.progress
      }))
    );

    // Get counts for each type from all history
    const allResults = this.questionHistory;
    const multipleChoiceCount = allResults.filter(r => r.type === QuestionType.MULTIPLE_CHOICE).length;
    const openCount = allResults.filter(r => r.type === QuestionType.OPEN).length;
    const numericalCount = allResults.filter(r => r.type === QuestionType.NUMERICAL).length;

    // Calculate remaining time until exam in days
    const daysUntilExam = Math.max(1, Math.ceil((this.examDate - now) / (1000 * 60 * 60 * 24)));
    const weeksUntilExam = Math.max(1, daysUntilExam / 7);

    // Calculate needed hours per week and per day
    const remainingHours = PrepProgressTracker.roundToNearest15Minutes(requirements.total.remainingHours);
    const weeklyNeededHours = PrepProgressTracker.roundToNearest15Minutes(remainingHours / weeksUntilExam);
    const dailyNeededHours = PrepProgressTracker.roundToNearest15Minutes(remainingHours / daysUntilExam);

    // Update header metrics
    this.headerMetrics = {
      overallProgress: this.getOverallProgress(),
      successRate: this.calcSuccessRate(),
      remainingHours,
      remainingQuestions: PrepProgressTracker.roundToNearest10(requirements.total.remainingQuestions),
      hoursPracticed: PrepProgressTracker.roundToNearest15Minutes(this.timeTracking.activeTime / (1000 * 60 * 60)),
      questionsAnswered: questionsAnswered,
      weeklyNeededHours,
      dailyNeededHours,
      examDate: this.examDate,
      totalQuestions,
      typeSpecificMetrics: [
        {
          type: QuestionType.MULTIPLE_CHOICE,
          progress: totalMultipleChoiceProgress,  // Progress is already weighted in updateSubTopicProgress
          successRate: this.getTypeSpecificRate(QuestionType.MULTIPLE_CHOICE),
          remainingHours: PrepProgressTracker.roundToNearest15Minutes(requirements.multipleChoice.remainingHours),
          remainingQuestions: PrepProgressTracker.roundToNearest10(requirements.multipleChoice.remainingQuestions),
          questionsAnswered: multipleChoiceCount
        },
        {
          type: QuestionType.OPEN,
          progress: totalOpenProgress,  // Progress is already weighted in updateSubTopicProgress
          successRate: this.getTypeSpecificRate(QuestionType.OPEN),
          remainingHours: PrepProgressTracker.roundToNearest15Minutes(requirements.open.remainingHours),
          remainingQuestions: PrepProgressTracker.roundToNearest10(requirements.open.remainingQuestions),
          questionsAnswered: openCount
        },
        {
          type: QuestionType.NUMERICAL,
          progress: this.numericProgress.progress,  // Already weighted in updateNumericProgress
          successRate: this.getTypeSpecificRate(QuestionType.NUMERICAL),
          remainingHours: PrepProgressTracker.roundToNearest15Minutes(requirements.numerical.remainingHours),
          remainingQuestions: PrepProgressTracker.roundToNearest10(requirements.numerical.remainingQuestions),
          questionsAnswered: numericalCount
        }
      ]
    };
  }

  public getLatestMetrics(): ProgressHeaderMetrics {
    this.updateHeaderMetrics();
    return this.headerMetrics;
  }

  private calculateTotalRequiredQuestions(): number {
    // Use the actual question counts from PrepRequirementsCalculator
    return PrepRequirementsCalculator.TOTAL_MULTIPLE_CHOICE_QUESTIONS + 
           PrepRequirementsCalculator.TOTAL_OPEN_QUESTIONS + 
           PrepRequirementsCalculator.TOTAL_NUMERICAL_QUESTIONS;  // 1000 + 100 + 20 = 1120
  }

  private static roundToOneDecimal(num: number): number {
    return Number((Math.round(num * 10) / 10).toFixed(1));
  }

  private static roundToNearest10(num: number): number {
    return Math.round(num / 10) * 10;
  }

  private static roundToNearestHalf(num: number): number {
    return Math.round(num * 2) / 2;
  }

  private static roundToNearest15Minutes(num: number): number {
    // Convert hours to minutes, round to nearest 15, then convert back to hours
    return Math.round(num * 60 / 15) * 15 / 60;
  }

  public getOverallProgress(): number {
    // Calculate type-specific progress from subtopic progress
    let totalMultipleChoiceProgress = 0;
    let totalOpenProgress = 0;
    let totalWeight = 0;

    // Calculate MC and Open progress from subtopics
    this.subTopicProgress.forEach((progress, subTopicId) => {
      const weight = this.subTopicWeights.get(subTopicId) || 0;
      totalMultipleChoiceProgress += progress.multipleChoice.progress * weight;
      totalOpenProgress += progress.open.progress * weight;
      totalWeight += weight;
    });

    // Normalize by total weight
    if (totalWeight > 0) {
      totalMultipleChoiceProgress = totalMultipleChoiceProgress / totalWeight;
      totalOpenProgress = totalOpenProgress / totalWeight;
    }

    // Sum up weighted progress only for types that have results
    let weightedSum = 0;
    let usedWeight = 0;

    // Only include MC if we have any results
    const hasMCResults = this.questionHistory.some(r => r.type === QuestionType.MULTIPLE_CHOICE);
    if (hasMCResults) {
      weightedSum += totalMultipleChoiceProgress * 0.55;
      usedWeight += 0.55;
    }

    // Only include Open if we have any results
    const hasOpenResults = this.questionHistory.some(r => r.type === QuestionType.OPEN);
    if (hasOpenResults) {
      weightedSum += totalOpenProgress * 0.37;
      usedWeight += 0.37;
    }

    // Only include Numeric if we have any results
    const hasNumericResults = this.numericProgress.lastResults.length > 0;
    if (hasNumericResults) {
      weightedSum += this.numericProgress.progress * 0.08;
      usedWeight += 0.08;
    }

    // If no results at all, return 0
    if (usedWeight === 0) return 0;

    // Calculate total progress with normalized weights
    const totalProgress = weightedSum / usedWeight;

    return PrepProgressTracker.roundToOneDecimal(totalProgress);
  }

  public getTypeSpecificRate(questionType: QuestionType): number {
    const allResults = this.questionHistory;
    const typeResults = allResults.filter(r => r.type === questionType);
    
    // Get last N results based on type
    const count = questionType === QuestionType.MULTIPLE_CHOICE ? 55 :
                 questionType === QuestionType.OPEN ? 5 : 3;
    
    const resultsToUse = typeResults.slice(-count);
    if (resultsToUse.length === 0) return 0;
    
    return resultsToUse.reduce((sum, r) => sum + r.score, 0) / resultsToUse.length;
  }

  public calcSuccessRate(): number {
    // Get type-specific rates
    const mcRate = this.getTypeSpecificRate(QuestionType.MULTIPLE_CHOICE);
    const openRate = this.getTypeSpecificRate(QuestionType.OPEN);
    const numericRate = this.getTypeSpecificRate(QuestionType.NUMERICAL);

    // Sum up weighted rates and weights for types that have results
    let weightedSum = 0;
    let totalWeight = 0;

    if (mcRate > 0) {
      weightedSum += mcRate * 0.55;
      totalWeight += 0.55;
    }
    if (openRate > 0) {
      weightedSum += openRate * 0.37;
      totalWeight += 0.37;
    }
    if (numericRate > 0) {
      weightedSum += numericRate * 0.08;
      totalWeight += 0.08;
    }

    // If no results, return 0
    if (totalWeight === 0) return 0;

    // Calculate weighted average
    const successRate = weightedSum / totalWeight;

    console.log('PrepProgressTracker: Success rate calculation', {
      timestamp: new Date().toISOString(),
      multipleChoiceRate: mcRate,
      openRate: openRate,
      numericRate: numericRate,
      weightedSum,
      totalWeight,
      overallRate: successRate
    });

    return successRate;  // Already returns 0-100 since scores are 0-100
  }

  public getAllResultsSorted(): Array<{
    score: number;
    timestamp: number;
    type: QuestionType;
  }> {
    const allResults: Array<{
      score: number;
      timestamp: number;
      type: QuestionType;
    }> = [];

    // Collect all results
    this.subTopicProgress.forEach(progress => {
      progress.multipleChoice.lastResults.forEach(r => 
        allResults.push({ ...r, type: QuestionType.MULTIPLE_CHOICE }));
      progress.open.lastResults.forEach(r => 
        allResults.push({ ...r, type: QuestionType.OPEN }));
    });

    this.numericProgress.lastResults.forEach(r => 
      allResults.push({ ...r, type: QuestionType.NUMERICAL }));

    // Sort by timestamp
    return allResults.sort((a, b) => a.timestamp - b.timestamp);
  }

  public getSubTopicProgress(subTopicId: string): {
    multipleChoice: number;
    open: number;
  } {
    const progress = this.subTopicProgress.get(subTopicId);
    return {
      multipleChoice: progress?.multipleChoice.progress || 0,
      open: progress?.open.progress || 0
    };
  }

  public getNumericProgress(): number {
    return this.numericProgress.progress;
  }

  public getSubTopicProgressTable(): SubTopicProgressInfo[] {
    return Array.from(this.subTopicProgress.entries()).map(([id, progress]) => ({
      subTopicId: id,
      weight: this.subTopicWeights.get(id) || 0,
      multipleChoiceProgress: progress.multipleChoice.progress,
      openProgress: progress.open.progress
    }));
  }

  private calculateTypeSpecificRate(results: Array<{ score: number; type: QuestionType }>, type: QuestionType): number {
    const typeResults = results.filter(r => r.type === type);
    if (typeResults.length === 0) return 0;
    
    // Get last N results based on type
    const count = type === QuestionType.MULTIPLE_CHOICE ? 55 :
                 type === QuestionType.OPEN ? 5 : 3;
                 
    const resultsToUse = typeResults.slice(-count);
    return resultsToUse.reduce((sum, r) => sum + r.score, 0) / resultsToUse.length;
  }

  public getCompletedQuestions(): number {
    return this.completedQuestions;
  }

  public getCorrectAnswers(): number {
    return this.correctAnswers;
  }

} 