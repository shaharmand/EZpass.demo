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
      {
        text: "קסדה ורתמת בטיחות",
        format: "markdown"
      },
      {
        text: "משקפי מגן וכפפות",
        format: "markdown"
      },
      {
        text: "נעלי בטיחות וביגוד מגן",
        format: "markdown"
      },
      {
        text: "כל התשובות נכונות",
        format: "markdown"
      }
    ],
    correctOption: 4,
    metadata: {
      topicId: "safety_equipment",
      difficulty: 1,
      source: {
        examType: "practice"
      }
    },
    solution: {
      text: "התשובה הנכונה היא 'כל התשובות נכונות'. בעבודה בגובה נדרש ציוד מגן מקיף הכולל קסדה, רתמת בטיחות, משקפי מגן, כפפות, נעלי בטיחות וביגוד מגן מתאים.",
      format: "markdown"
    },
    rubricAssessment: {
      criteria: [
        {
          name: "Correctness",
          description: "Selecting the right answer and demonstrating understanding",
          weight: 60
        },
        {
          name: "Understanding",
          description: "Showing comprehension of core concepts and why other options are wrong",
          weight: 40
        }
      ]
    },
    answerRequirements: {
      requiredElements: [
        "Correct option selection",
        "Understanding of comprehensive safety equipment needs",
        "Recognition that all listed items are necessary"
      ]
    }
  },
  {
    id: "test_question_2",
    type: "open",
    content: {
      text: "הסבר את העקרונות המרכזיים של תכנון בטיחות באתר בנייה. כיצד ניתן ליישם אותם הלכה למעשה?",
      format: "markdown"
    },
    metadata: {
      topicId: "safety_planning",
      difficulty: 3,
      source: {
        examType: "practice",
        year: 2024,
        author: "מומחה בטיחות"
      }
    },
    solution: {
      text: "תכנון בטיחות באתר בנייה מבוסס על מספר עקרונות מרכזיים...",
      format: "markdown"
    },
    rubricAssessment: {
      criteria: [
        {
          name: "Accuracy",
          description: "Correctness of the solution and understanding of safety principles",
          weight: 40
        },
        {
          name: "Methodology",
          description: "Proper approach to safety planning and implementation",
          weight: 30
        },
        {
          name: "Clarity",
          description: "Clear and organized presentation of safety concepts",
          weight: 30
        }
      ]
    },
    answerRequirements: {
      requiredElements: [
        "Core safety planning principles",
        "Practical implementation steps",
        "Risk assessment methodology",
        "Safety measure examples"
      ]
    }
  },
  {
    id: "test_question_3",
    type: "multiple_choice",
    content: {
      text: "איזה מהבאים אינו נחשב לגורם סיכון בעבודה בגובה?",
      format: "markdown"
    },
    options: [
      { text: "רוח חזקה", format: "markdown" },
      { text: "תאורה מספקת", format: "markdown" },
      { text: "משטח רטוב", format: "markdown" },
      { text: "ציוד לא תקין", format: "markdown" }
    ],
    correctOption: 2,
    metadata: {
      topicId: "height_safety",
      difficulty: 2,
      source: {
        examType: "practice",
        year: 2024
      }
    },
    solution: {
      text: "התשובה הנכונה היא 'תאורה מספקת'. בניגוד לשאר האפשרויות, תאורה מספקת היא למעשה אמצעי בטיחות ולא גורם סיכון.",
      format: "markdown"
    },
    rubricAssessment: {
      criteria: [
        {
          name: "Correctness",
          description: "Selecting the right answer and understanding risk factors",
          weight: 60
        },
        {
          name: "Understanding",
          description: "Distinguishing between safety measures and risk factors",
          weight: 40
        }
      ]
    },
    answerRequirements: {
      requiredElements: [
        "Correct identification of non-risk factor",
        "Understanding of what constitutes a risk factor",
        "Recognition of safety measures versus hazards"
      ]
    }
  },
  {
    id: "test_question_4",
    type: "step_by_step",
    content: {
      text: "תאר את תהליך הבדיקה והרכבה של פיגום זקפים לפי התקן. פרט כל שלב.",
      format: "markdown"
    },
    metadata: {
      topicId: "scaffolding_safety",
      subtopicId: "setup_inspection",
      difficulty: 4,
      source: {
        examType: "practice",
        year: 2024,
        season: "קיץ",
        author: "מהנדס בטיחות"
      }
    },
    solution: {
      text: "1. בדיקת תשתית...\n2. הרכבת בסיס...\n3. התקנת זקפים...",
      format: "markdown"
    },
    rubricAssessment: {
      criteria: [
        {
          name: "Process",
          description: "Following correct inspection and assembly steps in order",
          weight: 40
        },
        {
          name: "Calculations",
          description: "Accurate measurements and specifications",
          weight: 30
        },
        {
          name: "Validation",
          description: "Proper safety checks and standards compliance",
          weight: 30
        }
      ]
    },
    answerRequirements: {
      requiredElements: [
        "Complete step sequence",
        "Safety standard references",
        "Required measurements",
        "Inspection criteria",
        "Assembly procedure details"
      ]
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