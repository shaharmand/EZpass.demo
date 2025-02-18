import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Space, Button, Dropdown, Menu, Typography, Tag, Alert, Divider } from 'antd';
import { 
  EditOutlined, 
  ShareAltOutlined, 
  StarOutlined, 
  BookOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  MoreOutlined,
  PrinterOutlined,
  ExportOutlined
} from '@ant-design/icons';
import QuestionViewer from '../components/QuestionViewer';
import type { Question } from '../types/question';

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
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        const response = await fetch(`/api/questions/${questionId}`);
        const data = await response.json();
        setQuestion(data);
      } catch (err) {
        setError('Failed to load question');
        console.error('Error fetching question:', err);
      } finally {
        setLoading(false);
      }
    };

    if (questionId) {
      fetchQuestion();
    }
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
      <div style={{ padding: '2rem' }}>
        <Card loading={true} />
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
      {/* Header Section */}
      <div style={{ marginBottom: '2rem' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space align="center">
            <Text strong style={{ fontSize: '1.2rem' }}>
              {question.id}
            </Text>
            {question.metadata.source?.examType && (
              <Tag color="purple">{question.metadata.source.examType}</Tag>
            )}
          </Space>
          
          <Space split={<span style={{ margin: '0 8px' }}>•</span>}>
            <Text type="secondary">{question.metadata.topicId}</Text>
            {question.metadata.subtopicId && (
              <Text type="secondary">{question.metadata.subtopicId}</Text>
            )}
          </Space>
          
          <Space size="middle">
            <Tag color="blue">{question.type === 'multiple_choice' ? 'רב-ברירה' : 'פתוח'}</Tag>
            <Tag color="gold">רמה {question.metadata.difficulty}</Tag>
            {question.metadata.estimatedTime && (
              <Tag color="green">{question.metadata.estimatedTime} דקות</Tag>
            )}
          </Space>
        </Space>
      </div>

      {/* Main Content */}
      <Card
        title="שאלה"
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
        <QuestionViewer 
          question={question}
          showOptions={true}
          showSolution={false}
        />
      </Card>

      {/* Additional Sections */}
      <Space direction="vertical" size="large" style={{ width: '100%', marginTop: '2rem' }}>
        {/* Statistics Section */}
        <Card title="סטטיסטיקה" size="small">
          <Space split={<Divider type="vertical" />}>
            <Text>אחוז הצלחה: 75%</Text>
            <Text>זמן ממוצע: 4.2 דקות</Text>
            <Text>מספר נסיונות: 120</Text>
          </Space>
        </Card>

        {/* Related Questions */}
        <Card title="שאלות דומות" size="small">
          {/* TODO: Add related questions list */}
        </Card>

        {/* Tags/Categories */}
        <Card title="תגיות" size="small">
          <Space wrap>
            {question.metadata.source?.examType && (
              <Tag>{question.metadata.source.examType}</Tag>
            )}
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default QuestionPage; 