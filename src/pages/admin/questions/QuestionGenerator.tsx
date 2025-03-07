import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, InputNumber, Space, Typography, Divider, message, Spin, Alert, Collapse } from 'antd';
import { useNavigate } from 'react-router-dom';
import { QuestionStorage } from '../../../services/admin/questionStorage';
import { Question, QuestionType, SourceType, EzpassCreatorType, PublicationStatusEnum, DatabaseQuestion, EMPTY_EVALUATION_GUIDELINES, ValidationStatus, ReviewStatusEnum, DifficultyLevel } from '../../../types/question';
import { QuestionContentSection } from '../../../components/admin/sections/QuestionContentSection';
import { QuestionMetadataSection } from '../../../components/admin/sections/QuestionMetadataSection';
import { SolutionAndEvaluationSection } from '../../../components/admin/sections/SolutionAndEvaluationSection';
import { EditOutlined } from '@ant-design/icons';
import { universalTopics } from '../../../services/universalTopics';
import { Topic, SubTopic } from '../../../types/subject';
import { ExamInstitutionType, ExamType } from '../../../types/examTemplate';
import { enumMappings } from '../../../utils/translations';
import { questionGenerationService } from '../../../services/llm/QuestionGenerationV2';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

interface GenerationResult {
  systemPrompt: string;
  userPrompt: string;
  rawResponse: string;
  questionId?: string;
  question?: DatabaseQuestion;
}

interface FormValues {
  type: QuestionType;
  difficulty: DifficultyLevel;
  topic: string;
  subtopic: string;
  specificTopic?: string;
}

export const QuestionGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const questionStorage = new QuestionStorage();

  // Get topics from civil engineering subject and construction safety domain
  const subjects = universalTopics.getAllSubjects();
  const civilEngineering = subjects.find(s => s.id === 'civil_engineering');
  const constructionSafety = civilEngineering?.domains.find(d => d.id === 'construction_safety');
  const topics = constructionSafety?.topics || [];

  // Get subtopics for selected topic
  const selectedTopicData = topics.find((t: Topic) => t.id === selectedTopic);
  const subtopics = selectedTopicData?.subTopics || [];

  const handleTopicChange = (value: string) => {
    setSelectedTopic(value);
    form.setFieldValue('subtopic', undefined); // Reset subtopic when topic changes
  };

  const onFinish = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    try {
      // Generate question using the new question generation service
      const generatedQuestion = await questionGenerationService.generateQuestion({
        type: values.type,
        prompt: `Generate a ${values.difficulty} level ${values.type} question about ${values.specificTopic || values.subtopic || values.topic} in construction safety.`,
        subjectId: 'civil_engineering',
        domainId: 'construction_safety',
        topicId: values.topic,
        subtopicId: values.subtopic,
        difficulty: values.difficulty,
        estimatedTime: form.getFieldValue('estimatedTime'),
        answerFormat: {
          hasFinalAnswer: values.type !== QuestionType.OPEN,
          finalAnswerType: values.type === QuestionType.MULTIPLE_CHOICE ? 'multiple_choice' :
                          values.type === QuestionType.NUMERICAL ? 'numerical' : 'none',
          requiresSolution: true
        },
        source: {
          type: 'ezpass',
          creatorType: 'ai'
        }
      });

      // Convert to DatabaseQuestion type
      const question: DatabaseQuestion = {
        ...generatedQuestion,
        publication_status: PublicationStatusEnum.DRAFT,
        validation_status: ValidationStatus.WARNING,
        review_status: ReviewStatusEnum.PENDING_REVIEW,
        ai_generated_fields: {
          fields: ['content', 'solution', 'evaluation'],
          confidence: {
            content: 0.8,
            solution: 0.8,
            evaluation: 0.8
          },
          generatedAt: new Date().toISOString()
        }
      };

      // Save the result
      setResult({
        systemPrompt: 'Question Generation',
        userPrompt: `Generate a ${values.difficulty} level ${values.type} question about ${values.specificTopic || values.subtopic || values.topic} in construction safety.`,
        rawResponse: JSON.stringify(question, null, 2),
        questionId: question.id,
        question: question
      });

      message.success(
        <Space direction="vertical">
          <div>השאלה נוצרה ונשמרה בהצלחה!</div>
          <Button 
            type="link" 
            onClick={() => navigate(`/admin/questions/${question.id}`)}
            style={{ padding: 0, height: 'auto' }}
          >
            לחץ כאן לעריכת השאלה
          </Button>
        </Space>
      );

    } catch (error) {
      console.error('Error generating question:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate question. Please try again.');
      message.error('Failed to generate question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    form.submit();
  };

  const handleEdit = () => {
    if (result?.questionId) {
      navigate(`/admin/questions/${result.questionId}`);
    }
  };

  const handleSave = async (data: Partial<Question>) => {
    if (!result?.question) return;
    await questionStorage.saveQuestion({
      ...result.question,
      ...data
    });
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <Title level={2}>יצירת שאלה חדשה עם AI</Title>
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            type: QuestionType.MULTIPLE_CHOICE,
            difficulty: 3,
            estimatedTime: 5
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Topic Fields */}
            <Form.Item name="topic" label="נושא" rules={[{ required: true }]}>
              <Select onChange={handleTopicChange}>
                {topics.map((topic: Topic) => (
                  <Select.Option key={topic.id} value={topic.id}>{topic.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="subtopic" label="תת נושא">
              <Select disabled={!selectedTopic}>
                {subtopics.map((subtopic: SubTopic) => (
                  <Select.Option key={subtopic.id} value={subtopic.id}>{subtopic.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="specificTopic" label="נושא ספציפי">
              <Input placeholder="למשל: בטיחות בעבודה עם ביטומן חם" />
            </Form.Item>

            {/* Question Type */}
            <Form.Item name="type" label="סוג שאלה" rules={[{ required: true }]}>
              <Select>
                {Object.entries(enumMappings.questionType).map(([type, label]) => (
                  <Select.Option key={type} value={type}>{label}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Difficulty */}
            <Form.Item name="difficulty" label="רמת קושי" rules={[{ required: true }]}>
              <Select>
                {Object.entries(enumMappings.difficulty).map(([level, label]) => (
                  <Select.Option key={level} value={parseInt(level)}>{label}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Estimated Time */}
            <Form.Item name="estimatedTime" label="זמן מוערך (דקות)" rules={[{ required: true }]}>
              <InputNumber min={1} max={60} />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading}>
              צור שאלה
            </Button>
          </Space>
        </Form>
      </Card>

      {error && (
        <Card style={{ marginTop: '24px' }}>
          <Alert
            message="שגיאה"
            description={error}
            type="error"
            showIcon
          />
        </Card>
      )}

      {result?.question && (
        <Card style={{ marginTop: '24px' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={3}>תצוגה מקדימה של השאלה</Title>
              <Space>
                <Button onClick={handleRegenerate}>צור מחדש</Button>
                <Button 
                  type="primary" 
                  onClick={handleEdit}
                  icon={<EditOutlined />}
                  size="large"
                >
                  ערוך שאלה
                </Button>
              </Space>
            </div>

            <Collapse defaultActiveKey={['content']}>
              <Panel header="תוכן השאלה" key="content">
                <QuestionContentSection
                  question={result.question}
                  isEditing={false}
                  onEdit={() => {}}
                  onSave={handleSave}
                />
              </Panel>
              <Panel header="מטא-דאטה" key="metadata">
                <QuestionMetadataSection
                  question={result.question}
                  isEditing={false}
                  onEdit={() => {}}
                  onSave={handleSave}
                />
              </Panel>
              <Panel header="פתרון והערכה" key="solution">
                <SolutionAndEvaluationSection
                  question={result.question}
                  isEditing={false}
                  onEdit={() => {}}
                  onSave={handleSave}
                />
              </Panel>
              <Panel header="JSON גולמי" key="raw">
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '16px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '400px'
                }}>
                  {result.rawResponse}
                </pre>
              </Panel>
            </Collapse>
          </Space>
        </Card>
      )}
    </div>
  );
};

export default QuestionGenerator; 