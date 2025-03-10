import { Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createEmptyQuestion, DatabaseQuestion, Question } from '../../../types/question';
import { questionStorage } from '../../../services/admin/questionStorage';
import { QuestionLibraryPage } from './QuestionLibraryPage';

export default function QuestionsPage() {
  const navigate = useNavigate();

  const handleCreateNewQuestion = async () => {
    try {
      // Create a new empty question template
      const newQuestionTemplate = createEmptyQuestion();
      
      // Create the question using createQuestion which returns the saved question
      const savedQuestion = await questionStorage.createQuestion({
        question: newQuestionTemplate.data as Question,
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

      // Redirect to the edit page for the new question
      if (savedQuestion?.id) {
        navigate(`/admin/questions/${savedQuestion.id}`);
      }
    } catch (error) {
      console.error('Failed to create new question:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateNewQuestion}
          >
            שאלה חדשה
          </Button>
        </div>
        <QuestionLibraryPage />
      </Space>
    </div>
  );
} 