import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, message } from 'antd';
import { Question } from '../../../types/question';
import { questionStorage } from '../../../services/admin/questionStorage';
import { AdminQuestionViewer } from '../../../components/admin/QuestionViewer';

export const QuestionEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

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
      setQuestion(updatedQuestion);
    } catch (error) {
      console.error('Failed to save question:', error);
      message.error('Failed to save question');
    }
  };

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
    <div style={{ padding: '24px' }}>
      <AdminQuestionViewer 
        question={question!}
        onSave={handleSave}
      />
    </div>
  );
}; 