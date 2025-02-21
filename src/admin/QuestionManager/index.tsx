import React, { useState, useCallback } from 'react';
import { Card, Space, Button, Typography, Input, message } from 'antd';
import QuestionViewer from '../../components/QuestionViewer';
import QuestionFeedbackView from '../../components/QuestionFeedback';
import type { Question, QuestionFeedback } from '../../types/question';
import { FeedbackService } from '../../services/llm/feedbackGenerationService';
import { ExamType } from '../../types/exam';
import { examService } from '../../services/examService';
import { logger } from '../../utils/logger';
import QuestionInteractionContainer from '../../components/practice/QuestionInteractionContainer';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Sample questions for testing different source formats
const testQuestions: Question[] = [
  {
    id: "test_question_1",
    type: "multiple_choice",
    content: {
      text: "מהו הציוד המגן האישי הנדרש בעת עבודה בגובה?",
      format: "markdown"
    },
    options: [
      { text: "קסדה בלבד", format: "markdown" },
      { text: "קסדה ורתמת בטיחות", format: "markdown" },
      { text: "קסדה, רתמת בטיחות ונעלי בטיחות", format: "markdown" },
      { text: "רתמת בטיחות בלבד", format: "markdown" }
    ],
    correctOption: 3,
    metadata: {
      topicId: "safety_management",
      difficulty: 1,
      source: {
        examType: "בגרות",
        year: 2024,
        season: "אביב",
        moed: "א"
      }
    },
    solution: {
      text: "התשובה הנכונה היא קסדה, רתמת בטיחות ונעלי בטיחות. בעבודה בגובה חובה להשתמש בכל פריטי ציוד המגן האישי הנדרשים להגנה מפני נפילה ופגיעה.",
      format: "markdown"
    }
  },
  {
    id: "test_question_2",
    type: "open",
    content: {
      text: "הסבר את תהליך הבטיחות בעבודה עם חומרים מסוכנים",
      format: "markdown"
    },
    metadata: {
      topicId: "hazardous_materials",
      difficulty: 3,
      source: {
        examType: "מה״ט",
        year: 2023,
        author: "המכון הממשלתי להכשרה טכנולוגית"
      }
    },
    solution: {
      text: "תהליך העבודה עם חומרים מסוכנים כולל...",
      format: "markdown"
    }
  },
  {
    id: "test_question_3",
    type: "multiple_choice",
    content: {
      text: "מהו המרחק המינימלי הנדרש בין עובדים בעבודה בגובה?",
      format: "markdown"
    },
    options: [
      { text: "1 מטר", format: "markdown" },
      { text: "2 מטר", format: "markdown" },
      { text: "3 מטר", format: "markdown" },
      { text: "4 מטר", format: "markdown" }
    ],
    correctOption: 2,
    metadata: {
      topicId: "safety_management",
      difficulty: 2,
      source: {
        examType: "תרגול",
        author: "מכללת הנדסאים תל אביב"
      }
    },
    solution: {
      text: "המרחק המינימלי הוא 2 מטר כדי למנוע התנגשויות...",
      format: "markdown"
    }
  },
  {
    id: "test_question_4",
    type: "step_by_step",
    content: {
      text: "תאר את שלבי ההכנה לעבודה בגובה",
      format: "markdown"
    },
    metadata: {
      topicId: "safety_procedures",
      subtopicId: "height_work_prep",
      difficulty: 4,
      source: {
        examType: "הסמכה",
        year: 2024,
        season: "חורף",
        author: "משרד העבודה - אגף הפיקוח"
      }
    },
    solution: {
      text: "שלבי ההכנה כוללים...",
      format: "markdown"
    }
  }
];

const QuestionManager: React.FC = () => {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState<string>('');
  const [feedback, setFeedback] = useState<QuestionFeedback | null>(null);
  const [loading, setLoading] = useState(false);

  const currentQuestion = testQuestions[selectedQuestionIndex];

  const handleTestAnswer = async (answer: string) => {
    try {
      setLoading(true);
      const feedbackService = new FeedbackService();

      // Get subject name and log the result
      let subject: string;
      try {
        subject = await examService.getSubjectNameForTopic(currentQuestion.metadata.topicId);
        logger.info('Successfully retrieved subject name:', {
          topicId: currentQuestion.metadata.topicId,
          subjectName: subject
        });
      } catch (error) {
        logger.error('Failed to get subject name:', {
          error,
          topicId: currentQuestion.metadata.topicId,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }

      const result = await feedbackService.generateFeedback({
        question: currentQuestion,
        studentAnswer: answer,
        formalExamName: `${currentQuestion.metadata.source?.examType?.toUpperCase() || 'MAHAT'} - ${subject} Sample Question`,
        examType: currentQuestion.metadata.source?.examType as ExamType || ExamType.MAHAT,
        subject
      });
      setFeedback(result);
    } catch (error) {
      message.error('Failed to generate feedback');
      logger.error('Feedback generation failed:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Title level={4}>Question Source Display Test</Title>
          <Space>
            {testQuestions.map((_, index) => (
              <Button 
                key={index}
                type={selectedQuestionIndex === index ? 'primary' : 'default'}
                onClick={() => setSelectedQuestionIndex(index)}
              >
                Question {index + 1}
              </Button>
            ))}
          </Space>
        </Card>

        <Card>
          <QuestionInteractionContainer
            question={currentQuestion}
            onAnswer={async () => {}}
            onSkip={async () => {}}
            onHelp={() => {}}
            onNext={() => {}}
            onRetry={() => {}}
            state={{
              status: 'ready',
              questionIndex: selectedQuestionIndex,
              correctAnswers: 0,
              averageScore: 0
            }}
            filters={{}}
            onFiltersChange={() => {}}
          />
        </Card>

        <Card title="Your Answer">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input.TextArea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your answer here..."
              rows={4}
            />
            <Button 
              type="primary"
              onClick={() => handleTestAnswer(answer)}
              loading={loading}
            >
              Submit Answer
            </Button>
          </Space>
        </Card>

        {feedback && (
          <Card title="Feedback">
            <QuestionFeedbackView feedback={feedback} />
          </Card>
        )}
      </Space>
    </div>
  );
};

export default QuestionManager; 