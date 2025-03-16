import React, { useState } from 'react';
import { Typography, Progress, Alert, Divider } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined, MessageOutlined, CheckOutlined, CloseOutlined, WarningOutlined, BulbOutlined, StarOutlined } from '@ant-design/icons';
import { DetailedQuestionFeedback } from '../../types/feedback/types';
import { Question } from '../../types/question';
import { getFeedbackColor, getFeedbackTitle, getHebrewEvalLevel } from '../../utils/feedbackStyles';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { RubricFeedback } from './RubricFeedback';
import styled from 'styled-components';
import './Feedback.css';

const { Text, Title, Paragraph } = Typography;

// Styled components for enhanced feedback display
const FeedbackContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-top: 24px;
`;

const FeedbackHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 24px;
  background: linear-gradient(to right, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e2e8f0;
`;

const ScoreCircle = styled.div`
  margin-left: 20px;
  position: relative;
  
  .ant-progress-text {
    font-weight: 700 !important;
    font-size: 18px !important;
  }
`;

const FeedbackTextSection = styled.div`
  flex: 1;
`;

const FeedbackLevel = styled(Title)`
  margin-bottom: 8px !important;
  font-size: 24px !important;
`;

const FeedbackMessage = styled(Paragraph)`
  margin-bottom: 0 !important;
  font-size: 16px !important;
  max-width: 600px;
`;

const TabList = styled.div`
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 16px 24px;
  background: ${props => props.$active ? '#ffffff' : 'transparent'};
  border: none;
  border-bottom: 3px solid ${props => props.$active ? '#3b82f6' : 'transparent'};
  color: ${props => props.$active ? '#1e40af' : '#64748b'};
  font-weight: ${props => props.$active ? '600' : '500'};
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.$active ? '#ffffff' : '#f1f5f9'};
    color: ${props => props.$active ? '#1e40af' : '#334155'};
  }
  
  svg {
    font-size: 18px;
  }
`;

const TabPanel = styled.div`
  padding: 24px;
  background: #ffffff;
`;

const SectionTitle = styled(Title)`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px !important;
  margin-bottom: 16px !important;
  color: #334155;
  
  svg {
    color: #3b82f6;
  }
`;

const CriteriaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const CriterionCard = styled.div<{ $score: number }>`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
    transform: translateY(-2px);
  }
  
  border-top: 4px solid ${props => 
    props.$score >= 80 ? '#10b981' : 
    props.$score >= 60 ? '#f59e0b' : 
    '#ef4444'};
`;

const CriterionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const CriterionName = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: #334155;
`;

const CriterionScore = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CriterionWeight = styled(Text)`
  color: #64748b;
  font-size: 14px;
`;

const CriterionFeedback = styled(Paragraph)`
  color: #475569;
  font-size: 14px;
  margin-bottom: 0 !important;
`;

const SolutionSection = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  margin-top: 16px;
  border: 1px solid #e2e8f0;
`;

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

export const DetailedFeedback: React.FC<DetailedFeedbackProps> = ({ feedback, question, error }) => {
  const [activeTab, setActiveTab] = useState<string>('tab1');

  if (error?.code === 'insufficient_quota') {
    return (
      <FeedbackContainer>
        <Alert
          message="שגיאת מערכת"
          description="מצטערים, אך חרגנו ממכסת השימוש במערכת. אנא נסה שוב מאוחר יותר או פנה לתמיכה."
          type="error"
          showIcon
          className="feedback-error"
        />
      </FeedbackContainer>
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
      <div>
        <SectionTitle level={4}>
          <StarOutlined /> ניקוד לפי קריטריונים
        </SectionTitle>
        <CriteriaGrid>
          {feedback.criteriaFeedback.map((criterion, index) => (
            <CriterionCard key={index} $score={criterion.score}>
              <CriterionHeader>
                <CriterionName>
                  {getScoreIcon(criterion.score)}
                  {translateCriterion(criterion.criterionName)}
                </CriterionName>
                <CriterionScore>
                  <Progress 
                    type="circle" 
                    percent={criterion.score} 
                    width={40}
                    format={(percent) => `${percent}%`}
                    strokeColor={
                      criterion.score >= 80 ? '#10b981' : 
                      criterion.score >= 60 ? '#f59e0b' : 
                      '#ef4444'
                    }
                  />
                  <CriterionWeight>({criterion.weight}%)</CriterionWeight>
                </CriterionScore>
              </CriterionHeader>
              <CriterionFeedback>
                {criterion.feedback}
              </CriterionFeedback>
            </CriterionCard>
          ))}
        </CriteriaGrid>
      </div>
    );
  };

  return (
    <FeedbackContainer>
      {/* Score Header */}
      <FeedbackHeader>
        <ScoreCircle>
          <Progress
            type="circle"
            percent={feedback.score}
            format={(percent) => `${percent}%`}
            width={80}
            strokeColor={getFeedbackColor(feedback.evalLevel)}
            strokeWidth={8}
          />
        </ScoreCircle>
        <FeedbackTextSection>
          <FeedbackLevel level={3} style={{ color: getFeedbackColor(feedback.evalLevel) }}>
            {getHebrewEvalLevel(feedback.evalLevel)}
          </FeedbackLevel>
          <FeedbackMessage>
            {feedback.message}
          </FeedbackMessage>
        </FeedbackTextSection>
      </FeedbackHeader>

      {/* Tabs Section */}
      <TabList role="tablist">
        <TabButton
          role="tab"
          $active={activeTab === 'tab1'}
          onClick={() => setActiveTab('tab1')}
        >
          <MessageOutlined /> המשוב שלך
        </TabButton>
        <TabButton
          role="tab"
          $active={activeTab === 'tab2'}
          onClick={() => setActiveTab('tab2')}
        >
          <InfoCircleOutlined /> פירוט מלא
        </TabButton>
        <TabButton
          role="tab"
          $active={activeTab === 'tab3'}
          onClick={() => setActiveTab('tab3')}
        >
          <CheckCircleOutlined /> פתרון
        </TabButton>
      </TabList>
      <TabPanel role="tabpanel">
        {/* Core Feedback and Criteria Tab */}
        {activeTab === 'tab1' && (
          <div>
            <SectionTitle level={4}>
              <BulbOutlined /> נקודות מפתח
            </SectionTitle>
            <div className="core-feedback">
              <MarkdownRenderer content={feedback.coreFeedback || 'אין נקודות מפתח זמינות'} />
            </div>
            
            <Divider />
            
            {renderCriteriaFeedback()}
          </div>
        )}

        {/* Detailed Feedback Tab */}
        {activeTab === 'tab2' && (
          <div>
            {feedback.detailedFeedback ? (
              <MarkdownRenderer content={feedback.detailedFeedback} />
            ) : (
              <Text className="no-feedback-text">
                אין ניתוח מפורט זמין
              </Text>
            )}
          </div>
        )}

        {/* Solution Tab */}
        {activeTab === 'tab3' && (
          <div>
            <SectionTitle level={4}>
              <CheckCircleOutlined /> פתרון מומלץ
            </SectionTitle>
            <SolutionSection>
              {question.schoolAnswer?.solution ? (
                <MarkdownRenderer content={question.schoolAnswer.solution.text} />
              ) : (
                <Text className="no-solution-text">
                  אין פתרון זמין לשאלה זו
                </Text>
              )}
            </SolutionSection>
          </div>
        )}
      </TabPanel>
    </FeedbackContainer>
  );
}; 