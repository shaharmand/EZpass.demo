import React, { useState } from 'react';
import { Typography, Progress, Alert } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined, MessageOutlined, CheckOutlined, CloseOutlined, WarningOutlined } from '@ant-design/icons';
import { DetailedQuestionFeedback } from '../../types/feedback/types';
import { Question } from '../../types/question';
import { getFeedbackColor, getFeedbackTitle, getHebrewEvalLevel } from '../../utils/feedbackStyles';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { RubricFeedback } from './RubricFeedback';
import './Feedback.css';

const { Text, Title } = Typography;

// Translation mapping for common criterion names
const translateCriterion = (name: string): string => {
  const translations: { [key: string]: string } = {
    'Understanding': 'הבנה',
    'Approach': 'גישה',
    'Implementation': 'יישום',
    'Correctness': 'נכונות',
    'Explanation': 'הסבר',
    'Clarity': 'בהירות',
    'Logic': 'לוגיקה',
    'Mathematical Accuracy': 'דיוק מתמטי',
    'Problem Solving': 'פתרון בעיות',
    'Methodology': 'מתודולוגיה',
    'Analysis': 'ניתוח',
    'Reasoning': 'חשיבה',
    'Structure': 'מבנה',
    'Organization': 'ארגון',
    'Presentation': 'הצגה',
    'Completeness': 'שלמות',
    'Accuracy': 'דיוק',
    'Solution Quality': 'איכות הפתרון',
    'Steps': 'שלבים',
    'Final Answer': 'תשובה סופית'
  };
  
  return translations[name] || name; // Return original name if no translation exists
};

interface DetailedFeedbackProps {
  feedback: DetailedQuestionFeedback;
  question: Question;
  error?: {
    code: string;
    message: string;
  };
}

const getScoreIcon = (score: number) => {
  if (score >= 80) return <CheckOutlined style={{ color: '#059669' }} />;
  if (score >= 60) return <WarningOutlined style={{ color: '#d97706' }} />;
  return <CloseOutlined style={{ color: '#dc2626' }} />;
};

const getScoreClass = (score: number) => {
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-medium';
  return 'score-low';
};

export const DetailedFeedback: React.FC<DetailedFeedbackProps> = ({ feedback, question, error }) => {
  const [activeTab, setActiveTab] = useState<string>('tab1');

  if (error?.code === 'insufficient_quota') {
    return (
      <div className="detailed-feedback">
        <Alert
          message="שגיאת מערכת"
          description="מצטערים, אך חרגנו ממכסת השימוש במערכת. אנא נסה שוב מאוחר יותר או פנה לתמיכה."
          type="error"
          showIcon
          className="feedback-error"
        />
      </div>
    );
  }

  // Convert criteriaFeedback array to rubricScores object format
  const rubricScores = feedback.criteriaFeedback.reduce((acc, criterion) => {
    acc[criterion.criterionName] = {
      score: criterion.score,
      feedback: criterion.feedback
    };
    return acc;
  }, {} as { [key: string]: { score: number; feedback: string } });

  // Create rubricAssessment object from criteriaFeedback
  const rubricAssessment = {
    criteria: feedback.criteriaFeedback.map(criterion => ({
      name: criterion.criterionName,
      description: '',  // We don't have descriptions in the current data
      weight: criterion.weight
    }))
  };

  const renderCriteriaFeedback = () => {
    if (!feedback.criteriaFeedback?.length) return null;
    
    return (
      <div className="feedback-section">
        <Title level={4} className="section-title">
          <InfoCircleOutlined /> ניקוד לפי קריטריונים
        </Title>
        <div className="criteria-feedback">
          {feedback.criteriaFeedback.map((criterion, index) => (
            <div key={index} className="criterion-item">
              <div className="criterion-header">
                <div className="criterion-name">
                  {getScoreIcon(criterion.score)}
                  {translateCriterion(criterion.criterionName)}
                </div>
                <div className={`criterion-score ${getScoreClass(criterion.score)}`}>
                  <Progress 
                    type="circle" 
                    percent={criterion.score} 
                    width={40}
                    format={(percent) => `${percent}%`}
                  />
                  <Text className="criterion-weight">({criterion.weight}%)</Text>
                </div>
              </div>
              <div className="criterion-feedback-text">
                <Text>{criterion.feedback}</Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="detailed-feedback">
      {/* Score Header */}
      <div className="feedback-header">
        <div className="feedback-score-section">
          <div className="score-circle-wrapper">
            <Progress
              type="circle"
              percent={feedback.score}
              format={(percent) => (
                <span className="score-text" style={{ color: getFeedbackColor(feedback.evalLevel) }}>
                  {`${percent}%`}
                </span>
              )}
              width={80}
              strokeColor={getFeedbackColor(feedback.evalLevel)}
              strokeWidth={8}
            />
          </div>
          <div className="feedback-text-section">
            <Title level={3} className="feedback-level" style={{ color: getFeedbackColor(feedback.evalLevel) }}>
              {getHebrewEvalLevel(feedback.evalLevel)}
            </Title>
            <Text className="feedback-message">
              {feedback.message}
            </Text>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="custom-tabs">
        <div className="tab-list" role="tablist">
          <button
            role="tab"
            className={`tab-button ${activeTab === 'tab1' ? 'active' : ''}`}
            onClick={() => setActiveTab('tab1')}
          >
            <MessageOutlined /> המשוב שלך
          </button>
          <button
            role="tab"
            className={`tab-button ${activeTab === 'tab2' ? 'active' : ''}`}
            onClick={() => setActiveTab('tab2')}
          >
            <InfoCircleOutlined /> פירוט מלא
          </button>
          <button
            role="tab"
            className={`tab-button ${activeTab === 'tab3' ? 'active' : ''}`}
            onClick={() => setActiveTab('tab3')}
          >
            <CheckCircleOutlined /> פתרון
          </button>
        </div>
        <div className="tab-panel" role="tabpanel">
          {/* Core Feedback and Criteria Tab */}
          {activeTab === 'tab1' && (
            <div className="tab-content">
              <div className="feedback-section">
                <Title level={4} className="section-title">
                  <MessageOutlined /> נקודות מפתח
                </Title>
                <div className="core-feedback">
                  <MarkdownRenderer content={feedback.coreFeedback || 'אין נקודות מפתח זמינות'} />
                </div>
              </div>
              {renderCriteriaFeedback()}
            </div>
          )}

          {/* Detailed Feedback Tab */}
          {activeTab === 'tab2' && (
            <div className="tab-content">
              <div className="detailed-feedback-content">
                {feedback.detailedFeedback ? (
                  <MarkdownRenderer content={feedback.detailedFeedback} />
                ) : (
                  <Text className="no-feedback-text">
                    אין ניתוח מפורט זמין
                  </Text>
                )}
              </div>
            </div>
          )}

          {/* Solution Tab */}
          {activeTab === 'tab3' && (
            <div className="tab-content">
              <div className="solution-content">
                {question.schoolAnswer?.solution ? (
                  <MarkdownRenderer content={question.schoolAnswer.solution.text} />
                ) : (
                  <Text className="no-solution-text">
                    אין פתרון זמין לשאלה זו
                  </Text>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 