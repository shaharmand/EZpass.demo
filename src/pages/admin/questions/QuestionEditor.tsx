import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Space, Typography, Tabs, Button, message } from 'antd';
import ReactJson from '@microlink/react-json-view';
import { Question } from '../../../types/question';
import { questionStorage } from '../../../services/admin/questionStorage';
import { AdminQuestionViewer } from '../../../components/admin/QuestionViewer';

const { Title } = Typography;

// Import the interface from QuestionViewer or define it here
interface QuestionWithTimestamps extends Question {
  createdAt?: string;
  updatedAt?: string;
}

export const QuestionEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<QuestionWithTimestamps | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    const loadQuestion = async () => {
      if (id) {
        try {
          setLoading(true);
          const found = await questionStorage.getQuestion(id);
          if (found) {
            setQuestion(found);
          } else {
            message.error('Question not found');
            navigate('/admin/questions');
          }
        } catch (error) {
          console.error('Failed to load question:', error);
          message.error('Failed to load question');
        } finally {
          setLoading(false);
        }
      }
    };

    loadQuestion();
  }, [id, navigate]);

  const handleSave = async (updatedQuestion: Question) => {
    try {
      await questionStorage.saveQuestion(updatedQuestion);
      message.success('Question saved successfully');
      // Cast the updated question to include timestamps
      setQuestion(updatedQuestion as QuestionWithTimestamps);
    } catch (error) {
      console.error('Failed to save question:', error);
      message.error('Failed to save question');
    }
  };

  const items = [
    {
      key: '1',
      label: 'עריכת שאלה',
      children: (
        <AdminQuestionViewer 
          question={question!}
          onSave={handleSave}
        />
      )
    },
    {
      key: '2',
      label: 'מבנה נתונים מלא',
      children: (
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={4}>מבנה נתונים מלא של השאלה</Title>
            {question && (
              <ReactJson 
                src={question} 
                name={null}
                theme="monokai"
                style={{ 
                  padding: '20px',
                  borderRadius: '4px',
                  backgroundColor: '#272822',
                  direction: 'ltr',
                  textAlign: 'left',
                  fontFamily: 'monospace'
                }}
                displayDataTypes={false}
                enableClipboard={true}
                displayObjectSize={false}
                collapsed={1}
                sortKeys={true}
                quotesOnKeys={false}
                indentWidth={2}
              />
            )}
          </Space>
        </Card>
      )
    }
  ];

  if (loading) {
    return <Card loading={true} />;
  }

  if (!question && !loading) {
    return (
      <Card>
        <div>Question not found</div>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>עריכת שאלה</Title>
        <Space>
          <Button onClick={() => navigate('/admin/questions')}>
            חזרה לספריה
          </Button>
        </Space>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={items}
        style={{ marginTop: 24 }}
      />
    </Space>
  );
}; 