import React, { useState } from 'react';
import { Card, Space, Button, Typography, Tooltip, Progress, Collapse } from 'antd';
import { CopyOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, RedoOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import type { QuestionFeedback, BasicQuestionFeedback, DetailedQuestionFeedback } from '../types/feedback/types';
import { isSuccessfulAnswer } from '../types/feedback/status';
import { BinaryEvalLevel, DetailedEvalLevel } from '../types/feedback/levels';
import { getFeedbackColor } from '../utils/feedbackStyles';
import { motion } from 'framer-motion';
import { getFeedbackStatus } from '../types/feedback/status';
import { Question } from '../types/question';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface QuestionFeedbackViewProps {
  feedback: QuestionFeedback;
  onRetry?: () => void;
}

const isDetailedFeedback = (feedback: QuestionFeedback): feedback is DetailedQuestionFeedback => {
  return 'coreFeedback' in feedback;
};

const isBasicFeedback = (feedback: QuestionFeedback): feedback is BasicQuestionFeedback => {
  return 'basicExplanation' in feedback;
};

const QuestionFeedbackView: React.FC<QuestionFeedbackViewProps> = ({ feedback, onRetry }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(feedback.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const feedbackText = isDetailedFeedback(feedback) ? feedback.coreFeedback : 
                      isBasicFeedback(feedback) ? feedback.basicExplanation : 
                      feedback.message;

  const hasDetailedFeedback = isDetailedFeedback(feedback) && feedback.detailedFeedback;

  return (
    <Card className="feedback-card">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div className="feedback-header">
          <Space>
            <Progress
              type="circle"
              percent={feedback.score || 0}
              format={(percent) => `${percent}%`}
              strokeColor={getFeedbackColor(getFeedbackStatus(feedback.evalLevel))}
              width={120}
            />
            <div className="feedback-title">
              <Title level={4}>{getFeedbackStatus(feedback.evalLevel)}</Title>
              <Text>{feedback.message}</Text>
            </div>
          </Space>
          <Button
            type="text"
            icon={copied ? <CheckCircleOutlined /> : <CopyOutlined />}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="feedback-details"
        >
          <Collapse defaultActiveKey={['core']} className="feedback-collapse">
            {/* Core/Basic Feedback */}
            <Panel 
              header={
                <div className="panel-header">
                  <InfoCircleOutlined />
                  <Text strong>נקודות מפתח</Text>
                </div>
              } 
              key="core"
              className="feedback-panel"
            >
              <div className="feedback-content">
                <div className="feedback-score">
                  <Progress
                    type="circle"
                    percent={feedback.score || 0}
                    format={(percent) => `${percent}%`}
                    strokeColor={getFeedbackColor(getFeedbackStatus(feedback.evalLevel))}
                    width={120}
                  />
                </div>
                <div className="feedback-message">
                  <Text strong>{feedback.message}</Text>
                </div>
                {isBasicFeedback(feedback) && (
                  <div className="feedback-explanation">
                    <ReactMarkdown>{feedback.basicExplanation}</ReactMarkdown>
                  </div>
                )}
                {isDetailedFeedback(feedback) && (
                  <div className="feedback-explanation">
                    <ReactMarkdown>{feedback.coreFeedback}</ReactMarkdown>
                  </div>
                )}
              </div>
            </Panel>

            {/* Detailed Feedback */}
            {hasDetailedFeedback && (
              <Panel
                header={
                  <div className="panel-header">
                    <InfoCircleOutlined />
                    <Text strong>פרטים נוספים</Text>
                  </div>
                }
                key="detailed"
                className="feedback-panel"
              >
                <div className="feedback-content">
                  <ReactMarkdown>{feedback.detailedFeedback}</ReactMarkdown>
                </div>
              </Panel>
            )}

            {/* Rubric Scores */}
            {isDetailedFeedback(feedback) && feedback.criteriaFeedback && (
              <Panel
                header={
                  <div className="panel-header">
                    <InfoCircleOutlined />
                    <Text strong>הערכה לפי קריטריונים</Text>
                  </div>
                }
                key="rubric"
                className="feedback-panel"
              >
                <div className="feedback-content">
                  {feedback.criteriaFeedback.map((criterion, index) => (
                    <div key={index} className="rubric-item">
                      <Text strong>{criterion.criterionName}:</Text>
                      <Text>{criterion.feedback}</Text>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </Collapse>
        </motion.div>

        {onRetry && (
          <Button
            type="primary"
            icon={<RedoOutlined />}
            onClick={onRetry}
            style={{ marginTop: '16px' }}
          >
            Try Again
          </Button>
        )}
      </Space>
    </Card>
  );
};

export default QuestionFeedbackView;