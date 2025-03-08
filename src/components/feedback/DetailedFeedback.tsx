import React from 'react';
import { Typography, Progress, Tabs } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { DetailedQuestionFeedback } from '../../types/feedback/types';
import { Question } from '../../types/question';
import { getFeedbackColor, getFeedbackTitle, getHebrewEvalLevel } from '../../utils/feedbackStyles';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { RubricFeedback } from './RubricFeedback';
import './Feedback.css';

const { Text, Title } = Typography;

interface DetailedFeedbackProps {
  feedback: DetailedQuestionFeedback;
  question: Question;
}

export const DetailedFeedback: React.FC<DetailedFeedbackProps> = ({ feedback, question }) => {
  console.log('Detailed Feedback Data:', {
    hasCoreFeedback: !!feedback.coreFeedback,
    hasDetailedFeedback: !!feedback.detailedFeedback,
    hasSolution: !!question.schoolAnswer?.solution,
    feedback,
    question
  });

  return (
    <div className="detailed-feedback">
      <div className="feedback-header" style={{
        background: '#ffffff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '32px 24px'
      }}>
        <div className="feedback-score-section">
          <div style={{
            background: getFeedbackColor(feedback.evalLevel) + '15',
            borderRadius: '50%',
            padding: '16px',
            display: 'inline-block',
            boxShadow: '0 2px 8px ' + getFeedbackColor(feedback.evalLevel) + '30'
          }}>
            <Progress
              type="circle"
              percent={feedback.score}
              format={(percent) => (
                <span style={{ 
                  color: getFeedbackColor(feedback.evalLevel),
                  fontSize: '20px',
                  fontWeight: 600
                }}>
                  {`${percent}%`}
                </span>
              )}
              width={80}
              strokeColor={getFeedbackColor(feedback.evalLevel)}
              strokeWidth={8}
              className="score-circle"
            />
          </div>
          <Title level={3} className="feedback-level" style={{ 
            color: getFeedbackColor(feedback.evalLevel), 
            margin: '16px 0 8px',
            fontSize: '24px',
            fontWeight: 600
          }}>
            {getHebrewEvalLevel(feedback.evalLevel)}
          </Title>
          <Text className="feedback-message" style={{
            fontSize: '18px',
            color: '#1f2937',
            fontWeight: 500,
            lineHeight: 1.6,
            marginTop: '12px',
            maxWidth: '600px'
          }}>
            {feedback.message}
          </Text>
        </div>
      </div>
      <div className="feedback-content" style={{
        padding: '24px',
        background: '#f8fafc'
      }}>
        <Tabs
          defaultActiveKey="1"
          type="card"
          className="feedback-tabs"
          style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
          items={[
            {
              key: '1',
              label: (
                <span className="tab-label" style={{
                  fontSize: '16px',
                  fontWeight: 500
                }}>
                  <CheckCircleOutlined /> המשוב שלך
                </span>
              ),
              children: (
                <div className="feedback-section" style={{
                  padding: '24px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <MarkdownRenderer content={feedback.coreFeedback} />
                  {feedback.criteriaFeedback && question.evaluationGuidelines?.requiredCriteria && (
                    <RubricFeedback 
                      rubricScores={feedback.criteriaFeedback.reduce((acc, curr) => ({
                        ...acc,
                        [curr.criterionName]: {
                          score: curr.score,
                          feedback: curr.feedback
                        }
                      }), {})}
                      rubricAssessment={{
                        criteria: question.evaluationGuidelines.requiredCriteria
                      }}
                    />
                  )}
                </div>
              )
            },
            {
              key: 'detailed',
              label: (
                <span className="tab-label" style={{
                  fontSize: '16px',
                  fontWeight: 500
                }}>
                  <InfoCircleOutlined /> ניתוח מפורט
                </span>
              ),
              children: (
                <div className="feedback-section" style={{
                  padding: '24px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <MarkdownRenderer content={feedback.detailedFeedback} />
                </div>
              )
            },
            {
              key: 'solution',
              label: (
                <span className="tab-label" style={{
                  fontSize: '16px',
                  fontWeight: 500
                }}>
                  <CheckCircleOutlined /> פתרון מלא
                </span>
              ),
              children: (
                <div className="feedback-section" style={{
                  padding: '24px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <MarkdownRenderer content={question.schoolAnswer.solution.text} />
                </div>
              )
            }
          ]}
        />
      </div>
    </div>
  );
}; 