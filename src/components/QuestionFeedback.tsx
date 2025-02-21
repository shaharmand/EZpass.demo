import React, { useState } from 'react';
import { Card, Space, Button, Typography, Tooltip, Progress, Collapse } from 'antd';
import { CopyOutlined, CheckCircleOutlined, CloseCircleOutlined, ArrowUpOutlined, InfoCircleOutlined, RedoOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import type { QuestionFeedback } from '../types/question';
import { motion } from 'framer-motion';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface QuestionFeedbackViewProps {
  feedback: QuestionFeedback;
  onRetry?: () => void;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return '#10b981';
  if (score >= 80) return '#3b82f6';
  if (score >= 70) return '#f59e0b';
  return '#ef4444';
};

const QuestionFeedbackView: React.FC<QuestionFeedbackViewProps> = ({ feedback, onRetry }) => {
  const [copiedText, setCopiedText] = useState<string>('');

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="feedback-container"
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Score and Initial Feedback */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="feedback-header"
        >
          <Card bordered={false} className="score-card">
            <div className="score-container">
              {/* Score Circle */}
              <div className="score-circle">
                <Progress
                  type="circle"
                  percent={feedback.score}
                  format={(percent) => `${percent}%`}
                  strokeColor={getScoreColor(feedback.score)}
                  width={120}
                />
              </div>

              {/* Status and Assessment */}
              <div className="assessment-container">
                <div className="status-indicator">
                  {feedback.isCorrect ? (
                    <CheckCircleOutlined className="success-icon" />
                  ) : (
                    <CloseCircleOutlined className="error-icon" />
                  )}
                  <Title level={3} className={`status-text ${feedback.isCorrect ? 'success' : 'error'}`}>
                    {feedback.isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה'}
                  </Title>
                </div>
                <Paragraph className="assessment-text">
                  {feedback.assessment}
                </Paragraph>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Detailed Feedback Sections */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="feedback-details"
        >
          <Collapse defaultActiveKey={['core']} className="feedback-collapse">
            {/* Core Feedback */}
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
                <ReactMarkdown>{feedback.coreFeedback}</ReactMarkdown>
                <Tooltip title={copiedText === feedback.coreFeedback ? 'הועתק! ✓' : 'העתק למחברת'}>
                  <Button 
                    type="text" 
                    icon={<CopyOutlined />}
                    onClick={() => feedback.coreFeedback && handleCopy(feedback.coreFeedback)}
                    className="copy-button"
                  />
                </Tooltip>
              </div>
            </Panel>

            {/* Detailed Analysis */}
            {feedback.detailedFeedback && (
              <Panel 
                header={
                  <div className="panel-header">
                    <InfoCircleOutlined />
                    <Text strong>ניתוח מפורט</Text>
                  </div>
                } 
                key="detailed"
                className="feedback-panel"
              >
                <div className="feedback-content">
                  <ReactMarkdown>{feedback.detailedFeedback}</ReactMarkdown>
                  <Tooltip title={copiedText === feedback.detailedFeedback ? 'הועתק! ✓' : 'העתק למחברת'}>
                    <Button 
                      type="text" 
                      icon={<CopyOutlined />}
                      onClick={() => feedback.detailedFeedback && handleCopy(feedback.detailedFeedback)}
                      className="copy-button"
                    />
                  </Tooltip>
                </div>
              </Panel>
            )}
          </Collapse>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="feedback-actions"
        >
          <Space size="large" className="action-buttons">
            <Button 
              size="large"
              icon={<CopyOutlined />}
              onClick={() => feedback.coreFeedback && handleCopy(feedback.coreFeedback)}
              className="copy-feedback-button"
            >
              {copiedText === feedback.coreFeedback ? 'הועתק! ✓' : 'העתק משוב'}
            </Button>

            {onRetry && (
              <Button 
                type="primary"
                size="large"
                icon={<RedoOutlined />}
                onClick={onRetry}
                className="retry-button"
              >
                נסה שוב
              </Button>
            )}
          </Space>
        </motion.div>
      </Space>

      <style>
        {`
          .feedback-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
          }

          .feedback-header {
            width: 100%;
          }

          .score-card {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }

          .score-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 32px;
            padding: 24px 0;
          }

          .score-circle {
            text-align: center;
          }

          .assessment-container {
            text-align: right;
            flex: 1;
          }

          .status-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          }

          .success-icon {
            font-size: 32px;
            color: #22c55e;
          }

          .error-icon {
            font-size: 32px;
            color: #ef4444;
          }

          .status-text {
            margin: 0;
          }

          .status-text.success {
            color: #15803d;
          }

          .status-text.error {
            color: #b91c1c;
          }

          .assessment-text {
            font-size: 16px;
            margin: 0;
            color: #4b5563;
          }

          .feedback-details {
            width: 100%;
          }

          .feedback-collapse {
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
          }

          .feedback-panel {
            border: none;
            margin-bottom: 1px;
          }

          .panel-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
          }

          .feedback-content {
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
            position: relative;
          }

          .copy-button {
            position: absolute;
            top: 8px;
            right: 8px;
            opacity: 0.6;
            transition: opacity 0.2s ease;
          }

          .copy-button:hover {
            opacity: 1;
          }

          .feedback-actions {
            margin-top: 24px;
          }

          .action-buttons {
            display: flex;
            justify-content: flex-end;
            width: 100%;
          }

          .copy-feedback-button {
            height: 44px;
            padding: 0 24px;
            border-radius: 8px;
            background: #f1f5f9;
            border-color: #e2e8f0;
            color: #64748b;
            transition: all 0.2s ease;
          }

          .copy-feedback-button:hover {
            background: #e2e8f0;
            border-color: #cbd5e1;
            color: #475569;
            transform: translateY(-1px);
          }

          .retry-button {
            height: 44px;
            padding: 0 32px;
            border-radius: 8px;
            background: #3b82f6;
            border-color: #2563eb;
            transition: all 0.2s ease;
          }

          .retry-button:hover {
            background: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
        `}
      </style>
    </motion.div>
  );
};

export default QuestionFeedbackView;