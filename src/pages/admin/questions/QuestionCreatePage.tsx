import React, { useState } from 'react';
import { Button, message, Select, Radio, Space, Typography, Form } from 'antd';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { QuestionType, createEmptyQuestion } from '../../../types/question';
import { universalTopics } from '../../../services/universalTopics';
import { questionStorage } from '../../../services/admin/questionStorage';

const { Title, Text } = Typography;

const PageContainer = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const FormContainer = styled.div`
  margin: 32px 0;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
  gap: 8px;
`;

export const QuestionCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [domains, setDomains] = useState<Array<{ id: string; name: string }>>([]);

  // Load subjects on mount
  React.useEffect(() => {
    const data = universalTopics.getAllSubjects();
    setSubjects(data.map(subject => ({
      id: subject.id,
      name: subject.name
    })));
  }, []);

  // Load domains when subject changes
  const handleSubjectChange = (subjectId: string) => {
    form.setFieldValue('domainId', undefined);
    
    const subject = universalTopics.getAllSubjects().find(s => s.id === subjectId);
    if (subject) {
      setDomains(subject.domains.map(domain => ({
        id: domain.id,
        name: domain.name
      })));
    } else {
      setDomains([]);
    }
  };

  const handleSubmit = async (values: {
    subjectId: string;
    domainId: string;
    type: QuestionType;
  }) => {
    setIsLoading(true);
    try {
      // Create a new question template
      const newQuestionTemplate = createEmptyQuestion(values.type);
      
      // Set the core identity fields
      newQuestionTemplate.data.metadata.subjectId = values.subjectId;
      newQuestionTemplate.data.metadata.domainId = values.domainId;
      newQuestionTemplate.data.metadata.type = values.type;
      
      // Create the question using questionStorage
      const savedQuestion = await questionStorage.createQuestion({
        question: newQuestionTemplate.data,
        import_info: {
          source: {
            name: 'ezpass',
            files: [],
            format: 'json'
          },
          importMetadata: {
            importedAt: new Date().toISOString(),
            importScript: 'manual-creation'
          },
          originalData: {}
        }
      });

      if (savedQuestion?.id) {
        // Navigate to the question editor
        navigate(`/admin/questions/${savedQuestion.id}`);
      } else {
        throw new Error('Failed to create question - no ID returned');
      }
    } catch (error) {
      console.error('Failed to create question:', error);
      message.error('שגיאה ביצירת השאלה');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <Title level={2}>יצירת שאלה חדשה</Title>
      <Text>בחר את המאפיינים הבסיסיים של השאלה</Text>
      
      <FormContainer>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: QuestionType.MULTIPLE_CHOICE
          }}
        >
          <Form.Item
            name="subjectId"
            label="תחום לימוד"
            rules={[{ required: true, message: 'יש לבחור תחום לימוד' }]}
          >
            <Select
              placeholder="בחר תחום לימוד"
              onChange={handleSubjectChange}
              options={subjects.map(subject => ({
                label: subject.name,
                value: subject.id
              }))}
            />
          </Form.Item>

          <Form.Item
            name="domainId"
            label="נושא"
            rules={[{ required: true, message: 'יש לבחור נושא' }]}
          >
            <Select
              placeholder="בחר נושא"
              options={domains.map(domain => ({
                label: domain.name,
                value: domain.id
              }))}
              disabled={!form.getFieldValue('subjectId')}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="סוג שאלה"
            rules={[{ required: true, message: 'יש לבחור סוג שאלה' }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value={QuestionType.MULTIPLE_CHOICE}>
                  <Space direction="vertical" size={0}>
                    <Text strong>שאלת רב-ברירה</Text>
                    <Text type="secondary">שאלה עם מספר אפשרויות ותשובה נכונה אחת</Text>
                  </Space>
                </Radio>
                <Radio value={QuestionType.OPEN}>
                  <Space direction="vertical" size={0}>
                    <Text strong>שאלה פתוחה</Text>
                    <Text type="secondary">שאלה עם תשובה מילולית חופשית</Text>
                  </Space>
                </Radio>
                <Radio value={QuestionType.NUMERICAL}>
                  <Space direction="vertical" size={0}>
                    <Text strong>שאלה מספרית</Text>
                    <Text type="secondary">שאלה עם תשובה מספרית מדויקת וטווח סטייה</Text>
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </Form>
      </FormContainer>

      <ActionBar>
        <Button onClick={() => navigate('/admin/questions')}>
          ביטול
        </Button>
        <Button 
          type="primary"
          onClick={() => form.submit()}
          loading={isLoading}
        >
          צור שאלה
        </Button>
      </ActionBar>
    </PageContainer>
  );
}; 