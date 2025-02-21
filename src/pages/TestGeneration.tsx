import React, { useState } from 'react';
import { Card, Space, Button, Typography, Input, Select, Divider } from 'antd';
import { questionService } from '../services/llm/questionGenerationService';
import type { Question, DifficultyLevel } from '../types/question';
import QuestionViewer from '../components/QuestionViewer';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TestGeneration: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [topic, setTopic] = useState('linear_equations');
  const [difficulty, setDifficulty] = useState(3);
  const [type, setType] = useState<'multiple_choice' | 'open'>('multiple_choice');

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      const generatedQuestion = await questionService.generateQuestion({
        topic,
        difficulty: difficulty as DifficultyLevel,
        type,
        subject: 'Mathematics',
        educationType: 'bagrut'
      });

      setQuestion(generatedQuestion);
      console.log('Generated Question:', generatedQuestion);
    } catch (error) {
      console.error('Generation Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Question Generation Test">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Controls */}
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>Topic:</Text>
              <Select
                style={{ width: '100%', marginTop: '8px' }}
                value={topic}
                onChange={setTopic}
              >
                <Option value="linear_equations">Linear Equations</Option>
                <Option value="quadratic_equations">Quadratic Equations</Option>
                <Option value="trigonometry">Trigonometry</Option>
                <Option value="vectors">Vectors</Option>
              </Select>
            </div>

            <div>
              <Text strong>Difficulty (1-5):</Text>
              <Select
                style={{ width: '100%', marginTop: '8px' }}
                value={difficulty}
                onChange={setDifficulty}
              >
                {[1, 2, 3, 4, 5].map(level => (
                  <Option key={level} value={level}>Level {level}</Option>
                ))}
              </Select>
            </div>

            <div>
              <Text strong>Question Type:</Text>
              <Select
                style={{ width: '100%', marginTop: '8px' }}
                value={type}
                onChange={setType}
              >
                <Option value="multiple_choice">Multiple Choice</Option>
                <Option value="open">Open Question</Option>
              </Select>
            </div>

            <Button 
              type="primary"
              onClick={handleGenerate}
              loading={loading}
              style={{ width: '100%' }}
            >
              Generate Question
            </Button>
          </Space>

          {error && (
            <Text type="danger">{error}</Text>
          )}

          <Divider />

          {/* Question Display */}
          {question && (
            <div>
              <Title level={5}>Generated Question:</Title>
              <Card>
                <QuestionViewer 
                  question={question}
                  showOptions={true}
                  showSolution={true}
                />
              </Card>
              
              {/* Raw Response for Debugging */}
              <Card style={{ marginTop: '1rem' }}>
                <Text strong>Raw Response:</Text>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '12px', 
                  borderRadius: '4px',
                  maxHeight: '300px',
                  overflow: 'auto',
                  marginTop: '0.5rem'
                }}>
                  {JSON.stringify(question, null, 2)}
                </pre>
              </Card>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default TestGeneration; 