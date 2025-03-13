import { Button, Space, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createEmptyQuestion, DatabaseQuestion, Question, QuestionType } from '../../../types/question';
import { questionStorage } from '../../../services/admin/questionStorage';
import { QuestionLibraryPage } from './QuestionLibraryPage';
import { QuestionInitializer } from '../components/questions/editor/content/SubjectDomainSelector';
import { useState } from 'react';

export default function QuestionsPage() {
  const navigate = useNavigate();
  const [isInitializerOpen, setIsInitializerOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedType, setSelectedType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);

  const handleCreateNewQuestion = async () => {
    try {
      // Create a new question template with the selected values
      const newQuestionTemplate = createEmptyQuestion();
      
      // Set the core identity fields
      newQuestionTemplate.data.metadata.subjectId = selectedSubject;
      newQuestionTemplate.data.metadata.domainId = selectedDomain;
      newQuestionTemplate.data.metadata.type = selectedType;
      
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

      // Close the modal
      setIsInitializerOpen(false);

      // Redirect to the edit page for the new question
      if (savedQuestion?.id) {
        navigate(`/admin/questions/${savedQuestion.id}`);
      }
    } catch (error) {
      console.error('Failed to create new question:', error);
      // You might want to show an error message to the user here
    }
  };

  const showInitializer = () => {
    setIsInitializerOpen(true);
  };

  const handleCancel = () => {
    setIsInitializerOpen(false);
    // Reset selections
    setSelectedSubject('');
    setSelectedDomain('');
    setSelectedType(QuestionType.MULTIPLE_CHOICE);
  };

  const handleTypeChange = (type: QuestionType) => {
    setSelectedType(type);
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={showInitializer}
          >
            שאלה חדשה
          </Button>
        </div>
        <QuestionLibraryPage />
      </Space>

      <Modal
        title="יצירת שאלה חדשה"
        open={isInitializerOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <QuestionInitializer
          onSubjectChange={setSelectedSubject}
          onDomainChange={setSelectedDomain}
          onTypeChange={handleTypeChange}
          onInitialSave={handleCreateNewQuestion}
          initialSubject={selectedSubject}
          initialDomain={selectedDomain}
          initialType={selectedType}
          isNewQuestion={true}
        />
      </Modal>
    </div>
  );
} 