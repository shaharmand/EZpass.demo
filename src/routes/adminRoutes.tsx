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
import { QuestionEditorContainer } from '../components/question/editor/QuestionEditorContainer';

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

  const handleSave = async (data: SaveQuestion) => {
    if (!question) return;
    
    try {
      await questionStorage.saveQuestion(data);
      const updatedQuestion = await questionStorage.getQuestion(question.id);
      if (updatedQuestion) {
        setQuestion(updatedQuestion);
      }
    } catch (error) {
      console.error('Failed to save question:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    navigate('/admin/questions');
  };

  if (loading || !question) {
    return <div>Loading...</div>;
  }

  return (
    <QuestionEditPage
      question={question}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

// Test editor wrapper component
const TestEditorWrapper: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<DatabaseQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    const loadQuestion = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const questionData = await questionStorage.getQuestion(id);
        if (questionData) {
          setQuestion(questionData);
          // Reset editing states when loading new question
          setIsEditing(false);
          setIsModified(false);
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

  const handleSave = async (data: SaveQuestion) => {
    if (!question) return;
    
    try {
      await questionStorage.saveQuestion(data);
      const updatedQuestion = await questionStorage.getQuestion(question.id);
      if (updatedQuestion) {
        setQuestion(updatedQuestion);
        setIsModified(false);
        setIsEditing(false);
        message.success('השאלה נשמרה בהצלחה');
      }
    } catch (error) {
      console.error('Failed to save question:', error);
      message.error('שגיאה בשמירת השאלה');
      throw error;
    }
  };

  const handleCancel = () => {
    if (isModified) {
      setIsEditing(false);
      setIsModified(false);
    } else {
      navigate('/admin/questions');
    }
  };

  const handleEdit = () => {
    console.log('=== Starting Edit ===');
    setIsEditing(true);
  };

  const handleModified = (modified: boolean) => {
    console.log('=== Modified State Changed ===', modified);
    setIsModified(modified);
  };

  if (loading || !question) {
    return <div>Loading...</div>;
  }

  return (
    <QuestionEditorContainer
      question={question}
      isEditing={isEditing}
      isModified={isModified}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
      onModified={handleModified}
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