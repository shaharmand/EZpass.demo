import React from 'react';
import { Card, Space, Button, Typography } from 'antd';
import { QuestionCircleOutlined, LinkOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import QuestionContent from '../QuestionContent';
import QuestionMetadata from '../QuestionMetadata';
import type { Question } from '../../types/question';

const { Text } = Typography;

interface PracticeQuestionDisplayProps {
  question: Question;
  onAnswer: (answer: string, isCorrect: boolean) => Promise<void>;
  onHelp?: (action: string) => void;
}

const PracticeQuestionDisplay: React.FC<PracticeQuestionDisplayProps> = ({
  question,
  onAnswer,
  onHelp
}) => {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: '#f8fafc', padding: '24px' }}>
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
            <Text type="secondary">{question.id}</Text>
            <Button 
              type="text" 
              icon={<LinkOutlined />}
              onClick={() => navigate(`/questions/${question.id}`)}
              size="small"
            />
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

        <QuestionContent 
          content={question.content.text} 
          isLoading={false}
        />

        {/* Answer section */}
        <div style={{ padding: '16px 24px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {question.type === 'multiple_choice' && question.options && (
              <div>
                {question.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => onAnswer?.(String(index + 1), index + 1 === question.correctOption)}
                    style={{
                      width: '100%',
                      textAlign: 'right',
                      marginBottom: '8px',
                      whiteSpace: 'normal',
                      height: 'auto',
                      padding: '12px'
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {option.text}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default PracticeQuestionDisplay; 