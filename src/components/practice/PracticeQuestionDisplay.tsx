import React from 'react';
import { Card, Space, Button, Typography, Row, Col, Spin, Dropdown } from 'antd';
import { QuestionCircleOutlined, LinkOutlined, RightOutlined, BulbOutlined, BookOutlined, InfoCircleOutlined, ToolOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { MenuProps } from 'antd';
import QuestionContent from '../QuestionContent';
import QuestionMetadata from '../QuestionMetadata';
import type { Question } from '../../types/question';

const { Text } = Typography;

interface PracticeQuestionDisplayProps {
  question: Question;
  onAnswer: (answer: string, isCorrect: boolean) => Promise<void>;
  onHelp?: (action: string) => void;
  onNextQuestion?: (reason?: 'too_hard' | 'too_easy' | 'not_in_material') => void;
  isLoading?: boolean;
}

const formatQuestionId = (id: string): string => {
  // Convert long ID to format like "EZ-A1234"
  const shortId = id.slice(-5).padStart(5, '0').toUpperCase();
  return `EZ-${shortId}`;
};

const formatSource = (source: { 
  type: 'exam' | 'book' | 'ezpass';
  examType?: string; 
  year?: number; 
  season?: string; 
  moed?: string;
  bookName?: string;
  publisher?: string;
} | undefined): string | undefined => {
  if (!source) return undefined;
  
  switch (source.type) {
    case 'exam':
      const examParts = [
        source.examType,
        source.year,
        source.season,
        source.moed ? `מועד ${source.moed}` : undefined
      ].filter(Boolean);
      return `מבחן ${examParts.join(' ')}`;
    
    case 'book':
      const bookParts = [
        source.bookName,
        source.publisher
      ].filter(Boolean);
      return `ספר ${bookParts.join(' - ')}`;
    
    case 'ezpass':
      return 'איזיפס';
      
    default:
      return undefined;
  }
};

const getHebrewLetter = (index: number): string => {
  const letters = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'];
  return letters[index] || String(index + 1);
};

const PracticeQuestionDisplay: React.FC<PracticeQuestionDisplayProps> = ({
  question,
  onAnswer,
  onHelp,
  onNextQuestion,
  isLoading = false
}) => {
  const navigate = useNavigate();

  const handleSkip = (reason: 'too_hard' | 'too_easy' | 'not_in_material') => {
    if (onNextQuestion) {
      onNextQuestion(reason);
    }
  };

  const helpMenuItems: MenuProps['items'] = [
    {
      key: 'explanation',
      icon: <InfoCircleOutlined />,
      label: 'הסבר שאלה',
      onClick: () => onHelp?.('explanation')
    },
    {
      key: 'guidance',
      icon: <BulbOutlined />,
      label: 'הנחיה לפתרון',
      onClick: () => onHelp?.('guidance')
    },
    {
      key: 'stuck',
      icon: <QuestionCircleOutlined />,
      label: 'נתקעתי',
      onClick: () => onHelp?.('stuck')
    },
    {
      key: 'teach',
      icon: <BookOutlined />,
      label: 'למד אותי לפתור',
      onClick: () => onHelp?.('teach')
    }
  ];

  const skipMenuItems: MenuProps['items'] = [
    {
      key: 'too_hard',
      label: 'קשה מדי',
      onClick: () => handleSkip('too_hard')
    },
    {
      key: 'too_easy',
      label: 'קל מדי',
      onClick: () => handleSkip('too_easy')
    },
    {
      type: 'divider'
    },
    {
      key: 'not_in_material',
      label: 'לא בחומר',
      onClick: () => handleSkip('not_in_material')
    }
  ];

  if (isLoading) {
    return (
      <div style={{ 
        backgroundColor: '#f8fafc', 
        padding: '24px',
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card style={{ 
          borderRadius: '12px',
          width: '100%',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '120px 24px',
            gap: '32px'
          }}>
            <Spin size="large" style={{ 
              transform: 'scale(2.5)',
              opacity: '0.8'
            }} />
            <Text style={{ 
              fontSize: '1.75rem',
              color: '#475569',
              fontWeight: 500,
              marginTop: '16px'
            }}>
              טוען שאלה...
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', padding: '24px' }}>
      <Card style={{ borderRadius: '12px' }}>
        {/* Header with metadata and actions */}
        <div style={{ 
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <Space align="center" size={12}>
            <Text strong style={{ fontSize: '1.1rem' }}>שאלה</Text>
            <Text type="secondary" style={{ fontSize: '0.9rem' }}>
              {formatQuestionId(question.id)}
            </Text>
            <Button 
              type="link" 
              icon={<LinkOutlined />}
              onClick={() => navigate(`/questions/${question.id}`)}
              size="small"
              style={{ padding: 0 }}
            >
              צפה בפרטים
            </Button>
          </Space>

          <Space size={8}>
            <Dropdown 
              menu={{ items: helpMenuItems }} 
              placement="bottomRight"
              trigger={['click']}
            >
              <Button
                type="default"
                size="middle"
                icon={<QuestionCircleOutlined style={{ color: '#2563eb' }} />}
                style={{
                  borderColor: '#2563eb',
                  color: '#2563eb'
                }}
              >
                עזרה
              </Button>
            </Dropdown>
            <Dropdown 
              menu={{ items: skipMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button 
                type="default"
                size="middle"
              >
                דלג שאלה
              </Button>
            </Dropdown>
          </Space>
        </div>

        <QuestionMetadata metadata={{
          topic: {
            main: question.metadata.topicId,
            sub: question.metadata.subtopicId
          },
          type: question.type === 'multiple_choice' ? 'רב-ברירה' : 'פתוח',
          difficulty: question.metadata.difficulty.toString(),
          source: formatSource({
            type: 'ezpass',
            ...question.metadata.source
          })
        }} />

        <div style={{ height: '1px', backgroundColor: '#e5e7eb' }} />

        <QuestionContent 
          content={question.content.text} 
          isLoading={false}
        />

        {/* Answer section */}
        <div style={{ padding: '0 24px 24px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {question.type === 'multiple_choice' && question.options && (
              <Row gutter={[16, 16]}>
                {question.options.map((option, index) => (
                  <Col span={24} key={index}>
                    <Button
                      onClick={() => onAnswer?.(String(index + 1), index + 1 === question.correctOption)}
                      style={{
                        width: '100%',
                        textAlign: 'right',
                        whiteSpace: 'normal',
                        height: 'auto',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#ffffff',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                      className="answer-option-button"
                    >
                      {/* Option Number */}
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px',
                        color: '#1f2937',
                        flexShrink: 0,
                        fontWeight: 500,
                        border: '1px solid #e2e8f0'
                      }}>
                        {getHebrewLetter(index)}
                      </div>
                      
                      {/* Option Content */}
                      <div style={{ 
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRight: '1px solid #e5e7eb',
                        paddingRight: '16px'
                      }}>
                        <Text style={{ 
                          fontSize: '15px',
                          color: '#1f2937'
                        }}>
                          {option.text}
                        </Text>
                        
                        {/* If the option is a number (like meters), add a visual indicator */}
                        {!isNaN(parseFloat(option.text)) && (
                          <div style={{
                            backgroundColor: '#f3f4f6',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: '#4b5563'
                          }}>
                            מטר
                          </div>
                        )}
                      </div>
                    </Button>
                  </Col>
                ))}
              </Row>
            )}
          </Space>
        </div>

      </Card>

      {/* Add CSS for hover effects */}
      <style>
        {`
          .answer-option-button:hover {
            background-color: #f8fafc !important;
            border-color: #bfdbfe !important;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          
          .answer-option-button:active {
            transform: translateY(0);
            background-color: #eff6ff !important;
            border-color: #60a5fa !important;
          }
        `}
      </style>
    </div>
  );
};

export default PracticeQuestionDisplay; 