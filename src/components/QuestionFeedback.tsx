import React, { useState } from 'react';
import { Alert, Typography, Space, Button, Collapse, Divider, Tabs, Card, Tooltip } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  BookOutlined,
  BulbOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  StarOutlined,
  RocketOutlined
} from '@ant-design/icons';
import type { QuestionFeedback as QuestionFeedbackType } from '../types/question';
import ReactMarkdown from 'react-markdown';

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

interface QuestionFeedbackProps {
  feedback: QuestionFeedbackType;
  onRetry?: () => void;
}

const QuestionFeedback: React.FC<QuestionFeedbackProps> = ({ feedback, onRetry }) => {
  const [activeTab, setActiveTab] = useState('1');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div 
      className="feedback-container"
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        opacity: 0,
        animation: 'fadeIn 0.3s ease-out forwards'
      }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .feedback-container > * {
            animation: slideIn 0.3s ease-out forwards;
          }
          
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      {/* Initial Feedback Section */}
      <div style={{ textAlign: 'center' }}>
        {feedback.isCorrect ? (
          <CheckCircleOutlined style={{ 
            fontSize: '64px', 
            color: '#22c55e',
            marginBottom: '16px'
          }} />
        ) : (
          <CloseCircleOutlined style={{ 
            fontSize: '64px', 
            color: '#ef4444',
            marginBottom: '16px'
          }} />
        )}
        <Title level={2} style={{ 
          margin: 0,
          color: feedback.isCorrect ? '#15803d' : '#b91c1c'
        }}>
          {feedback.isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה'}
        </Title>
      </div>

      {/* Score and Quick Assessment */}
      <div>
        <Alert
          message={
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              justifyContent: 'space-between'
            }}>
              <Space align="center">
                <StarOutlined style={{ fontSize: '24px' }} />
                <Text style={{ 
                  fontSize: '1.2em',
                  color: feedback.isCorrect ? '#15803d' : '#b91c1c'
                }}>
                  {feedback.assessment}
                </Text>
              </Space>
              {feedback.type !== 'multiple_choice' && (
                <div
                  style={{
                    transform: 'scale(0)',
                    transformOrigin: 'center',
                    transition: 'transform 0.3s ease-out',
                    marginLeft: '8px'
                  }}
                >
                  <Text strong style={{ 
                    fontSize: '1.4em',
                    color: feedback.isCorrect ? '#15803d' : '#b91c1c'
                  }}>
                    {feedback.score}/100
                  </Text>
                </div>
              )}
            </div>
          }
          type={feedback.isCorrect ? 'success' : 'error'}
          showIcon
          style={{ 
            width: '100%',
            backgroundColor: feedback.isCorrect ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${feedback.isCorrect ? '#86efac' : '#fca5a5'}`,
            padding: '16px 24px'
          }}
        />
      </div>

      {/* Main Content Tabs */}
      <div>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          style={{ 
            backgroundColor: '#ffffff',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          {/* Quick Feedback Tab */}
          <TabPane 
            tab={
              <span>
                <RocketOutlined />
                משוב מהיר
              </span>
            } 
            key="1"
          >
            <Card bordered={false}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Title level={4}>נקודות מפתח</Title>
                  <ReactMarkdown>{feedback.explanation}</ReactMarkdown>
                  <Tooltip title={copiedText === feedback.explanation ? 'הועתק!' : 'העתק למחברת'}>
                    <Button 
                      type="text" 
                      icon={<CopyOutlined />}
                      onClick={() => handleCopy(feedback.explanation)}
                      style={{ marginTop: '8px' }}
                    />
                  </Tooltip>
                </div>
                
                {!feedback.isCorrect && feedback.improvementSuggestions && (
                  <div>
                    <Title level={4}>המלצות לשיפור</Title>
                    <ReactMarkdown>{feedback.improvementSuggestions}</ReactMarkdown>
                    {onRetry && (
                      <Button 
                        type="primary"
                        icon={<ArrowUpOutlined />}
                        onClick={onRetry}
                        style={{ marginTop: '16px' }}
                      >
                        נסה שוב
                      </Button>
                    )}
                  </div>
                )}
              </Space>
            </Card>
          </TabPane>

          {/* Detailed Explanation Tab */}
          <TabPane 
            tab={
              <span>
                <BulbOutlined />
                הסבר מפורט
              </span>
            } 
            key="2"
          >
            <Card bordered={false}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {feedback.type === 'multiple_choice' ? (
                  <>
                    <div>
                      <Title level={4}>התשובה הנכונה</Title>
                      <Paragraph strong>{feedback.correctOption}</Paragraph>
                      <ReactMarkdown>{feedback.explanation}</ReactMarkdown>
                    </div>
                    {feedback.incorrectExplanations && (
                      <div>
                        <Title level={4}>למה התשובות האחרות אינן נכונות</Title>
                        <ReactMarkdown>{feedback.incorrectExplanations}</ReactMarkdown>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <Title level={4}>ניתוח מפורט</Title>
                    <ReactMarkdown>{feedback.explanation}</ReactMarkdown>
                  </div>
                )}
              </Space>
            </Card>
          </TabPane>

          {/* Full Solution Tab */}
          <TabPane 
            tab={
              <span>
                <BookOutlined />
                פתרון מלא
              </span>
            } 
            key="3"
          >
            <Card bordered={false}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Title level={4}>פתרון צעד אחר צעד</Title>
                  {feedback.solution && <ReactMarkdown>{feedback.solution}</ReactMarkdown>}
                </div>
                
                {feedback.alternativeSolutions && (
                  <div>
                    <Title level={4}>דרכי פתרון נוספות</Title>
                    <ReactMarkdown>{feedback.alternativeSolutions}</ReactMarkdown>
                  </div>
                )}
              </Space>
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default QuestionFeedback; 