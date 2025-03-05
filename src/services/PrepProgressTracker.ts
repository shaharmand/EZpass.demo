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
    questionsAnswered: 0
  };
  
  constructor(subTopicWeights: Array<{ id: string; percentageOfTotal: number }>, examDate: number) {
    console.log('🎯 Creating new PrepProgressTracker instance:', {
      timestamp: new Date().toISOString(),
      weightCount: subTopicWeights.length,
      stack: new Error().stack // This will show us where it's being called from
    });
    
    this.startTime = Date.now();
    this.timeTracking = {
      activeTime: 0,
      lastTick: Date.now(),
      startedAt: Date.now()
    };
    
    this.examDate = examDate;
    
    subTopicWeights.forEach(({ id, percentageOfTotal }) => {
      this.subTopicWeights.set(id, percentageOfTotal);
    });

    console.log('🎲 PrepProgressTracker initialized with weights:', {
      timestamp: new Date().toISOString(),
      weights: Array.from(this.subTopicWeights.entries())
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

  private getProgressLevel(average: number): number {
    if (average >= 80) return 100;
    if (average >= 55) return 50;
    return 0;
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


    results.progress = this.getProgressLevel(this.calcSuccessRate());

    console.log('✅ Updated subtopic progress:', {
      subTopicId,
      questionType,
      resultsCount: results.lastResults.length,
      successRate: this.calcSuccessRate(),
      newProgress: results.progress
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
    this.numericProgress.progress = this.getProgressLevel(average);

    console.log('✅ Updated numeric progress:', {
      resultsCount: this.numericProgress.lastResults.length,
      average,
      newProgress: this.numericProgress.progress
    });
  }

  private updateHeaderMetrics(): void {
    const now = Date.now();
    const questionsAnswered = this.completedQuestions;
    const totalQuestions = this.calculateTotalRequiredQuestions();
    const remainingHours = Math.max(0, (this.examDate - now) / (1000 * 60 * 60));
    
    this.headerMetrics = {
      successRate: this.calcSuccessRate(),
      overallProgress: this.getOverallProgress(),
      questionsAnswered,
      remainingHours,
      remainingQuestions: totalQuestions - questionsAnswered,
      hoursPracticed: this.getActiveTime() / (1000 * 60 * 60)
    };
  }

  public getLatestMetrics(): ProgressHeaderMetrics {
    this.updateHeaderMetrics();
    return this.headerMetrics;
  }

  private calculateTotalRequiredQuestions(): number {
    // Each subtopic requires 20 questions per level, 5 levels
    const questionsPerSubtopic = 20 * 5;
    return this.subTopicWeights.size * questionsPerSubtopic;
  }

  public getOverallProgress(): number {
    // Get all results
    const allResults = this.getAllResultsSorted();
    const multipleChoiceCount = allResults.filter(r => r.type === QuestionType.MULTIPLE_CHOICE).length;
    const openCount = allResults.filter(r => r.type === QuestionType.OPEN).length;
    const numericalCount = allResults.filter(r => r.type === QuestionType.NUMERICAL).length;

    console.log('PrepProgressTracker: Calculating overall progress', {
      questionCounts: {
        multipleChoice: multipleChoiceCount,
        open: openCount,
        numerical: numericalCount
      },
      totalResults: allResults.length
    });

    // If any type has less than 20 questions, return 0 progress
    if (multipleChoiceCount < 20 || openCount < 20 || numericalCount < 20) {
        console.log('PrepProgressTracker: Not enough questions for progress calculation', {
            required: 20,
            current: {
                multipleChoice: multipleChoiceCount,
                open: openCount,
                numerical: numericalCount
            }
        });
        return 0;
    }

    // Calculate progress based on current counts
    let multipleChoiceProgress = 0;
    let openProgress = 0;
    let totalMultipleWeight = 0;
    let totalOpenWeight = 0;

    this.subTopicProgress.forEach((progress, subTopicId) => {
        const weight = this.subTopicWeights.get(subTopicId) || 0;
        
        multipleChoiceProgress += (progress.multipleChoice.progress * weight);
        openProgress += (progress.open.progress * weight);
        
        totalMultipleWeight += weight;
        totalOpenWeight += weight;
    });

    // Normalize to percentages
    multipleChoiceProgress = totalMultipleWeight > 0 ? 
        multipleChoiceProgress / totalMultipleWeight : 0;
    openProgress = totalOpenWeight > 0 ? 
        openProgress / totalOpenWeight : 0;

    // Calculate total progress with weights
    const totalProgress = (
        (multipleChoiceProgress * 0.55) +
        (openProgress * 0.37) +
        (this.numericProgress.progress * 0.08)
    );

    console.log('PrepProgressTracker: Overall progress calculation', {
        weights: {
            multipleChoice: 0.55,
            open: 0.37,
            numerical: 0.08
        },
        progress: {
            multipleChoice: multipleChoiceProgress,
            open: openProgress,
            numerical: this.numericProgress.progress,
            total: totalProgress
        },
        totalWeights: {
            multiple: totalMultipleWeight,
            open: totalOpenWeight
        }
    });

    return totalProgress;
  }
  public calcSuccessRate(): number {
    const allResults = this.getAllResultsSorted();
    // Use all available results if less than 60, otherwise take last 60
    const resultsToUse = allResults.length <= 60 ? allResults : allResults.slice(-60);
    if (resultsToUse.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;

    resultsToUse.forEach(result => {
      const weight = result.type === QuestionType.MULTIPLE_CHOICE ? 1 : 8;  // Both OPEN and NUMERICAL are weighted 8x
      weightedSum += result.score * weight;
      totalWeight += weight;
    });

    const successRate = weightedSum / totalWeight;

    console.log('PrepProgressTracker: Success rate calculation', {
      timestamp: new Date().toISOString(),
      resultsCount: resultsToUse.length,
      weightedSum,
      totalWeight,
      successRate
    });

    return weightedSum / totalWeight;  // Already returns 0-100 since scores are 1-100
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

  public getTypeSpecificRate(questionType: QuestionType): number {
    const allResults = this.getAllResultsSorted();
    // Use all available results if less than 60, otherwise take last 60
    const resultsToUse = allResults.length <= 60 ? allResults : allResults.slice(-60);
    return this.calculateTypeSpecificRate(resultsToUse, questionType);
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
    return typeResults.reduce((sum, r) => sum + r.score, 0) / typeResults.length;
  }

  public getCompletedQuestions(): number {
    return this.completedQuestions;
  }

  public getCorrectAnswers(): number {
    return this.correctAnswers;
  }

} 