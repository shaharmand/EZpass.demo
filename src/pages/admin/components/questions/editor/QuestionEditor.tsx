import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { Question, QuestionType, QuestionAnswerFormat, EMPTY_EVALUATION_GUIDELINES } from '../../../../../types/question';
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

const getAnswerFormatForType = (type: QuestionType): QuestionAnswerFormat => {
  switch (type) {
    case QuestionType.MULTIPLE_CHOICE:
      return {
        type: 'multiple_choice',
        numOptions: 4,
        hasFinalAnswer: true,
        finalAnswerType: 'multiple_choice',
        requiresSolution: true
      };
    case QuestionType.NUMERICAL:
      return {
        type: 'numerical',
        hasFinalAnswer: true,
        finalAnswerType: 'numerical',
        requiresSolution: true,
        precision: 2, // Default 2 decimal places
        unit: undefined // Optional unit can be set later
      };
    case QuestionType.OPEN:
    default:
      return {
        type: 'open',
        hasFinalAnswer: false,
        finalAnswerType: 'none',
        requiresSolution: true,
        minWords: 0,
        maxWords: 1000
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
            answerFormat: {
              type: initialData.type,
              hasFinalAnswer: initialData.type === QuestionType.MULTIPLE_CHOICE,
              finalAnswerType: initialData.type === QuestionType.MULTIPLE_CHOICE ? 'multiple_choice' : 'none',
              requiresSolution: true,
              format: getAnswerFormatForType(initialData.type)
            }
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