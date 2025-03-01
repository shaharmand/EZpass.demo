import React, { useState } from 'react';
import { Card, Form, Input, Button, Select, InputNumber, Space, Typography, Divider, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { LLMService } from '../../../services/llm/llmService';
import { QuestionStorage } from '../../../services/admin/questionStorage';
import { Question, QuestionStatus, SourceType, EzpassCreatorType } from '../../../types/question';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface GenerationResult {
  systemPrompt: string;
  userPrompt: string;
  rawResponse: string;
  questionId?: string;
  question?: Question;
}

export const QuestionGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const questionStorage = new QuestionStorage();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const llmService = new LLMService();
      
      // Build the system and user prompts based on metadata
      const systemPrompt = `You are an expert question creator for ${values.subject} exams. 
Create questions that are clear, challenging, and educational.
The question should take approximately ${values.estimatedTime} minutes to solve.
Format the response as a JSON object with the following structure:
{
  "content": {
    "text": "question text here",
    "format": "markdown"
  },
  "type": "${values.type}",
  "options": ${values.type === 'multiple_choice' ? '[{"text": "option 1", "format": "markdown"}, {"text": "option 2", "format": "markdown"}, {"text": "option 3", "format": "markdown"}, {"text": "option 4", "format": "markdown"}]' : '[]'},
  "correctOption": ${values.type === 'multiple_choice' ? '0' : 'null'},
  "solution": {
    "explanation": "detailed solution explanation",
    "steps": ["step 1", "step 2", "step 3"]
  },
  "metadata": {
    "difficulty": ${values.difficulty === 'easy' ? 1 : values.difficulty === 'medium' ? 2 : 3},
    "topicId": "${values.topic}",
    "subtopicId": "${values.subtopic || ''}",
    "estimatedTime": ${values.estimatedTime},
    "source": {
      "sourceType": "${SourceType.EZPASS}",
      "details": {
        "ezpass": {
          "creatorType": "${EzpassCreatorType.AI}",
          "createdAt": "${new Date().toISOString()}",
          "ai": {
            "model": "gpt-4",
            "systemPrompt": "See above",
            "userPrompt": "See above",
            "parameters": {
              "temperature": 0.7
            }
          }
        }
      }
    }
  }
}`;

      const userPrompt = `Create a ${values.difficulty} level ${values.type} question about ${values.specificTopic || values.subtopic || values.topic} in ${values.subject}.`;
      
      // Call LLM service to generate question
      const response = await llmService.complete(userPrompt, {
        systemMessage: systemPrompt,
        temperature: 0.7,
      });

      // Parse the response
      const questionData = JSON.parse(response);
      
      // Update the source information with actual prompts
      if (questionData.metadata?.source?.details?.ezpass?.ai) {
        questionData.metadata.source.details.ezpass.ai.systemPrompt = systemPrompt;
        questionData.metadata.source.details.ezpass.ai.userPrompt = userPrompt;
      }
      
      // Create the question with source information
      const question: Question = {
        ...questionData,
        id: `${values.subject}_${values.topic}_${Date.now()}`, // Temporary ID, will be replaced by storage
      };

      // Save to database - validation will be handled by storage service
      await questionStorage.saveQuestion({
        ...question,
        status: QuestionStatus.Draft
      });

      // Save the result
      setResult({
        systemPrompt,
        userPrompt,
        rawResponse: JSON.stringify(questionData, null, 2),
        questionId: question.id,
        question
      });

      message.success('Question generated and saved successfully! You can review it in the editor.');

    } catch (error) {
      console.error('Error generating question:', error);
      message.error('Failed to generate question. Please try again.');
    } finally {
      setLoading(false);
    }
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
            type: 'multiple_choice',
            difficulty: 'medium',
            estimatedTime: 5
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Subject Fields */}
            <Form.Item name="subject" label="נושא ראשי" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="math">מתמטיקה</Select.Option>
                <Select.Option value="physics">פיזיקה</Select.Option>
                <Select.Option value="chemistry">כימיה</Select.Option>
                <Select.Option value="biology">ביולוגיה</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="topic" label="תת נושא" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="algebra">אלגברה</Select.Option>
                <Select.Option value="geometry">גאומטריה</Select.Option>
                <Select.Option value="trigonometry">טריגונומטריה</Select.Option>
                <Select.Option value="calculus">חשבון דיפרנציאלי ואינטגרלי</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="subtopic" label="תת תת נושא">
              <Select>
                <Select.Option value="equations">משוואות</Select.Option>
                <Select.Option value="functions">פונקציות</Select.Option>
                <Select.Option value="vectors">וקטורים</Select.Option>
                <Select.Option value="matrices">מטריצות</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="specificTopic" label="נושא ספציפי">
              <Input placeholder="למשל: משוואות ריבועיות עם פרמטר" />
            </Form.Item>

            {/* Question Type */}
            <Form.Item name="type" label="סוג שאלה" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="multiple_choice">רב ברירה</Select.Option>
                <Select.Option value="open">פתוחה</Select.Option>
                <Select.Option value="true_false">נכון/לא נכון</Select.Option>
              </Select>
            </Form.Item>

            {/* Difficulty */}
            <Form.Item name="difficulty" label="רמת קושי" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="easy">קלה</Select.Option>
                <Select.Option value="medium">בינונית</Select.Option>
                <Select.Option value="hard">קשה</Select.Option>
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

      {result && (
        <>
          <Divider />
          <Card title="תוצאות">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Title level={4}>System Prompt</Title>
                <Paragraph copyable>{result.systemPrompt}</Paragraph>
              </div>

              <div>
                <Title level={4}>User Prompt</Title>
                <Paragraph copyable>{result.userPrompt}</Paragraph>
              </div>

              <div>
                <Title level={4}>Raw Response</Title>
                <TextArea
                  value={result.rawResponse}
                  autoSize={{ minRows: 4, maxRows: 10 }}
                  readOnly
                />
              </div>

              {result.questionId && (
                <Button 
                  type="primary"
                  onClick={() => navigate(`/admin/questions/${result.questionId}`)}
                >
                  ערוך שאלה במערכת
                </Button>
              )}
            </Space>
          </Card>
        </>
      )}
    </div>
  );
};

export default QuestionGenerator; 