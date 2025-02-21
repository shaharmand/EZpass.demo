import React, { useState } from 'react';
import { Card, Space, Button, Typography, Table, Tag, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import QuestionViewer from '../../components/QuestionViewer';
import type { Question, QuestionType, DifficultyLevel } from '../../types/question';
import questions from '../../data/questions.json';
import { loadYamlQuestions } from './utils/questionConverter';

const { Title, Text } = Typography;

const QuestionManagerPage: React.FC = () => {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  // Cast the imported questions to Question[] type
  const [questionList, setQuestionList] = useState<Question[]>(() => {
    // Validate and transform the imported questions
    return (questions.questions as any[]).map(q => ({
      ...q,
      type: q.type as QuestionType,
      metadata: {
        ...q.metadata,
        difficulty: q.metadata.difficulty as DifficultyLevel
      }
    }));
  });

  const handleFileUpload = async (file: File) => {
    try {
      const content = await file.text();
      // Extract metadata from file path
      const metadata = {
        topicId: 'algebra', // This should come from file path
        source: {
          examType: 'bagrut' // This should come from file path
        }
      };
      
      const newQuestions = await loadYamlQuestions(content, metadata);
      setQuestionList(prevList => [...prevList, ...newQuestions]);
      message.success(`Added ${newQuestions.length} questions`);
      return false; // Prevent default upload
    } catch (error) {
      console.error('Failed to load questions:', error);
      message.error('Failed to load questions');
      return false;
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: QuestionType) => (
        <Tag color={type === 'multiple_choice' ? 'blue' : 'green'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Topic',
      dataIndex: ['metadata', 'topicId'],
      key: 'topic',
    },
    {
      title: 'Difficulty',
      dataIndex: ['metadata', 'difficulty'],
      key: 'difficulty',
      render: (difficulty: DifficultyLevel) => (
        <Tag color={difficulty <= 2 ? 'green' : difficulty <= 4 ? 'orange' : 'red'}>
          {difficulty}
        </Tag>
      ),
    },
    {
      title: 'Source',
      dataIndex: ['metadata', 'source', 'examType'],
      key: 'source',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Question) => (
        <Button type="link" onClick={() => setSelectedQuestion(record)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space direction="vertical">
            <Title level={4}>Question Manager</Title>
            <Text>
              View and manage static questions from the question bank.
            </Text>
            <Upload 
              beforeUpload={handleFileUpload}
              accept=".yaml,.yml"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Upload YAML Questions</Button>
            </Upload>
          </Space>
        </Card>

        {/* Questions Table */}
        <Card>
          <Table<Question>
            dataSource={questionList} 
            columns={columns}
            rowKey="id"
          />
        </Card>

        {/* Question Preview */}
        {selectedQuestion && (
          <Card 
            title="Question Preview"
            extra={
              <Button onClick={() => setSelectedQuestion(null)}>
                Close
              </Button>
            }
          >
            <QuestionViewer 
              question={selectedQuestion}
              showOptions={true}
              showSolution={true}
            />
          </Card>
        )}
      </Space>
    </div>
  );
};

export default QuestionManagerPage; 