import React, { useEffect, useRef, useState, memo } from 'react';
import { Space, Spin, Typography, Card, Button, Divider, Tooltip, Tag, Select, Popover, Modal, notification, Alert } from 'antd';
import { FilterOutlined, DownOutlined, UpOutlined, StarFilled, StarOutlined, ClockCircleOutlined, AimOutlined, StopOutlined } from '@ant-design/icons';
import CrosshairOutlined from '@ant-design/icons';
import { Question, QuestionFeedback as QuestionFeedbackType, FilterState, QuestionType } from '../../types/question';
import { SkipReason } from '../../types/prepUI';
import type { StudentPrep } from '../../types/prepState';
import { getActiveTime } from '../../types/prepState';
import QuestionContent from '../QuestionContent';
import { FeedbackContainer } from '../feedback/FeedbackContainer';
import QuestionResponseInput from '../QuestionResponseInput';
import QuestionActions from './QuestionActions';
import QuestionSetProgress from './QuestionSetProgress';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionFilter } from './QuestionFilter';
import { logger, CRITICAL_SECTIONS } from '../../utils/logger';
import { universalTopics } from '../../services/universalTopics';
import { getQuestionTopicName, getQuestionTypeLabel } from '../../utils/questionUtils';
import '../../styles/metadata.css';
import './QuestionSetProgress.css';
import { PrepStateManager } from '../../services/PrepStateManager';
import { examService } from '../../services/examService';
import { Tree } from 'antd';
import type { Topic } from '../../types/subject';
import { TopicSelectionDialog } from './TopicSelectionDialog';
import { getQuestionSourceDisplay } from '../../utils/translations';
import { usePracticeAttempts } from '../../contexts/PracticeAttemptsContext';

const { Text, Title } = Typography;

interface QuestionInteractionContainerProps {
  question: Question;
  onAnswer: (answer: string) => Promise<void>;
  onSkip: (reason: SkipReason, filters?: FilterState) => Promise<void>;
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
  prep: StudentPrep;
  isQuestionLoading?: boolean;
  showDetailedFeedback?: boolean;
}

const QUESTION_TYPE_COLORS: Record<QuestionType, string> = {
  multiple_choice: '#3b82f6',
  open: '#10b981',
  code: '#8b5cf6',
  step_by_step: '#f59e0b'
};

const getDifficultyLabel = (difficulty: number): string => {
  switch (difficulty) {
    case 1: return 'קל מאוד';
    case 2: return 'קל';
    case 3: return 'בינוני';
    case 4: return 'קשה';
    case 5: return 'קשה מאוד';
    default: return `רמה ${difficulty}`;
  }
};

const QuestionInteractionContainer: React.FC<QuestionInteractionContainerProps> = ({
  question,
  onAnswer,
  onSkip,
  onHelp,
  onNext,
  onRetry,
  state,
  filters,
  onFiltersChange,
  prep,
  isQuestionLoading,
  showDetailedFeedback = true
}) => {
  const { isInLimitedFeedbackMode } = usePracticeAttempts();
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [difficultyPopoverVisible, setDifficultyPopoverVisible] = useState(false);
  const [typePopoverVisible, setTypePopoverVisible] = useState(false);
  const [subtopicPopoverVisible, setSubtopicPopoverVisible] = useState(false);
  const [difficultyPopoverTimer, setDifficultyPopoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [typePopoverTimer, setTypePopoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [subtopicPopoverTimer, setSubtopicPopoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [isClickProcessing, setIsClickProcessing] = useState(false);
  const [isDifficultyPopoverClicked, setIsDifficultyPopoverClicked] = useState(false);
  const [isSubtopicPopoverClicked, setIsSubtopicPopoverClicked] = useState(false);
  const [isSubtopicPopoverCooldown, setIsSubtopicPopoverCooldown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [focusedTopicId, setFocusedTopicId] = useState<string | null>(null);
  const [isTopicSelectionDialogOpen, setIsTopicSelectionDialogOpen] = useState(false);

  // Track current batch of 10 questions
  const [currentBatch, setCurrentBatch] = useState<Array<{
    index: number;
    isCorrect?: boolean;
    score?: number;
    status: 'pending' | 'active' | 'completed';
  }>>([]);

  // Get daily progress metrics from PrepStateManager
  const [dailyProgress, setDailyProgress] = useState(() => PrepStateManager.getDailyProgress(prep));

  // Update daily progress when exam date changes
  useEffect(() => {
    setDailyProgress(PrepStateManager.getDailyProgress(prep));
  }, [prep.goals.examDate, prep.state.status, getActiveTime(prep.state)]);

  // Popover handlers
  const handleDifficultyPopoverVisibilityChange = (visible: boolean) => {
    if (!visible && difficultyPopoverTimer) {
      clearTimeout(difficultyPopoverTimer);
      setDifficultyPopoverTimer(null);
    }
    setDifficultyPopoverVisible(visible);
    if (!visible) {
      setIsDifficultyPopoverClicked(false);
    }
  };

  const handleTypePopoverVisibilityChange = (visible: boolean) => {
    if (!visible && typePopoverTimer) {
      clearTimeout(typePopoverTimer);
      setTypePopoverTimer(null);
    }
    if (!isClickProcessing) {
      setTypePopoverVisible(visible);
    }
  };

  const handleSubtopicPopoverVisibilityChange = (visible: boolean) => {
    if (!visible && subtopicPopoverTimer) {
      clearTimeout(subtopicPopoverTimer);
      setSubtopicPopoverTimer(null);
    }
    setSubtopicPopoverVisible(visible);
    if (!visible) {
      setIsSubtopicPopoverClicked(false);
      setIsSubtopicPopoverCooldown(true);
      setTimeout(() => {
        setIsSubtopicPopoverCooldown(false);
      }, 300);
    }
  };

  const handleDifficultyPopoverMouseEnter = () => {
    if (difficultyPopoverTimer) {
      clearTimeout(difficultyPopoverTimer);
      setDifficultyPopoverTimer(null);
    }
    setDifficultyPopoverVisible(true);
  };

  const handleTypePopoverMouseEnter = () => {
    if (typePopoverTimer) {
      clearTimeout(typePopoverTimer);
      setTypePopoverTimer(null);
    }
    if (!isClickProcessing) {
      setTypePopoverVisible(true);
    }
  };

  const handleSubtopicPopoverMouseEnter = () => {
    if (subtopicPopoverTimer) {
      clearTimeout(subtopicPopoverTimer);
      setSubtopicPopoverTimer(null);
    }
    if (!isSubtopicPopoverCooldown) {
      setSubtopicPopoverVisible(true);
    }
  };

  const handleDifficultyPopoverMouseLeave = () => {
    if (!isDifficultyPopoverClicked) {
      const timer = setTimeout(() => {
        setDifficultyPopoverVisible(false);
      }, 300);
      setDifficultyPopoverTimer(timer);
    }
  };

  const handleTypePopoverMouseLeave = () => {
    const timer = setTimeout(() => {
      setTypePopoverVisible(false);
    }, 300);
    setTypePopoverTimer(timer);
  };

  const handleSubtopicPopoverMouseLeave = () => {
    if (!isSubtopicPopoverClicked) {
      const timer = setTimeout(() => {
        setSubtopicPopoverVisible(false);
      }, 300);
      setSubtopicPopoverTimer(timer);
    }
  };

  // Type selection handler
  const handleTypeSelect = (type: QuestionType | 'all') => {
    // Prevent any ongoing state updates
    event?.stopPropagation();
    
    // Set click processing flag
    setIsClickProcessing(true);
    
    // Immediately close the popover
    setTypePopoverVisible(false);
    if (typePopoverTimer) {
      clearTimeout(typePopoverTimer);
      setTypePopoverTimer(null);
    }
    
    // Create a new filter object to ensure state update
    const updatedFilters = { ...filters };
    if (type === 'all') {
      delete updatedFilters.questionTypes;
    } else {
      updatedFilters.questionTypes = [type as QuestionType];
    }

    // Update filters and skip if needed
    onFiltersChange(updatedFilters);
    
    // Only skip if selecting a specific type that's different from current
    if (type !== 'all' && type !== question.type) {
      onSkip('not_in_material', updatedFilters);
    }

    // Reset click processing flag after a short delay
    setTimeout(() => {
      setIsClickProcessing(false);
    }, 300);
  };

  // Helper function to check if a subtopic is focused
  const isSubtopicFocused = (subtopicId: string) => 
    filters.subTopics?.length === 1 && filters.subTopics[0] === subtopicId;

  // Helper function to check if a question type is focused
  const isTypeFocused = (type: QuestionType): boolean => 
    filters.questionTypes?.length === 1 && filters.questionTypes[0] === type;

  // Subtopic focus handler
  const handleSubtopicFocus = () => {
    if (!question.metadata.subtopicId) return;

    // Preserve all existing filters, just update subTopics
    const updatedFilters = {
      ...filters,
      subTopics: [question.metadata.subtopicId]
    };

    setSubtopicPopoverVisible(false);
    setIsFocused(!!updatedFilters.subTopics?.length);
    onFiltersChange(updatedFilters);

    logger.info('Focusing on subtopic:', {
      subtopicId: question.metadata.subtopicId,
      allFilters: updatedFilters
    });
  };

  // Function to get subtopic info
  const getSubtopicInfo = () => {
    const { topicId, subtopicId } = question.metadata;
    if (!subtopicId) return null;
    return universalTopics.getSubtopicInfo(topicId, subtopicId);
  };

  // Popover content components
  const TypeFilterContent = () => {
    const questionTypes = [
      { type: 'all' as const, label: 'כל סוגי השאלות' },
      { type: 'multiple_choice' as QuestionType, label: 'שאלות סגורות' },
      { type: 'open' as QuestionType, label: 'שאלות פתוחות' },
      { type: 'step_by_step' as QuestionType, label: 'שאלות חישוביות' }
    ];

    const isTypeSelected = (type: QuestionType | 'all'): boolean => {
      if (type === 'all') return !filters.questionTypes;
      return filters.questionTypes?.length === 1 && filters.questionTypes[0] === type;
    };

    return (
      <div 
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={handleTypePopoverMouseEnter}
        onMouseLeave={handleTypePopoverMouseLeave}
        style={{ 
          width: '100%',
          maxWidth: '280px',
          padding: '16px',
          overflow: 'hidden'
        }}
      >
        <Text strong style={{ 
          display: 'block', 
          marginBottom: '4px',
          color: '#111827',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          סוג שאלה: {getQuestionTypeLabel(question.type)}
        </Text>
        <Text style={{
          display: 'block',
          marginBottom: '12px',
          color: '#6B7280',
          fontSize: '13px',
          textAlign: 'center',
          paddingBottom: '8px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          האם תרצה להתמקד בסוג שאלה מסוים?
        </Text>
        <Space direction="vertical" style={{ width: '100%' }} size={6}>
          {questionTypes.map(({ type, label }) => {
            const isSelected = isTypeSelected(type);
            return (
              <Button
                key={type}
                onClick={() => handleTypeSelect(type)}
                style={{ 
                  width: '100%',
                  justifyContent: 'center',
                  background: isSelected ? '#f0f9ff' : 'white',
                  borderColor: isSelected ? '#93c5fd' : '#E5E7EB',
                  color: isSelected ? '#1d4ed8' : '#64748b',
                  height: '32px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  padding: '0 10px'
                }}
              >
                {label}
              </Button>
            );
          })}
        </Space>
      </div>
    );
  };

  const DifficultyFeedbackContent = () => {
    const options = [
      { reason: 'ok' as any, label: 'רמת הקושי בסדר' },
      { reason: 'too_hard' as SkipReason, label: 'קשה מדי' },
      { reason: 'too_easy' as SkipReason, label: 'קלה מדי' }
    ];

    return (
      <div 
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={handleDifficultyPopoverMouseEnter}
        onMouseLeave={handleDifficultyPopoverMouseLeave}
        style={{ width: '100%', minWidth: '200px' }}
      >
        <Text strong style={{ 
          display: 'block', 
          marginBottom: '4px',
          color: '#111827',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          רמת קושי: {getDifficultyLabel(question.metadata.difficulty)}
        </Text>
        <Text style={{
          display: 'block',
          marginBottom: '12px',
          color: '#6B7280',
          fontSize: '13px',
          textAlign: 'center',
          paddingBottom: '8px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          האם רמת הקושי של השאלה מתאימה?
        </Text>
        <Space direction="vertical" style={{ width: '100%' }} size={6}>
          {options.map(({ reason, label }) => (
            <Button
              key={reason}
              onClick={() => {
                if (reason !== 'ok') {
                  onSkip(reason);
                }
                setDifficultyPopoverVisible(false);
              }}
              style={{ 
                width: '100%',
                justifyContent: 'center',
                background: reason === 'ok' ? '#f0f9ff' : 'white',
                borderColor: reason === 'ok' ? '#93c5fd' : '#E5E7EB',
                color: reason === 'ok' ? '#1d4ed8' : '#64748b',
                height: '32px',
                borderRadius: '6px',
                fontSize: '14px',
                padding: '0 10px'
              }}
            >
              {label}
            </Button>
          ))}
        </Space>
      </div>
    );
  };

  const SubtopicPopoverContent = () => {
    const subtopicInfo = getSubtopicInfo();
    const isSubtopicFocused = question.metadata.subtopicId && 
      filters.subTopics?.length === 1 && 
      filters.subTopics[0] === question.metadata.subtopicId;

    // Get the topic name from the parent topic of the subtopic
    const topicName = universalTopics.getTopic(question.metadata.topicId)?.name || getQuestionTopicName(question);

    const closePopover = () => {
      setIsSubtopicPopoverClicked(false);
      setSubtopicPopoverVisible(false);
      setIsSubtopicPopoverCooldown(true);
      setTimeout(() => {
        setIsSubtopicPopoverCooldown(false);
      }, 300);
    };

    // Handle removing focus (filter only)
    const handleRemoveFocus = () => {
      // Create new filters object without subTopics, preserving all other filters
      const { subTopics, ...otherFilters } = filters;
      
      closePopover();
      setIsFocused(false);
      onFiltersChange(otherFilters);

      logger.info('Removing subtopic focus:', {
        previousSubTopics: subTopics,
        remainingFilters: otherFilters
      });
    };

    // Handle removing topic from exam (updates prep state and filters)
    const handleRemoveFromExam = async (subtopicId: string) => {
      if (!prep) return;
      
      // Get current prep state
      const freshPrep = PrepStateManager.getPrep(prep.id);
      if (!freshPrep) return;

      // Remove subtopic from selection
      const updatedPrep: StudentPrep = {
        ...freshPrep,
        selection: {
          subTopics: freshPrep.selection.subTopics.filter(id => id !== subtopicId)
        }
      };

      // Save updated prep
      PrepStateManager.updatePrep(updatedPrep);

      // Calculate total subtopics
      const totalSubtopics = prep.exam.topics.reduce((acc, topic) => 
        acc + topic.subTopics.length, 0
      );

      // Show notification
      notification.info({
        message: 'תכולת המבחן עודכנה',
        description: `תכולת המבחן שלך שונתה לכלול ${updatedPrep.selection.subTopics.length} תת-נושאים מתוך ${totalSubtopics}`,
        placement: 'topLeft',
        duration: 3,
      });

      // Close popover
      closePopover();
    };

    return (
      <div 
        style={{ width: 320, padding: '16px' }}
        onMouseEnter={handleSubtopicPopoverMouseEnter}
        onMouseLeave={handleSubtopicPopoverMouseLeave}
      >
        <div style={{ marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
          <Text strong style={{ 
            display: 'block', 
            fontSize: '15px',
            color: '#1f2937',
            marginBottom: '4px'
          }}>
            {subtopicInfo?.name} ({topicName})
          </Text>
          {subtopicInfo?.description && (
            <Text style={{ 
              fontSize: '13px',
              color: '#6b7280'
            }}>
              {subtopicInfo.description}
            </Text>
          )}
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          <Button
            type="default"
            onClick={() => {
              handleRemoveFocus();
              closePopover();
            }}
            style={{ 
              width: '100%',
              textAlign: 'right',
              justifyContent: 'flex-start',
              height: '40px',
              borderRadius: '12px',
              fontWeight: 500,
              background: !isSubtopicFocused ? '#EBF5FF' : '#ffffff',
              borderColor: !isSubtopicFocused ? '#60A5FA' : '#e5e7eb',
              color: !isSubtopicFocused ? '#2563EB' : '#1f2937'
            }}
          >
            תרגול בכל הנושאים
          </Button>
          <Button
            type="default"
            icon={<AimOutlined style={{ color: isSubtopicFocused ? '#2563EB' : '#64748b' }} />}
            onClick={() => {
              handleSubtopicFocus();
              closePopover();
            }}
            style={{ 
              width: '100%',
              textAlign: 'right',
              justifyContent: 'flex-start',
              height: '40px',
              borderRadius: '12px',
              fontWeight: 500,
              background: isSubtopicFocused ? '#EBF5FF' : '#ffffff',
              borderColor: isSubtopicFocused ? '#60A5FA' : '#e5e7eb',
              color: isSubtopicFocused ? '#2563EB' : '#1f2937'
            }}
          >
            התמקד בנושא זה
          </Button>
          <Button
            type="default"
            icon={<AimOutlined style={{ color: '#64748b' }} />}
            onClick={() => {
              closePopover();
              setTimeout(() => {
                setIsTopicSelectionDialogOpen(true);
              }, 100);
            }}
            style={{ 
              width: '100%',
              textAlign: 'right',
              justifyContent: 'flex-start',
              height: '40px',
              borderRadius: '12px',
              fontWeight: 500,
              background: '#ffffff',
              borderColor: '#e5e7eb',
              color: '#1f2937'
            }}
          >
            התמקד בנושא אחר
          </Button>
          <Divider style={{ margin: '4px 0' }} />
          <Button
            type="default"
            icon={<StopOutlined style={{ color: '#ef4444' }} />}
            onClick={() => {
              if (question.metadata.subtopicId) {
                handleRemoveFromExam(question.metadata.subtopicId);
              }
            }}
            style={{ 
              width: '100%',
              textAlign: 'right',
              justifyContent: 'flex-start',
              height: '40px',
              borderRadius: '12px',
              fontWeight: 500,
              borderColor: '#fca5a5',
              color: '#ef4444',
              background: '#fff1f2'
            }}
          >
            הורד נושא זה מתכולת המבחן
          </Button>
        </Space>
      </div>
    );
  };

  const renderDifficultyOption = (difficulty: number) => {
    return (
      <Space>
        {[...Array(5)].map((_, i) => (
          i < difficulty ? 
            <StarFilled key={i} style={{ color: '#f59e0b', fontSize: '12px' }} /> :
            <StarOutlined key={i} style={{ color: '#d1d5db', fontSize: '12px' }} />
        ))}
      </Space>
    );
  };

  // Initialize or reset batch when starting new practice
  useEffect(() => {
    if (prep && (!currentBatch.length || currentBatch.length !== 10)) {
      setCurrentBatch(Array.from({ length: 10 }, (_, i) => ({
        index: i,
        status: i === 0 ? 'active' : 'pending'
      })));
    }
  }, [prep]);

  // Update batch when question is answered
  useEffect(() => {
    if (!state.feedback) return;

    logger.info('Feedback update:', {
      hasFeedback: !!state.feedback,
      batchLength: currentBatch.length,
      currentQuestion: state.questionIndex,
      feedback: state.feedback
    });

    // Find current active question in batch
    const currentIndex = currentBatch.findIndex(q => q.status === 'active');
    if (currentIndex === -1) return;

    // Create new batch array with updated current question
    const newBatch = [...currentBatch];
    newBatch[currentIndex] = {
      ...newBatch[currentIndex],
      isCorrect: state.feedback.isCorrect,
      score: state.feedback.score,
      status: 'completed'
    };

    // Set next question as active if available
    if (currentIndex + 1 < newBatch.length) {
      newBatch[currentIndex + 1].status = 'active';
    }

    setCurrentBatch(newBatch);
  }, [state.feedback]);

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

  // Calculate last 24 hours progress
  const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
  const questionsAnsweredToday = prep.state.status !== 'initializing' && prep.state.status !== 'not_started' 
    ? prep.state.questionHistory?.filter((q: { timestamp: number }) => q.timestamp >= last24Hours).length || 0
    : 0;

  // For time, we're still showing total active time in minutes
  const dailyTimeProgress = Math.round(getActiveTime(prep.state) / (60 * 1000));

  // Calculate days until exam based on prep.goals.examDate
  const now = Date.now();
  const daysUntilExam = Math.max(1, Math.ceil((prep.goals.examDate - now) / (1000 * 60 * 60 * 24)));

  // Calculate daily goals based on actual days until exam
  const dailyQuestionsGoal = Math.ceil(prep.goals.questionGoal / daysUntilExam);
  const dailyTimeGoalMinutes = prep.goals.dailyHours * 60; // Convert hours to minutes

  const isDailyTimeGoalExceeded = dailyTimeProgress > dailyTimeGoalMinutes;
  const isDailyQuestionsGoalExceeded = questionsAnsweredToday > dailyQuestionsGoal;

  // Add difficulty options
  const difficultyOptions = [
    { value: 1, label: 'קל מאוד', color: '#f59e0b' },
    { value: 2, label: 'קל', color: '#f59e0b' },
    { value: 3, label: 'בינוני', color: '#f59e0b' },
    { value: 4, label: 'קשה', color: '#f59e0b' },
    { value: 5, label: 'קשה מאוד', color: '#f59e0b' }
  ];

  const handleAnswerSubmit = async (answer: string) => {
    setSelectedAnswer(answer);
    await onAnswer(answer);
  };

  const handleTopicFocusClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTopicSelectionDialogOpen(true);
  };

  const handleTopicFocusSelect = (topicId: string) => {
    setFocusedTopicId(topicId);
    setIsFocused(true);
    setIsTopicSelectionDialogOpen(false);
  };

  // Update isFocused state whenever filters change
  useEffect(() => {
    setIsFocused(!!filters.subTopics?.length);
  }, [filters.subTopics]);

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
    <div className="question-interaction-container">
      {isInLimitedFeedbackMode && (
        <Alert
          message="מצב תרגול מתקדם"
          description="את/ה במצב משוב מצומצם המדמה תנאי מבחן אמיתיים"
          type="info"
          showIcon
          className="limited-feedback-alert"
          style={{ marginBottom: '16px' }}
        />
      )}
      
      <QuestionSetProgress
        currentQuestionIndex={state.questionIndex}
        totalQuestions={10}
        questionId={question.id}
        prepId={prep.id}
      />

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
                    <Popover 
                      content={<SubtopicPopoverContent />}
                      trigger={['hover', 'click']}
                      placement="bottom"
                      open={subtopicPopoverVisible}
                      onOpenChange={handleSubtopicPopoverVisibilityChange}
                      overlayInnerStyle={{
                        padding: '12px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                      }}
                    >
                      <span 
                        onMouseEnter={handleSubtopicPopoverMouseEnter}
                        onMouseLeave={handleSubtopicPopoverMouseLeave}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsSubtopicPopoverClicked(true);
                          setSubtopicPopoverVisible(!subtopicPopoverVisible);
                        }}
                        className="topic-selector"
                        style={{ cursor: 'pointer' }}
                      >
                        <span>שאלה ב</span>
                        <span className={`topic-name ${isFocused ? 'focused' : ''}`}>
                          {getQuestionTopicName(question)}
                          <AimOutlined className="focus-icon" />
                        </span>
                      </span>
                    </Popover>
                  </h2>
                  <div className="metadata-indicators">
                    <Popover 
                      content={<DifficultyFeedbackContent />}
                      trigger={['hover', 'click']}
                      placement="bottom"
                      open={difficultyPopoverVisible}
                      onOpenChange={handleDifficultyPopoverVisibilityChange}
                      arrowPointAtCenter={true}
                      overlayStyle={{
                        pointerEvents: 'auto'
                      }}
                      overlayInnerStyle={{
                        padding: '12px',
                        borderRadius: '12px',
                        minWidth: '200px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                      }}
                    >
                      <div 
                        className="difficulty-selector"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDifficultyPopoverClicked(true);
                          setDifficultyPopoverVisible(!difficultyPopoverVisible);
                        }}
                        onMouseEnter={handleDifficultyPopoverMouseEnter}
                        onMouseLeave={handleDifficultyPopoverMouseLeave}
                      >
                        {renderDifficultyOption(question.metadata.difficulty)}
                      </div>
                    </Popover>
                    <Popover 
                      content={<TypeFilterContent />}
                      trigger={['hover', 'click']}
                      placement="bottom"
                      open={typePopoverVisible}
                      onOpenChange={handleTypePopoverVisibilityChange}
                      destroyTooltipOnHide={true}
                      overlayStyle={{
                        pointerEvents: 'auto'
                      }}
                      overlayInnerStyle={{
                        padding: 0,
                        borderRadius: '12px',
                        width: '280px',
                        maxWidth: '280px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                      }}
                    >
                      <div 
                        className={`type-selector ${isTypeFocused(question.type) ? 'focused' : ''}`}
                        onMouseEnter={handleTypePopoverMouseEnter}
                        onMouseLeave={handleTypePopoverMouseLeave}
                      >
                        {getQuestionTypeLabel(question.type)}
                        <AimOutlined className="focus-icon" style={{ 
                          color: isTypeFocused(question.type) ? '#2563eb' : '#64748b'
                        }} />
                      </div>
                    </Popover>
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
                      {getQuestionSourceDisplay(question.metadata.source)}
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

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
                onAnswer={handleAnswerSubmit}
                onRetry={() => {
                  setSelectedAnswer('');
                  onRetry();
                }}
                disabled={state.status === 'submitted'}
                feedback={state.feedback ? {
                  isCorrect: state.feedback.isCorrect,
                  score: state.feedback.score
                } : undefined}
                selectedAnswer={selectedAnswer}
              />
            </div>
          </motion.div>
        </AnimatePresence>

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
                  onRetry={() => {
                    setSelectedAnswer('');
                    onRetry();
                  }}
                  onNext={onNext}
                  selectedAnswer={selectedAnswer}
                  showDetailedFeedback={showDetailedFeedback}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      <style>
        {`
          .question-interaction-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: 100%;
          }

          .question-card {
            position: relative;
            margin-top: 0;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
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
            width: 100%;
          }

          .question-body .question-content-wrapper {
            background: #f8f9fa;
            padding: 32px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            margin-bottom: 16px;
            font-size: 19px;
            font-weight: 500;
            line-height: 1.8;
            color: #1f2937;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
            width: 100%;
          }

          .question-body .question-content-wrapper:hover {
            background: #f3f4f6;
            transition: background-color 0.2s ease;
          }

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
            padding: 6px;
            background: #f8fafc;
            border-radius: 20px;
            border: 1px solid #e5e7eb;
            transition: all 0.2s ease;
          }

          .metadata-indicators:hover {
            border-color: #d1d5db;
            background: #f3f4f6;
          }

          .difficulty-selector {
            display: flex;
            gap: 2px;
            padding: 4px 12px;
            border-radius: 16px;
            border: 1.5px solid #d1d5db;
            background: white;
            transition: all 0.2s ease;
            cursor: pointer;
            font-size: 14px;
            line-height: 20px;
            min-height: 32px;
            align-items: center;
          }

          .type-selector {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 14px;
            line-height: 1.4;
            background-color: #f3f4f6;
            border: 1.5px solid #d1d5db;
            transition: all 0.2s ease;
            cursor: pointer;
          }

          .type-selector:hover {
            background-color: #e5e7eb;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }

          .type-selector.focused {
            background-color: #e0f2fe;
            border-color: #60a5fa;
            color: #1e40af;
          }

          .type-selector.focused:hover {
            background-color: #dbeafe;
            border-color: #3b82f6;
          }

          .type-selector .focus-icon {
            font-size: 14px;
            opacity: 0.7;
          }

          .type-selector.focused .focus-icon {
            opacity: 1;
          }

          .difficulty-selector:hover,
          .type-selector:hover {
            border-color: #60A5FA;
            background-color: #EBF5FF;
            color: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .difficulty-selector:active,
          .type-selector:active {
            transform: translateY(0);
            box-shadow: none;
          }

          .focus-icon {
            color: #64748b;
            font-size: 14px;
            transition: all 0.2s ease;
            opacity: 0.7;
          }

          .topic-name.focused .focus-icon,
          .topic-selector:hover .focus-icon,
          .type-selector:hover .focus-icon {
            color: #2563eb;
            opacity: 1;
          }

          .topic-selector {
            transition: all 0.2s ease;
            padding: 4px 8px;
            border-radius: 4px;
            color: #1f2937;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: none;
            background: transparent;
          }

          .topic-name {
            padding: 4px 12px;
            border-radius: 16px;
            border: 1.5px solid #d1d5db;
            background: #f8fafc;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .topic-name.focused {
            color: #2563eb;
            background-color: #EBF5FF;
            border-color: #60A5FA;
          }

          .topic-selector:hover {
            border-color: transparent;
            background-color: transparent;
          }

          .topic-selector:hover .topic-name {
            border-color: #60A5FA;
            background-color: #EBF5FF;
            color: #2563eb;
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

          .ant-popover-content .ant-popover-inner {
            padding: 0;
            border-radius: 12px;
          }

          .type-filter-button {
            margin: 0;
            padding: 6px 12px;
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
        `}
      </style>
      <TopicSelectionDialog
        exam={prep.exam}
        open={isTopicSelectionDialogOpen}
        onClose={() => setIsTopicSelectionDialogOpen(false)}
        currentFilters={filters}
        onFilterChange={(updatedFilters) => {
          setIsFocused(!!updatedFilters.subTopics?.length);
          onFiltersChange(updatedFilters);
        }}
        currentQuestion={question}
        onSkip={onSkip}
      />
    </div>
  );
};

export default memo(QuestionInteractionContainer);