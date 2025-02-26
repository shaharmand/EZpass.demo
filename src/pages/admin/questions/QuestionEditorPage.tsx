import React, { useState, useEffect } from 'react';
import { Card, Space, Typography, Tabs, Button, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import ReactJson from '@microlink/react-json-view';
import { Question } from '../../../types/question';
import { questionStorage } from '../../../services/admin/questionStorage';
import { AdminQuestionViewer } from '../../../components/admin/QuestionViewer';

const { Title } = Typography;
const { TabPane } = Tabs;

export const QuestionEditorPage: React.FC = () => {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    loadQuestion();
  }, [questionId]);

  const loadQuestion = async () => {
    if (!questionId) return;
    
    setLoading(true);
    try {
      const loadedQuestion = await questionStorage.getQuestion(questionId);
      setQuestion(loadedQuestion);
    } catch (error) {
      message.error('Failed to load question');
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedQuestion: Question) => {
    try {
      await questionStorage.saveQuestion(updatedQuestion);
      message.success('Question saved successfully');
      setQuestion(updatedQuestion);
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
        <div>
          <AdminQuestionViewer 
            question={question!}
            onSave={handleSave}
          />
        </div>
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
                  backgroundColor: '#272822'
                }}
                displayDataTypes={false}
                enableClipboard={true}
                displayObjectSize={false}
                collapsed={1}
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
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
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