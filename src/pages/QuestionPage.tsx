import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Space, Button, Dropdown, Menu, Typography, Tag, Alert, Divider, Spin } from 'antd';
import { 
  EditOutlined, 
  ShareAltOutlined, 
  StarOutlined, 
  BookOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  MoreOutlined,
  PrinterOutlined,
  ExportOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import QuestionViewer from '../components/QuestionViewer';
import QuestionContent from '../components/QuestionContent';
import QuestionMetadata from '../components/QuestionMetadata';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import type { Question } from '../types/question';
import { questionService } from '../services/llm/questionGenerationService';

const { Title, Text } = Typography;

interface QuestionPageProps {
  // Add props if needed
}

const QuestionPage: React.FC<QuestionPageProps> = () => {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!questionId) return;
      
      try {
        setLoading(true);
        setError(null);
        setQuestion(null); // Reset question while loading
        
        // Use the question service to get the question
        const fetchedQuestion = await questionService.getQuestion(questionId);
        setQuestion(fetchedQuestion);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load question';
        setError(errorMessage);
        console.error('Error fetching question:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId]);

  const actionMenuItems = [
    {
      key: 'practice',
      label: 'התחל תרגול',
      icon: <PlayCircleOutlined />,
      onClick: () => navigate(`/practice/${questionId}`)
    },
    {
      key: 'edit',
      label: 'ערוך שאלה',
      icon: <EditOutlined />,
      onClick: () => navigate(`/questions/${questionId}/edit`)
    },
    {
      key: 'add-to-set',
      label: 'הוסף לסט שאלות',
      icon: <PlusOutlined />,
      onClick: () => {/* TODO */}
    },
    {
      key: 'add-to-exam',
      label: 'הוסף למבחן',
      icon: <BookOutlined />,
      onClick: () => {/* TODO */}
    },
    {
      key: 'share',
      label: 'שתף',
      icon: <ShareAltOutlined />,
      onClick: () => {/* TODO */}
    },
    {
      key: 'print',
      label: 'הדפס',
      icon: <PrinterOutlined />,
      onClick: () => {/* TODO */}
    },
    {
      key: 'export',
      label: 'ייצא',
      icon: <ExportOutlined />,
      onClick: () => {/* TODO */}
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <Card>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            minHeight: '300px'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <Spin size="large" />
            </div>
            <Text style={{ color: '#6b7280', fontSize: '1.1rem' }}>
              טוען שאלה...
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div style={{ padding: '2rem' }}>
        <Alert
          message="Error"
          description={error || 'Question not found'}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Description Section */}
      <Card style={{ marginBottom: '2rem' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Title level={5} style={{ margin: 0 }}>דף שאלה</Title>
          <Text>דף זה מציג את כל המידע הרלוונטי לשאלה ספציפית, כולל:</Text>
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0, color: '#666' }}>
            <li>• תוכן השאלה ופתרון מלא</li>
            <li>• מטא-דאטה (נושא, תת-נושא, רמת קושי)</li>
            <li>• מחוון הערכה ודרישות תשובה</li>
            <li>• סטטיסטיקות ביצועים</li>
            <li>• שאלות דומות ומקושרות</li>
          </ul>
        </Space>
      </Card>

      {/* Question Section */}
      <Card 
        className="question-section"
        style={{ marginBottom: '1rem' }}
        title={
          <Space>
            <span>שאלה</span>
            <Tag color="blue">{question.type === 'multiple_choice' ? 'רב-ברירה' : 'פתוח'}</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button 
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => navigate(`/practice/${questionId}`)}
            >
              התחל תרגול
            </Button>
            <Dropdown 
              menu={{ 
                items: actionMenuItems,
                onClick: ({ key }) => {
                  const item = actionMenuItems.find(i => i.key === key);
                  item?.onClick?.();
                }
              }} 
              trigger={['click']}
            >
              <Button icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Question Metadata */}
          <QuestionMetadata 
            metadata={{
              topicId: question.metadata.topicId,
              type: question.type,
              difficulty: String(question.metadata.difficulty),
              source: question.metadata.source,
              subtopicId: question.metadata.subtopicId
            }} 
          />
          
          {/* Question Content */}
          <QuestionContent content={question.content.text} />
        </Space>
      </Card>

      {/* Solution Section */}
      <Card 
        className="solution-section"
        style={{ marginBottom: '1rem' }}
        title={
          <Space>
            <CheckCircleOutlined />
            <span>פתרון מלא</span>
          </Space>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div className="solution-content">
            <MarkdownRenderer content={question.solution.text} />
          </div>
          {question.solution.answer && (
            <>
              <Divider>תשובה סופית</Divider>
              <div className="final-answer" style={{
                padding: '16px',
                background: '#f0fdf4',
                borderRadius: '8px',
                border: '1px solid #86efac'
              }}>
                <MarkdownRenderer content={question.solution.answer} />
              </div>
            </>
          )}
        </Space>
      </Card>

      {/* Assessment Requirements Section */}
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Rubric Assessment */}
        <Card 
          className="rubric-section"
          title={
            <Space>
              <StarOutlined />
              <span>מחוון הערכה</span>
            </Space>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {question.rubricAssessment.criteria.map((criterion, index) => (
              <div key={index} style={{ 
                padding: '16px', 
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: '1.1rem' }}>{criterion.name}</Text>
                    <Tag color="blue" style={{ fontSize: '1rem', padding: '4px 12px' }}>
                      {criterion.weight}%
                    </Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: '1rem' }}>
                    {criterion.description}
                  </Text>
                </Space>
              </div>
            ))}
          </div>
        </Card>

        {/* Answer Requirements */}
        <Card 
          className="requirements-section"
          title={
            <Space>
              <BookOutlined />
              <span>דרישות תשובה</span>
            </Space>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {question.answerRequirements.requiredElements.map((element, index) => (
              <div key={index} style={{
                padding: '12px 16px',
                background: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #bae6fd',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{ 
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#0ea5e9',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  {index + 1}
                </div>
                <Text style={{ color: '#0369a1' }}>{element}</Text>
              </div>
            ))}
          </div>
        </Card>

        {/* Statistics Section */}
        <Card title="סטטיסטיקה">
          <Space split={<Divider type="vertical" />}>
            <Text>אחוז הצלחה: 75%</Text>
            <Text>זמן ממוצע: 4.2 דקות</Text>
            <Text>מספר נסיונות: 120</Text>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default QuestionPage; 