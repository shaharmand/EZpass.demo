import { RouteObject, Outlet, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { message } from 'antd';
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/Dashboard';
import { QuestionLibraryPage } from '../pages/admin/questions/QuestionLibraryPage';
import { QuestionEditPage } from '../pages/admin/questions/QuestionEditPage';
import { QuestionImport } from '../pages/admin/questions/import';
import { QuestionGenerator } from '../pages/admin/questions/generate';
import { CreateQuestionWizard } from '../pages/admin/components/questions/create/CreateQuestionWizard';
import { DatabaseQuestion, SaveQuestion } from '../types/question';
import { questionStorage } from '../services/admin/questionStorage';

// Wrapper component to handle loading question data and state management
const QuestionEditPageWrapper: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<DatabaseQuestion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuestion = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const questionData = await questionStorage.getQuestion(id);
        if (questionData) {
          setQuestion(questionData);
        } else {
          message.error('Question not found');
          navigate('/admin/questions');
        }
      } catch (error) {
        console.error('Failed to load question:', error);
        message.error('Failed to load question');
        navigate('/admin/questions');
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
  }, [id, navigate]);

  const handleCancel = () => {
    navigate('/admin/questions');
  };

  if (loading || !question) {
    return <div>Loading...</div>;
  }

  return (
    <QuestionEditPage
      question={question}
      onCancel={handleCancel}
    />
  );
};

export const adminRoutes: RouteObject = {
  path: 'admin',
  element: <AdminLayout><Outlet /></AdminLayout>,
  children: [
    {
      index: true,
      element: <AdminDashboard />,
    },
    {
      path: 'questions',
      children: [
        {
          index: true,
          element: <QuestionLibraryPage />,
        },
        {
          path: 'new',
          element: <CreateQuestionWizard 
            onCancel={() => window.location.href = '/admin/questions'}
          />,
        },
        {
          path: ':id',
          element: <QuestionEditPageWrapper />,
        },
        {
          path: 'import',
          element: <QuestionImport />,
        },
        {
          path: 'generate',
          element: <QuestionGenerator />,
        }
      ],
    }
  ],
}; 