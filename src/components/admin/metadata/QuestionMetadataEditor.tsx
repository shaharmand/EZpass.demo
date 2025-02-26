import React, { useState, useEffect } from 'react';
import { Form, Select, InputNumber, Space, Card, Row, Col, Typography, Tag, Tooltip } from 'antd';
import { 
  StarFilled, 
  StarOutlined, 
  InfoCircleOutlined,
  AppstoreOutlined,
  ApartmentOutlined,
  FolderOutlined,
  CalendarOutlined,
  FileTextOutlined,
  BookOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { universalTopics } from '../../../services/universalTopics';
import { Question, DifficultyLevel, QuestionType } from '../../../types/question';
import { examService } from '../../../services/examService';
import { ExamTemplate } from '../../../types/examTemplate';

const { Text } = Typography;

// Define the enum values since they are only types in the imported file
const QUESTION_TYPES = ['multiple_choice', 'open', 'code', 'step_by_step'] as const;
const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;

interface QuestionMetadataEditorProps {
  question: Question;
  onChange: (updatedQuestion: Question) => void;
}

const QuestionMetadataEditor: React.FC<QuestionMetadataEditorProps> = ({
  question,
  onChange
}) => {
  const [examTemplates, setExamTemplates] = useState<ExamTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // Get all the hierarchical data
  const subjects = universalTopics.getAllSubjects() || [];
  const currentSubject = question.metadata.topicId ? universalTopics.getSubjectForTopic(question.metadata.topicId) : undefined;
  
  // Find current domain by searching through the subject's domains
  const currentDomain = currentSubject?.domains.find(domain => 
    domain.topics.some(topic => topic.id === question.metadata.topicId)
  );
  
  const topics = currentDomain?.topics || [];
  const subtopics = question.metadata.topicId ? universalTopics.getSubtopicsForTopic(question.metadata.topicId) : [];

  const handleMetadataChange = (field: string, value: any) => {
    const updatedQuestion = { ...question };
    if (field === 'source') {
      updatedQuestion.metadata.source = { ...updatedQuestion.metadata.source, ...value };
    } else if (field === 'type') {
      updatedQuestion.type = value as QuestionType;
    } else {
      (updatedQuestion.metadata as any)[field] = value;
    }
    onChange(updatedQuestion);
  };

  // Fetch exam templates when domain changes
  useEffect(() => {
    const fetchExamTemplates = async () => {
      if (!currentDomain) return;
      
      setLoading(true);
      try {
        const templates = await examService.getExamsByDomain(currentDomain.id);
        setExamTemplates(templates);
      } catch (error) {
        console.error('Failed to fetch exam templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExamTemplates();
  }, [currentDomain]);

  const renderDifficultyStars = (level: number) => (
    <Space>
      {[...Array(5)].map((_, index) => (
        index < level ? 
          <StarFilled key={index} style={{ color: '#f59e0b' }} /> :
          <StarOutlined key={index} style={{ color: '#d1d5db' }} />
      ))}
    </Space>
  );

  const getDifficultyLabel = (level: number) => {
    switch(level) {
      case 1: return 'קל מאוד';
      case 2: return 'קל';
      case 3: return 'בינוני';
      case 4: return 'קשה';
      case 5: return 'קשה מאוד';
      default: return `רמה ${level}`;
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* Topic Information */}
      <Card 
        size="small" 
        title={
          <Space>
            <AppstoreOutlined />
            <span>מידע נושא</span>
          </Space>
        }
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label={
                  <Space>
                    <BookOutlined />
                    <span>נושא</span>
                  </Space>
                }
              >
                <Select
                  value={currentSubject?.id}
                  onChange={(subjectId) => {
                    const subject = subjects.find(s => s.id === subjectId);
                    if (subject && subject.domains.length > 0) {
                      const firstTopic = subject.domains[0].topics[0];
                      if (firstTopic) {
                        handleMetadataChange('topicId', firstTopic.id);
                      }
                    }
                  }}
                >
                  {subjects.map(subject => (
                    <Select.Option key={subject.id} value={subject.id}>
                      {subject.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {currentSubject && (
              <Col span={12}>
                <Form.Item 
                  label={
                    <Space>
                      <FolderOutlined />
                      <span>תת-נושא</span>
                    </Space>
                  }
                >
                  <Select
                    value={question.metadata.topicId}
                    onChange={(topicId) => handleMetadataChange('topicId', topicId)}
                  >
                    {topics.map(topic => (
                      <Select.Option key={topic.id} value={topic.id}>
                        {topic.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>

          {subtopics.length > 0 && (
            <Row>
              <Col span={24}>
                <Form.Item 
                  label={
                    <Space>
                      <FolderOutlined />
                      <span>תת-נושא משני</span>
                    </Space>
                  }
                >
                  <Select
                    value={question.metadata.subtopicId}
                    onChange={(subtopicId) => handleMetadataChange('subtopicId', subtopicId)}
                    allowClear
                  >
                    {subtopics.map(subtopic => (
                      <Select.Option key={subtopic.id} value={subtopic.id}>
                        {subtopic.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Card>

      {/* Question Properties */}
      <Card 
        size="small" 
        title={
          <Space>
            <FileTextOutlined />
            <span>מאפייני שאלה</span>
          </Space>
        }
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label={
                  <Space>
                    <FileTextOutlined />
                    <span>סוג</span>
                  </Space>
                }
              >
                <Select
                  value={question.type}
                  onChange={(value) => handleMetadataChange('type', value)}
                >
                  {QUESTION_TYPES.map(type => (
                    <Select.Option key={type} value={type}>
                      {type === 'multiple_choice' ? 'רב ברירה' :
                       type === 'open' ? 'שאלה פתוחה' :
                       type === 'code' ? 'תכנות' :
                       'שלב אחר שלב'}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label={
                  <Space>
                    <StarOutlined />
                    <span>רמת קושי</span>
                    <Tooltip title={getDifficultyLabel(question.metadata.difficulty)}>
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Space>
                }
              >
                <Select
                  value={question.metadata.difficulty}
                  onChange={(value) => handleMetadataChange('difficulty', value)}
                >
                  {DIFFICULTY_LEVELS.map(level => (
                    <Select.Option key={level} value={level}>
                      <Space>
                        {renderDifficultyStars(level)}
                        <Text>{getDifficultyLabel(level)}</Text>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label={
                  <Space>
                    <ClockCircleOutlined />
                    <span>זמן מוערך (דקות)</span>
                  </Space>
                }
              >
                <InputNumber
                  min={1}
                  max={120}
                  value={question.metadata.estimatedTime}
                  onChange={(value) => handleMetadataChange('estimatedTime', value)}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Source Information */}
      <Card 
        size="small" 
        title={
          <Space>
            <CalendarOutlined />
            <span>מידע מקור</span>
          </Space>
        }
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label={
                  <Space>
                    <FileTextOutlined />
                    <span>תבנית</span>
                  </Space>
                }
              >
                <Select
                  value={question.metadata.source?.examTemplateId}
                  onChange={(value) => handleMetadataChange('source', { examTemplateId: value })}
                  loading={loading}
                >
                  {examTemplates.map(template => (
                    <Select.Option key={template.id} value={template.id}>
                      {template.names.medium}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label={
                  <Space>
                    <CalendarOutlined />
                    <span>שנה</span>
                  </Space>
                }
              >
                <InputNumber
                  min={1990}
                  max={2100}
                  value={question.metadata.source?.year}
                  onChange={(value) => handleMetadataChange('source', { year: value })}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label={
                  <Space>
                    <CalendarOutlined />
                    <span>סמסטר</span>
                  </Space>
                }
              >
                <Select
                  value={question.metadata.source?.season}
                  onChange={(value) => handleMetadataChange('source', { season: value })}
                >
                  <Select.Option value="winter">חורף</Select.Option>
                  <Select.Option value="spring">אביב</Select.Option>
                  <Select.Option value="summer">קיץ</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label={
                  <Space>
                    <CalendarOutlined />
                    <span>מועד</span>
                  </Space>
                }
              >
                <Select
                  value={question.metadata.source?.moed}
                  onChange={(value) => handleMetadataChange('source', { moed: value })}
                >
                  <Select.Option value="a">א</Select.Option>
                  <Select.Option value="b">ב</Select.Option>
                  <Select.Option value="c">ג</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </Space>
  );
};

export default QuestionMetadataEditor; 