import React, { useState, useEffect, FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Space, Typography, Button, message, Tag, Divider } from 'antd';
import { Question, QuestionStatus, DatabaseQuestion } from '../../../types/question';
import { ValidationResult, validateQuestion } from '../../../utils/questionValidator';
import { questionStorage } from '../../../services/admin/questionStorage';
import { questionLibrary } from '../../../services/questionLibrary';
import { 
  FileTextOutlined, 
  EditOutlined, 
  SolutionOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';
import { QuestionMetadataSection } from '../../../components/admin/sections/QuestionMetadataSection';
import { QuestionContentSection } from '../../../components/admin/sections/QuestionContentSection';
import { SolutionAndEvaluationSection } from '../../../components/admin/sections/SolutionAndEvaluationSection';
import { QuestionHeaderSection } from '../../../components/admin/sections/QuestionHeaderSection';
import { QuestionJsonData } from '../../../components/admin/QuestionJsonData';
import { QuestionImportInfo } from '../../../components/admin/QuestionImportInfo';
import styled from 'styled-components';

const { Title, Text } = Typography;

// Styled Components
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px 32px;
`;

const ValidationSection = styled.div`
  padding: 16px 24px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;
`;

const ValidationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 12px;
  padding: 8px;
  background: white;
  border-radius: 6px;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px;
  background: #fafafa;
  border-radius: 8px;
  
  > * {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
`;

const ContentSection = styled(Card)`
  margin-bottom: 0;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  
  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
    padding: 0 24px;
    min-height: 48px;
    background: #fafafa;
    border-radius: 8px 8px 0 0;
  }
  
  .ant-card-head-title {
    font-size: 16px;
    font-weight: 500;
  }
  
  .ant-card-body {
    padding: 24px;
    background: white;
  }
`;

const JsonSection = styled(ContentSection)`
  direction: ltr;
  text-align: left;
  opacity: 0.85;
  
  .ant-card-head {
    background: #f5f5f5;
  }
  
  .ant-card-body {
    background: #fafafa;
    font-family: monospace;
    font-size: 13px;
  }
`;

export const QuestionEditor: FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<DatabaseQuestion | null>(null);
  const [currentValidation, setCurrentValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [prevQuestionId, setPrevQuestionId] = useState<string | null>(null);
  const [nextQuestionId, setNextQuestionId] = useState<string | null>(null);
  const [listPosition, setListPosition] = useState<{
    currentIndex: number;
    totalQuestions: number;
  } | null>(null);

  // Run validation whenever question changes
  useEffect(() => {
    if (question) {
      const result = validateQuestion(question);
      setCurrentValidation(result);
    }
  }, [question]);

  useEffect(() => {
    const loadQuestion = async () => {
      if (id) {
        try {
          setLoading(true);
          const found = await questionStorage.getQuestion(id);
          if (found) {
            setQuestion(found);
            // Run validation immediately after setting the question
            const validationResult = validateQuestion(found);
            setCurrentValidation(validationResult);
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

  // Load list position from library
  useEffect(() => {
    const loadPosition = async () => {
      if (!id) return;
      
      try {
        const position = await questionLibrary.getCurrentPosition(id);
        if (position) {
          setListPosition({
            currentIndex: position.index,
            totalQuestions: position.total
          });
        }
      } catch (error) {
        console.error('Failed to load list position:', error);
      }
    };

    loadPosition();
  }, [id]);

  // Load adjacent questions from library
  useEffect(() => {
    const loadAdjacentQuestions = async () => {
      if (!id) return;
      
      try {
        const [prev, next] = await Promise.all([
          questionLibrary.getPreviousQuestion(id),
          questionLibrary.getNextQuestion(id)
        ]);
        
        setPrevQuestionId(prev?.id || null);
        setNextQuestionId(next?.id || null);
      } catch (error) {
        console.error('Failed to load adjacent questions:', error);
      }
    };

    loadAdjacentQuestions();
  }, [id]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async (updatedQuestion: Question | Partial<Question>) => {
    if (!question) return;
    
    try {
      const mergedQuestion = {
        ...question,
        ...updatedQuestion
      };
      
      await questionStorage.saveQuestion(mergedQuestion);
      message.success('Question saved successfully');
      setQuestion(mergedQuestion);
      setIsEditing(false);
      setIsModified(true);
      
      const validationResult = validateQuestion(mergedQuestion);
      setCurrentValidation(validationResult);
    } catch (error) {
      console.error('Failed to save question:', error);
      message.error('Failed to save question');
    }
  };

  const handleStatusChange = async (newStatus: QuestionStatus) => {
    if (!question) return;
    
    try {
      await questionStorage.updateQuestionStatus(question.id, newStatus);
      // Re-fetch the question to ensure we have the latest state
      const updatedQuestion = await questionStorage.getQuestion(question.id);
      if (updatedQuestion) {
        setQuestion(updatedQuestion);
      }
      message.success('Status updated successfully');
    } catch (error) {
      console.error('Failed to update status:', error);
      message.error('Failed to update status');
    }
  };

  const statusColors = {
    draft: 'orange',
    approved: 'green'
  };

  const statusLabels = {
    draft: 'טיוטה',
    approved: 'מאושר'
  };

  const handleHeaderSave = () => {
    if (question) {
      handleSave(question);
    }
  };

  const handlePrevious = () => {
    if (prevQuestionId) {
      navigate(`/admin/questions/${prevQuestionId}`);
    }
  };

  const handleNext = () => {
    if (nextQuestionId) {
      navigate(`/admin/questions/${nextQuestionId}`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!question) {
    return null;
  }

  const hasErrors = currentValidation?.errors.length ?? 0 > 0;
  const hasWarnings = currentValidation?.warnings.length ?? 0 > 0;

  return (
    <PageContainer>
      <QuestionHeaderSection
        question={question}
        onBack={() => navigate('/admin/questions')}
        onSave={handleHeaderSave}
        isModified={isModified}
        onPrevious={prevQuestionId ? handlePrevious : undefined}
        onNext={nextQuestionId ? handleNext : undefined}
        hasPrevious={!!prevQuestionId}
        hasNext={!!nextQuestionId}
        currentPosition={listPosition ? {
          current: listPosition.currentIndex + 1,
          total: listPosition.totalQuestions
        } : undefined}
        onQuestionChange={(updatedQuestion) => {
          handleStatusChange(updatedQuestion.status);
        }}
      />

      <ValidationSection>
        <Space align="center">
          <Text strong>סטטוס תיקוף:</Text>
          {hasErrors ? (
            <Tag color="error" icon={<CloseCircleOutlined />}>שגיאות</Tag>
          ) : hasWarnings ? (
            <Tag color="warning" icon={<WarningOutlined />}>אזהרות</Tag>
          ) : (
            <Tag color="success" icon={<CheckCircleOutlined />}>תקין</Tag>
          )}
        </Space>
        
        {(hasErrors || hasWarnings) && (
          <ValidationGrid>
            {currentValidation?.errors.map((error, index) => (
              <Tag key={`error-${index}`} color="error">
                {error.message}
              </Tag>
            ))}
            {currentValidation?.warnings.map((warning, index) => (
              <Tag key={`warning-${index}`} color="warning">
                {warning.message}
              </Tag>
            ))}
          </ValidationGrid>
        )}
      </ValidationSection>

      <MainContent>
        <QuestionMetadataSection
          question={question}
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
        />

        <QuestionContentSection
          question={question}
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
        />

        <SolutionAndEvaluationSection
          question={question}
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
        />

        {/* Add JSON Data Display with LTR direction */}
        <JsonSection>
          <QuestionJsonData question={question} />
        </JsonSection>
        <QuestionImportInfo importInfo={question?.import_info} />
      </MainContent>
    </PageContainer>
  );
}; 