// Legacy implementation of question display
// Kept for reference as it might contain useful patterns or implementations
// The new implementation is in practice/PracticeQuestionDisplay.tsx

import React from 'react';
import { Card, Space, Button, Typography, Radio } from 'antd';
import { QuestionCircleOutlined, LinkOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import QuestionMetadata from './QuestionMetadata';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Question } from '../types/question';

const { Text } = Typography;

interface LegacyQuestionDisplayProps {
  question: Question;
  onNext?: () => void;
  onHelp?: (action: string) => void;
}

const LegacyQuestionDisplay: React.FC<LegacyQuestionDisplayProps> = ({
  question,
  onNext,
  onHelp
}) => {
  const navigate = useNavigate();

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      padding: '24px'
    }}>
      <Card style={{ borderRadius: '12px' }}>
        {/* Header with metadata and actions */}
        <div style={{ 
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <Space align="center">
            <Text strong style={{ fontSize: '1.1rem' }}>שאלה</Text>
            <Button 
              type="link"
              onClick={() => navigate(`/questions/${question.id}`)}
              style={{
                padding: '4px 8px',
                height: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                #{question.id}
              </Text>
              <LinkOutlined style={{ fontSize: '14px', color: '#2563eb' }} />
            </Button>
          </Space>

          <Space>
            {onHelp && (
              <Button 
                type="text"
                icon={<QuestionCircleOutlined />}
                onClick={() => onHelp('hint')}
              >
                עזרה
              </Button>
            )}
          </Space>
        </div>

        <QuestionMetadata metadata={{
          topic: {
            main: question.metadata.topicId,
            sub: question.metadata.subtopicId
          },
          type: question.type === 'multiple_choice' ? 'רב-ברירה' : 'פתוח',
          difficulty: question.metadata.difficulty.toString(),
          source: question.metadata.source
        }} />

        <div style={{ height: '1px', backgroundColor: '#e5e7eb' }} />

        {/* Question Content using MarkdownRenderer */}
        <div style={{ padding: '24px' }}>
          <div style={{
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            border: '1px solid #60a5fa',
            padding: '16px',
            direction: 'rtl',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            minHeight: '120px',
          }}>
            <MarkdownRenderer content={question.content.text} />
          </div>
        </div>

        {/* Multiple Choice Options */}
        {question.type === 'multiple_choice' && question.options && (
          <div style={{ padding: '0 24px 24px' }}>
            <Radio.Group style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {question.options.map((option, index) => (
                  <Radio 
                    key={index} 
                    value={index + 1} 
                    style={{
                      display: 'block',
                      padding: '12px',
                      marginRight: 0,
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      width: '100%'
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {option.text}
                    </div>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LegacyQuestionDisplay; 