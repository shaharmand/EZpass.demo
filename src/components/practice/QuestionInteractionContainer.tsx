import React, { useEffect, useRef, useState } from 'react';
import { Space, Spin, Typography, Card, Button, Divider, Tooltip, Tag, Select } from 'antd';
import { FilterOutlined, DownOutlined, UpOutlined, StarFilled, ClockCircleOutlined } from '@ant-design/icons';
import { Question, QuestionFeedback as QuestionFeedbackType, FilterState } from '../../types/question';
import QuestionContent from '../QuestionContent';
import QuestionMetadata, { getDifficultyIcons, getQuestionTypeLabel } from '../QuestionMetadata';
import { FeedbackContainer } from '../feedback/FeedbackContainer';
import QuestionResponseInput from '../QuestionResponseInput';
import QuestionActions from './QuestionActions';
import { QuestionSetProgress } from './QuestionSetProgress';
import { motion, AnimatePresence } from 'framer-motion';
import { FilterSummary } from '../EnhancedSidebar/FilterSummary';
import { QuestionFilter } from '../EnhancedSidebar/QuestionFilter';
import { subjectService } from '../../services/subjectService';
import { logger } from '../../utils/logger';
import '../../styles/metadata.css';
import './QuestionSetProgress.css';

const { Text, Title } = Typography;

interface QuestionInteractionContainerProps {
  question: Question;
  onAnswer: (answer: string) => Promise<void>;
  onSkip: (reason: 'too_hard' | 'too_easy' | 'not_in_material') => Promise<void>;
  onHelp: () => void;
  onNext: () => void;
  onRetry: () => void;
  state: {
    status: string;
    feedback?: QuestionFeedbackType;
    questionIndex: number;
    correctAnswers: number;
    averageScore: number;
    answeredQuestions?: Array<{
      index: number;
      isCorrect: boolean;
      score?: number;
    }>;
  };
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  activePrep?: any;
}

const QuestionInteractionContainer: React.FC<QuestionInteractionContainerProps> = ({
  question,
  onAnswer: handleAnswer,
  onSkip,
  onHelp,
  onNext,
  onRetry,
  state,
  filters,
  onFiltersChange,
  activePrep
}) => {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [topicName, setTopicName] = useState('');
  const lastTimeLogRef = useRef<number>(Date.now());
  const startTimeRef = useRef<number>(Date.now());
  const isQuestionLoading = !question || state.status === 'loading';

  // Track current batch of 10 questions
  const [currentBatch, setCurrentBatch] = useState<Array<{
    index: number;
    isCorrect?: boolean;
    score?: number;
    status: 'pending' | 'active' | 'completed';
  }>>([]);

  // Initialize or reset batch when starting new practice
  useEffect(() => {
    if (activePrep && (!currentBatch.length || currentBatch.length !== 10)) {
      setCurrentBatch(Array.from({ length: 10 }, (_, i) => ({
        index: i,
        status: i === 0 ? 'active' : 'pending'
      })));
    }
  }, [activePrep]);

  // Update batch when question is answered
  useEffect(() => {
    console.log('🔍 Checking for feedback update:', {
      hasFeedback: Boolean(state.feedback),
      batchLength: currentBatch.length,
      currentQuestion: question?.id,
      feedback: state.feedback,
      batchDetails: currentBatch.map(q => ({
        index: q.index,
        status: q.status,
        isCorrect: q.isCorrect,
        score: q.score
      }))
    });

    if (state.feedback && currentBatch.length) {
      const currentIndex = currentBatch.findIndex(q => q.status === 'active');
      console.log('📊 Found active question in batch:', {
        currentIndex,
        batchStatus: currentBatch.map(q => ({
          index: q.index,
          status: q.status,
          isCorrect: q.isCorrect,
          score: q.score
        }))
      });

      if (currentIndex >= 0) {
        const newBatch = [...currentBatch];
        // Update current question but keep it active
        newBatch[currentIndex] = {
          ...newBatch[currentIndex],
          isCorrect: state.feedback.isCorrect,
          score: state.feedback.score,
          status: 'active' // Keep it active until next is clicked
        };
        
        console.log('✨ Updating batch with feedback:', {
          updatedIndex: currentIndex,
          isCorrect: state.feedback.isCorrect,
          score: state.feedback.score,
          status: 'active',
          newBatchStatus: newBatch.map(q => ({
            index: q.index,
            status: q.status,
            isCorrect: q.isCorrect,
            score: q.score
          }))
        });
        setCurrentBatch(newBatch);
      }
    }
  }, [state.feedback]);

  // Get topic name on mount and when question changes
  useEffect(() => {
    if (question) {
      const name = subjectService.getMostSpecificTopicName(
        question.metadata.topicId,
        question.metadata.subtopicId
      );
      setTopicName(name);
    }
  }, [question?.metadata.topicId, question?.metadata.subtopicId]);

  const handleClearFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters };
    
    switch (key) {
      case 'timeLimit':
        delete newFilters.timeLimit;
        break;
      case 'difficulty':
        if (newFilters.difficulty) {
          newFilters.difficulty = newFilters.difficulty.filter(v => v !== value);
          if (newFilters.difficulty.length === 0) delete newFilters.difficulty;
        }
        break;
      case 'topics':
      case 'questionTypes':
      case 'programmingLanguages':
        if (newFilters[key]) {
          newFilters[key] = (newFilters[key] as string[]).filter(v => v !== value);
          if (newFilters[key]!.length === 0) delete newFilters[key];
        }
        break;
      default:
        delete newFilters[key];
    }
    
    onFiltersChange(newFilters);
  };

  // Reset time tracking on new question
  useEffect(() => {
    startTimeRef.current = Date.now();
    lastTimeLogRef.current = Date.now();
  }, [question?.id]);

  // Calculate days until exam
  const daysUntilExam = Math.ceil((activePrep?.goals?.examDate - Date.now()) / (1000 * 60 * 60 * 24));
  
  // Calculate remaining questions and time
  const remainingQuestions = (activePrep?.goals?.questionGoal || 0) - (activePrep?.state?.completedQuestions || 0);
  const remainingHours = (activePrep?.goals?.totalHours || 0) - Math.round((activePrep?.state?.activeTime || 0) / (60 * 60 * 1000));
  
  // Calculate daily goals based on remaining work and days
  const dailyQuestionsGoal = daysUntilExam > 0 ? Math.ceil(remainingQuestions / daysUntilExam) : remainingQuestions;
  const dailyTimeGoal = daysUntilExam > 0 ? Math.ceil((remainingHours * 60) / daysUntilExam) : remainingHours * 60; // Convert to minutes

  // Calculate last 24 hours progress
  const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
  const questionsAnsweredToday = activePrep?.state?.questionHistory?.filter((q: { timestamp: number }) => 
    q.timestamp >= last24Hours
  ).length || 0;

  // For time, we're still showing total active time in minutes
  const dailyTimeProgress = Math.round((activePrep?.state?.activeTime || 0) / (60 * 1000));
  
  const isDailyTimeGoalExceeded = dailyTimeProgress > dailyTimeGoal;
  const isQuestionsGoalExceeded = questionsAnsweredToday > dailyQuestionsGoal;

  // Add difficulty options
  const difficultyOptions = [
    { value: 1, label: 'קל מאוד', color: '#f59e0b' },
    { value: 2, label: 'קל', color: '#f59e0b' },
    { value: 3, label: 'בינוני', color: '#f59e0b' },
    { value: 4, label: 'קשה', color: '#f59e0b' },
    { value: 5, label: 'קשה מאוד', color: '#f59e0b' }
  ];

  const renderDifficultyOption = (difficulty: number) => {
    const option = difficultyOptions.find(opt => opt.value === difficulty);
    return (
      <Space>
        {[...Array(difficulty)].map((_, i) => (
          <StarFilled key={i} style={{ color: option?.color, fontSize: '12px' }} />
        ))}
        <Text>{option?.label}</Text>
      </Space>
    );
  };

  if (isQuestionLoading) {
    return (
      <div style={{ 
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Spin size="large" />
          <Text style={{ textAlign: 'center' }}>טוען שאלה...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Progress Bar - Always at Top */}
      <div className="progress-status-bar">
        <QuestionSetProgress
          currentQuestionIndex={state.questionIndex + 1}
          totalQuestions={10}
          questionId={question.id}
          dailyQuestions={state.answeredQuestions ? {
            completed: state.answeredQuestions.filter(q => q.isCorrect).length,
            goal: 10
          } : undefined}
          dailyTime={activePrep?.goals?.dailyHours ? {
            completed: Math.round((activePrep.state.activeTime || 0) / (60 * 1000)),
            goal: Math.round(activePrep.goals.dailyHours * 60)
          } : undefined}
        />
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <Button 
          type="text"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="filter-toggle"
        >
          <div className="filter-toggle-content">
            <FilterOutlined className="filter-icon" />
            <Text>סינון מתקדם</Text>
            {Object.keys(filters).length > 0 && (
              <Tag className="filter-count">
                {Object.keys(filters).length}
              </Tag>
            )}
            {isFilterExpanded ? <UpOutlined /> : <DownOutlined />}
          </div>
        </Button>
        
        <AnimatePresence>
          {isFilterExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ overflow: 'hidden', width: '100%' }}
              className="filter-content"
            >
              <div className="filter-controls">
                <QuestionFilter
                  filters={filters}
                  onChange={onFiltersChange}
                  expanded={isFilterExpanded}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Question Card */}
      <Card bodyStyle={{ padding: '24px' }} className={`question-card question-type-${question.type}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`question-${question?.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="question-content">
              <div className="question-header">
                <div className="title-row">
                  <h2 className="question-title">
                    שאלה ב{topicName}
                  </h2>
                  <div className="metadata-indicators">
                    <div className="difficulty-indicator">
                      {getDifficultyIcons(String(question.metadata.difficulty))}
                    </div>
                    <div className="type-indicator">
                      {getQuestionTypeLabel(question.type)}
                    </div>
                  </div>
                </div>
                <div className="action-bar">
                  <QuestionActions
                    onHelp={(type) => {
                      logger.info('Help requested', { type });
                      onHelp();
                    }}
                    onSkip={state.feedback ? undefined : onSkip}
                    onNext={state.feedback ? onNext : undefined}
                    disabled={state.status === 'submitted'}
                    showNext={!!state.feedback}
                  />
                </div>
              </div>

              <div className="question-body">
                <div className="question-content-wrapper">
                  <QuestionContent
                    content={question.content.text}
                    isLoading={false}
                  />
                </div>
                {question.metadata.source && (
                  <div className="source-info">
                    <Text type="secondary" italic>
                      מקור: {question.metadata.source.examType === 'practice' ? 'איזיפס - שאלת תרגול מקורית' : question.metadata.source.examType}
                      {question.metadata.source.year && ` ${question.metadata.source.year}`}
                      {question.metadata.source.season && ` ${question.metadata.source.season}`}
                      {question.metadata.source.moed && ` מועד ${question.metadata.source.moed}`}
                      {question.metadata.source.author && ` | ${question.metadata.source.author}`}
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Answer Section */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`answer-${question?.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="answer-section">
              <div className="answer-header">
                <h3>התשובה שלך</h3>
              </div>
              <QuestionResponseInput 
                question={question}
                onAnswer={handleAnswer}
                onRetry={onRetry}
                disabled={state.status === 'submitted'}
                feedback={state.feedback ? {
                  isCorrect: state.feedback.isCorrect,
                  score: state.feedback.score
                } : undefined}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Feedback Section */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`feedback-${question?.id}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {state.status === 'submitted' && !state.feedback && (
              <div className="feedback-loading">
                <Space direction="vertical">
                  <Spin size="large" />
                  <Text>בודק את התשובה שלך...</Text>
                </Space>
              </div>
            )}

            {state.feedback && (
              <div className="feedback-section">
                <FeedbackContainer 
                  question={question}
                  feedback={state.feedback}
                  onRetry={onRetry}
                  onNext={onNext}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      <style>
        {`
          .filter-bar {
            width: 100%;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            transition: all 0.2s ease;
            direction: rtl;
          }

          .filter-toggle {
            width: 100%;
            padding: 12px 16px;
            border: none;
            height: auto;
            text-align: right;
          }

          .filter-toggle-content {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            justify-content: flex-end;
            flex-direction: row-reverse;
          }

          .filter-icon {
            font-size: 16px;
            color: #2563eb;
            margin-left: 8px;
          }

          .filter-toggle .ant-typography {
            color: #1f2937;
            font-weight: 500;
            font-size: 15px;
            margin: 0;
          }

          .filter-count {
            margin: 0 8px;
            min-width: 20px;
            height: 20px;
            padding: 0 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #60a5fa;
            color: white;
            border-radius: 10px;
            font-size: 12px;
            font-weight: 500;
          }

          .filter-content {
            width: 100%;
            border-top: 1px solid #e5e7eb;
          }

          .filter-controls {
            padding: 20px;
            width: 100%;
          }

          .question-card {
            position: relative;
          }

          .question-card.question-type-multiple_choice {
            border-right: 4px solid #3b82f6;
          }

          .question-card.question-type-open {
            border-right: 4px solid #10b981;
          }

          .question-card.question-type-code {
            border-right: 4px solid #8b5cf6;
          }

          .question-card.question-type-step_by_step {
            border-right: 4px solid #f59e0b;
          }

          .question-content {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .question-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
          }

          .title-row {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .question-title {
            margin: 0;
            font-size: 20px;
            color: #1f2937;
            font-weight: 600;
          }

          .metadata-indicators {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 4px 8px;
            background: #f8fafc;
            border-radius: 20px;
            border: 1px solid #e5e7eb;
          }

          .difficulty-indicator {
            display: flex;
            gap: 2px;
          }

          .difficulty-indicator .anticon {
            color: #f59e0b;
            font-size: 16px;
          }

          .type-indicator {
            font-size: 14px;
            color: #4b5563;
            padding: 2px 8px;
            border-radius: 12px;
            background: #e5e7eb;
          }

          .question-type-multiple_choice .type-indicator {
            background: #dbeafe;
            color: #1d4ed8;
          }

          .question-type-open .type-indicator {
            background: #d1fae5;
            color: #047857;
          }

          .question-type-code .type-indicator {
            background: #ede9fe;
            color: #6d28d9;
          }

          .question-type-step_by_step .type-indicator {
            background: #fef3c7;
            color: #b45309;
          }

          .question-body {
            font-size: 18px;
            line-height: 1.7;
            padding: 32px;
            background: #ffffff;
            border-radius: 12px;
            color: #1e293b;
            position: relative;
            display: flex;
            flex-direction: column;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }

          /* New styles for the question text container */
          .question-body .question-content-wrapper {
            background: #f8f9fa;
            padding: 32px;  /* Increased padding */
            border-radius: 12px;  /* Increased border radius */
            border: 1px solid #e5e7eb;
            margin-bottom: 16px; /* Space between content and source */
            font-size: 19px;  /* Slightly larger font */
            font-weight: 500;  /* Semi-bold text */
            line-height: 1.8;  /* Increased line height for better readability */
            color: #1f2937;  /* Slightly darker text for better contrast */
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);  /* Subtle shadow */
          }

          .question-body .question-content-wrapper:hover {
            background: #f3f4f6;  /* Slightly darker on hover */
            transition: background-color 0.2s ease;
          }

          /* Updated source citation styling */
          .source-info {
            padding: 8px 12px;
            font-size: 13px;
            color: #64748b;
            align-self: flex-start; /* Align to left side */
            background: #f8fafc;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
            border-left: 3px solid #2196F3; /* Citation bar */
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            margin-right: auto; /* Push to left in RTL */
            margin-left: 24px; /* Indent from left */
            max-width: fit-content; /* Only take needed width */
            font-style: italic;
          }

          .source-info:hover {
            border-color: #e2e8f0;
            border-left-color: #2196F3;
            background: #f8fafc;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .source-info .ant-typography {
            font-size: 13px;
            color: inherit;
            display: block;
            text-align: left; /* Left alignment for citation */
            direction: rtl; /* Keep RTL for Hebrew text */
            unicode-bidi: embed;
            white-space: nowrap; /* Keep citation in one line */
          }

          .answer-section {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
          }

          .answer-header {
            margin-bottom: 16px;
          }

          .answer-header h3 {
            margin: 0;
            font-size: 18px;
            color: #1f2937;
          }

          .feedback-loading {
            padding: 24px;
            text-align: center;
            background-color: #f8fafc;
            border-top: 1px solid #e5e7eb;
          }

          .feedback-section {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
          }

          .action-bar {
            background: #f8fafc;
            padding: 8px 12px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
          }

          .action-bar:hover {
            border-color: #d1d5db;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .progress-status-bar {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }
        `}
      </style>
    </div>
  );
};

export default QuestionInteractionContainer;