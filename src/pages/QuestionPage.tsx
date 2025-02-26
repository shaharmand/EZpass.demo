import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Space, Button, Dropdown, Menu, Typography, Tag, Alert, Divider, Spin, Row, Col, Tooltip } from 'antd';
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
  CheckCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  TeamOutlined,
  BarChartOutlined,
  HistoryOutlined,
  LockOutlined,
  CopyOutlined
} from '@ant-design/icons';
import QuestionViewer from '../components/QuestionViewer';
import QuestionContent from '../components/QuestionContent';
import QuestionMetadata from '../components/QuestionMetadata';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import type { Question } from '../types/question';
import { questionStorage } from '../services/admin/questionStorage';
import { logger } from '../utils/logger';

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
        
        logger.info('Fetching question from storage', { questionId });
        const fetchedQuestion = await questionStorage.getQuestion(questionId);
        setQuestion(fetchedQuestion);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load question';
        setError(errorMessage);
        logger.error('Error fetching question:', { questionId, error: err });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId]);

  const teacherActionMenuItems = [
    {
      key: 'edit',
      label: 'ערוך שאלה',
      icon: <EditOutlined />,
      onClick: () => navigate(`/questions/${questionId}/edit`)
    },
    {
      key: 'duplicate',
      label: 'שכפל שאלה',
      icon: <CopyOutlined />,
      onClick: () => {/* TODO */}
    },
    {
      key: 'add-to-exam',
      label: 'הוסף למבחן',
      icon: <BookOutlined />,
      onClick: () => {/* TODO */}
    },
    {
      key: 'add-to-set',
      label: 'הוסף לסט שאלות',
      icon: <PlusOutlined />,
      onClick: () => {/* TODO */}
    },
    {
      key: 'share',
      label: 'שתף עם מורים',
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
      {/* Teacher Interface Header */}
      <Card style={{ marginBottom: '2rem' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <LockOutlined /> ממשק מורה - דף שאלה
            </Title>
            <Text type="secondary">
              צפייה ועריכת שאלה, כולל פתרון מלא, מחוון הערכה וסטטיסטיקות ביצועים
            </Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<TeamOutlined />}>
                שיתוף פעולה
              </Button>
              <Button icon={<HistoryOutlined />}>
                היסטוריית שינויים
              </Button>
              <Button type="primary" icon={<EditOutlined />}>
                ערוך שאלה
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Question Section */}
      <Card 
        className="question-section"
        style={{ marginBottom: '1rem' }}
        title={
          <Title level={4} style={{ margin: 0 }}>
            <FileTextOutlined /> תוכן השאלה
          </Title>
        }
        extra={
          <Space>
            <Button 
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => {}}
            >
              תצוגה מקדימה
            </Button>
            <Dropdown 
              menu={{ 
                items: teacherActionMenuItems,
                onClick: ({ key }) => {
                  const item = teacherActionMenuItems.find(i => i.key === key);
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
          <Title level={4} style={{ margin: 0 }}>
            <CheckCircleOutlined /> פתרון מלא ומחוון בדיקה
          </Title>
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
            <Title level={4} style={{ margin: 0 }}>
              <StarOutlined /> מחוון הערכה
            </Title>
          }
          extra={
            <Button icon={<EditOutlined />}>
              ערוך מחוון
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {question.evaluation?.rubricAssessment?.criteria.map((criterion, index: number) => (
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
            <Title level={4} style={{ margin: 0 }}>
              <BookOutlined /> דרישות תשובה
            </Title>
          }
          extra={
            <Button icon={<EditOutlined />}>
              ערוך דרישות
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {question.evaluation?.answerRequirements?.requiredElements.map((element: string, index: number) => (
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
        <Card 
          title={
            <Title level={4} style={{ margin: 0 }}>
              <BarChartOutlined /> סטטיסטיקות וביצועים
            </Title>
          }
          extra={
            <Button icon={<SettingOutlined />}>
              הגדרות ניתוח
            </Button>
          }
        >
          <Row gutter={[24, 24]}>
            <Col span={8}>
              <Card size="small" title="ביצועי תלמידים">
                <Space split={<Divider type="vertical" />}>
                  <Text>אחוז הצלחה: 75%</Text>
                  <Text>זמן ממוצע: 4.2 דקות</Text>
                  <Text>מספר נסיונות: 120</Text>
                </Space>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="ניתוח טעויות נפוצות">
                <Text>נתונים יתווספו לאחר שימוש בשאלה</Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" title="המלצות שיפור">
                <Button type="link" icon={<BarChartOutlined />}>
                  צפה בדוח מלא
                </Button>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* Teacher Tools Section */}
        <Card 
          title={
            <Title level={4} style={{ margin: 0 }}>
              <SettingOutlined /> כלי מורה
            </Title>
          }
        >
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Button block icon={<EditOutlined />}>
                ערוך שאלה
              </Button>
            </Col>
            <Col span={6}>
              <Button block icon={<BookOutlined />}>
                הוסף למבחן
              </Button>
            </Col>
            <Col span={6}>
              <Button block icon={<TeamOutlined />}>
                שתף עם מורים
              </Button>
            </Col>
            <Col span={6}>
              <Button block icon={<HistoryOutlined />}>
                היסטוריית שינויים
              </Button>
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
};

export default QuestionPage; 