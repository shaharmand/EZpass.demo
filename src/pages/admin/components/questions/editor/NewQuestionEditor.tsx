import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { QuestionEditorLayout } from '../../../../../components/question/editor/QuestionEditorLayout';
import { PropertiesPanel } from '../../../../../components/question/editor/layout/PropertiesPanel';
import { DatabaseQuestion, SaveQuestion } from '../../../../../types/question';

interface NewQuestionEditorProps {
  question: DatabaseQuestion;
  onSave: (data: SaveQuestion) => Promise<void>;
}

export const NewQuestionEditor: React.FC<NewQuestionEditorProps> = ({
  question,
  onSave
}) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(true);
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    console.log('NewQuestionEditor mounted', { question });
  }, [question]);

  const handleSave = async (data: SaveQuestion) => {
    try {
      await onSave(data);
      setIsModified(false);
      message.success('השאלה נשמרה בהצלחה');
    } catch (error) {
      message.error('שגיאה בשמירת השאלה');
    }
  };

  const handleCancel = () => {
    if (isModified) {
      // TODO: Add confirmation dialog
      setIsModified(false);
    }
    setIsEditing(false);
  };

  const handleBack = () => {
    navigate('/admin/questions');
  };

  const handlePropertyChange = () => {
    setIsModified(true);
  };

  console.log('NewQuestionEditor rendering', { 
    isEditing, 
    isModified,
    questionId: question.id 
  });

  return (
    <QuestionEditorLayout
      question={question}
      isEditing={isEditing}
      isModified={isModified}
      onSave={handleSave}
      onCancel={handleCancel}
      onBack={handleBack}
      sidebarContent={
        <PropertiesPanel
          type={question.data.metadata.type}
          topicId={question.data.metadata.topicId}
          subtopicId={question.data.metadata.subtopicId}
          difficulty={question.data.metadata.difficulty}
          estimatedTime={question.data.metadata.estimatedTime}
          source={question.data.metadata.source}
          subjectId={question.data.metadata.subjectId}
          domainId={question.data.metadata.domainId}
          isEditing={isEditing}
          onPropertyChange={handlePropertyChange}
        />
      }
    >
      <div style={{ padding: '20px' }}>
        <h2>New Question Editor</h2>
        <pre>{JSON.stringify(question, null, 2)}</pre>
      </div>
    </QuestionEditorLayout>
  );
}; 