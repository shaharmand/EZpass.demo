import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { Question, QuestionType, AnswerFormatRequirements, EMPTY_EVALUATION_GUIDELINES } from '../../../../../types/question';
import styled from 'styled-components';

const EditorContainer = styled.div`
  display: flex;
  height: 100%;
  padding: 24px;
`;

interface QuestionEditorProps {
  onSave: (data: Question) => Promise<void>;
}

interface NewQuestionState {
  subjectId: string;
  domainId: string;
  type: QuestionType;
}

const getAnswerFormatForType = (type: QuestionType): AnswerFormatRequirements => {
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE:
      return {
        hasFinalAnswer: true,
        finalAnswerType: 'multiple_choice',
        requiresSolution: true
      };
    case QuestionType.NUMERICAL:
      return {
        hasFinalAnswer: true,
        finalAnswerType: 'numerical',
        requiresSolution: true
      };
    case QuestionType.OPEN:
    default:
      return {
        hasFinalAnswer: false,
        finalAnswerType: 'none',
        requiresSolution: true
      };
  }
};

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ onSave }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load question data on mount if editing existing question
  React.useEffect(() => {
    const loadQuestion = async () => {
      if (id === 'new') {
        // Get the initial data passed from the wizard
        const initialData = location.state as NewQuestionState;
        if (!initialData) {
          message.error('חסרים נתונים ליצירת שאלה');
          navigate('/admin');
          return;
        }

        // Create new question with initial data
        const newQuestion: Question = {
          id: 'temp', // Will be replaced by backend
          content: {
            text: '',
            format: 'markdown'
          },
          metadata: {
            subjectId: initialData.subjectId,
            domainId: initialData.domainId,
            topicId: '', // Will be selected in editor
            type: initialData.type,
            difficulty: 1,
            answerFormat: getAnswerFormatForType(initialData.type)
          },
          schoolAnswer: {
            solution: {
              text: '',
              format: 'markdown'
            }
          },
          evaluationGuidelines: EMPTY_EVALUATION_GUIDELINES
        };
        
        setQuestion(newQuestion);
      } else {
        // TODO: Load existing question
        setIsLoading(true);
        try {
          // const data = await loadQuestionById(id);
          // setQuestion(data);
        } catch (error) {
          console.error('Failed to load question:', error);
          message.error('שגיאה בטעינת השאלה');
          navigate('/admin');
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadQuestion();
  }, [id, navigate, location]);

  const handlePropertyChange = (property: string, value: any) => {
    if (!question) return;

    setQuestion(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          [property]: value
        }
      };
    });
  };

  if (!question || isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <EditorContainer>
      <div>
        {/* TODO: Add editor UI components */}
        <h2>Question Editor</h2>
        <p>Subject: {question.metadata.subjectId}</p>
        <p>Domain: {question.metadata.domainId}</p>
        <p>Type: {question.metadata.type}</p>
      </div>
    </EditorContainer>
  );
}; 