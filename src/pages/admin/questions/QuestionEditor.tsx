import React, { useState, useEffect, FC, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Space, Typography, Button, message, Tag, Divider, Tooltip } from 'antd';
import { 
  Question, 
  DatabaseQuestion,
  ValidationStatus,
  PublicationStatusEnum,
  ReviewStatusEnum,
  SaveQuestion
} from '../../../types/question';
import { ValidationResult, ValidationError, ValidationWarning, validateQuestion } from '../../../utils/questionValidator';
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
  RightOutlined,
  HomeOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { QuestionMetadataSection } from '../../../components/admin/sections/QuestionMetadataSection';
import { QuestionContentSection } from '../../../components/admin/sections/QuestionContentSection';
import type { QuestionContentSectionHandle } from '../../../components/admin/sections/QuestionContentSection';
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
  padding: 0 16px 80px;
`;

const ValidationSection = styled.div`
  padding: 16px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const ValidationMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
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

const HeaderCard = styled(Card)`
  .ant-card-body {
    padding: 16px;
    background: #fff;
  }
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const NavigationGroup = styled(Space.Compact)`
  direction: rtl;
  .ant-btn {
    margin: 0;
  }
`;

const HeaderActions = styled(Space)`
  .ant-btn {
    min-width: 100px;
    height: 32px;
  }

  .publish-button.ant-btn-primary {
    background-color: #52c41a;
    
    &:hover {
      background-color: #73d13d !important;
    }
    
    &:active {
      background-color: #389e0d !important;
    }
  }
`;

const ActionButtons = styled(Space)`
  gap: 8px;
  
  .ant-btn {
    min-width: 90px;
  }
`;

const PageTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  .question-id {
    font-size: 14px;
    color: #1677ff;
    background: #e6f4ff;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid #91caff;
  }
  
  .position {
    color: #666;
    font-size: 14px;
    margin-left: 8px;
  }
`;

const EditActionBar = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  
  .action-bar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .unsaved-changes {
    color: #faad14;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    
    .anticon {
      font-size: 16px;
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;

    .ant-btn {
      min-width: 90px;
      height: 32px;
      
      &[type="primary"] {
        background: #1677ff;
        
        &:not(:disabled):hover {
          background: #4096ff;
        }
      }
    }
  }
`;

const EditableContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  padding: 16px;
  margin-bottom: 32px;
  
  > ${EditActionBar} {
    margin: 0 0 16px;
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
    filteredTotal: number;
  } | null>(null);
  const contentSectionRef = useRef<QuestionContentSectionHandle>(null);

  // Run validation whenever question changes
  useEffect(() => {
    if (question) {
      validateQuestion(question.data).then(result => {
        setCurrentValidation(result);
      });
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
            const validationResult = await validateQuestion(found.data);
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
            filteredTotal: position.filteredTotal
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

  const handleSave = async (updatedQuestion: SaveQuestion) => {
    try {
      await questionStorage.saveQuestion(updatedQuestion);
      
      // Add a small delay to ensure DB trigger has completed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force reload the question to get updated metadata from DB
      const updatedDatabaseQuestion = await questionStorage.getQuestion(updatedQuestion.id);
      if (!updatedDatabaseQuestion) {
        throw new Error('Failed to reload question after save');
      }

      setQuestion(updatedDatabaseQuestion);
      message.success('Question saved successfully');
      setIsEditing(false);
      setIsModified(false);
    } catch (error) {
      console.error('Failed to save question:', error);
      message.error('Failed to save question');
    }
  };

  const handleSimpleSave = async (updatedData?: SaveQuestion) => {
    if (!question) return;
    
    try {
      console.log('Parent handleSimpleSave called with:', updatedData);
      
      // Use the updated data from child component if provided, otherwise use current question
      const saveOperation = updatedData || {
        id: question.id,
        data: question.data,
        publication_status: question.publication_status,
        validation_status: question.validation_status,
        review_status: question.review_status
      };
      
      console.log('Parent calling questionStorage.saveQuestion with:', saveOperation);
      await questionStorage.saveQuestion(saveOperation);
      
      // Add a small delay to ensure DB trigger has completed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force reload the question to get updated metadata from DB
      const updatedQuestionData = await questionStorage.getQuestion(saveOperation.id);
      if (!updatedQuestionData) {
        throw new Error('Failed to reload question after save');
      }

      console.log('Parent received updated question data:', updatedQuestionData);
      setQuestion(updatedQuestionData);
      message.success('Question saved successfully');
      setIsEditing(false);
      setIsModified(false);
    } catch (error) {
      console.error('Failed to save question:', error);
      message.error('Failed to save question');
    }
  };

  const handleReviewStatusChange = async (updatedQuestion: Question & { 
    publication_status: PublicationStatusEnum;
    review_status: ReviewStatusEnum;
  }) => {
    if (!question) return;
    
    try {
      // Include data and all required fields for the save operation
      const saveQuestion: SaveQuestion = {
        id: question.id,
        data: question.data,
        publication_status: question.publication_status,
        validation_status: question.validation_status,
        review_status: updatedQuestion.review_status
      };
      
      await questionStorage.saveQuestion(saveQuestion);
      
      // Add a small delay to ensure DB trigger has completed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force reload the question to get updated metadata from DB
      const updatedQuestionData = await questionStorage.getQuestion(question.id);
      if (updatedQuestionData) {
        setQuestion(updatedQuestionData);
        message.success('Review status updated successfully');
        setIsModified(false);
      }
    } catch (error) {
      console.error('Failed to update review status:', error);
      message.error('Failed to update review status');
    }
  };

  const handlePublicationStatusChange = async (updatedQuestion: Question & { 
    publication_status: PublicationStatusEnum;
    review_status: ReviewStatusEnum;
  }) => {
    if (!question) return;
    
    try {
      // Include data and all required fields for the save operation
      const saveQuestion: SaveQuestion = {
        id: question.id,
        data: question.data,
        publication_status: updatedQuestion.publication_status,
        validation_status: question.validation_status,
        review_status: question.review_status
      };
      
      await questionStorage.saveQuestion(saveQuestion);
      
      // Add a small delay to ensure DB trigger has completed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force reload the question to get updated metadata from DB
      const updatedQuestionData = await questionStorage.getQuestion(question.id);
      if (updatedQuestionData) {
        setQuestion(updatedQuestionData);
        message.success('Publication status updated successfully');
        setIsModified(false);
      }
    } catch (error) {
      console.error('Failed to update publication status:', error);
      message.error('Failed to update publication status');
    }
  };

  const handleBack = () => {
    navigate('/admin/questions');
  };

  const handleModified = (modified: boolean) => {
    setIsModified(modified);
  };

  const handleCancel = () => {
    // Reload the original question data to revert all changes
    if (question) {
      // Force a re-render by creating a new question object
      const resetQuestion = { ...question };
      setQuestion(resetQuestion);
      setIsEditing(false);
      setIsModified(false);
      
      // Force child components to reset their state by temporarily unmounting them
      setIsEditing(false);
      setTimeout(() => {
        setQuestion(resetQuestion);
      }, 0);
    }
  };

  const handleSaveButtonClick = () => {
    contentSectionRef.current?.handleSimpleSave();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!question) {
    return null;
  }

  return (
    <PageContainer>
      <Space direction="vertical" style={{ width: '100%' }}>
        <QuestionHeaderSection
          question={{
            ...question.data,
            publication_status: question.publication_status,
            publication_metadata: question.publication_metadata,
            review_status: question.review_status,
            review_metadata: question.review_metadata || {
              reviewedAt: new Date().toISOString(),
              reviewedBy: '',
              comments: ''
            },
            validation_status: currentValidation?.status || question.validation_status,
            validation_remarks: currentValidation ? [
              ...currentValidation.errors.map(e => e.message),
              ...currentValidation.warnings.map(w => w.message)
            ] : [],
            update_metadata: question.update_metadata,
            created_at: question.created_at
          }}
          onBack={handleBack}
          onPrevious={prevQuestionId ? () => navigate(`/admin/questions/${prevQuestionId}`) : undefined}
          onNext={nextQuestionId ? () => navigate(`/admin/questions/${nextQuestionId}`) : undefined}
          hasPrevious={!!prevQuestionId}
          hasNext={!!nextQuestionId}
          currentPosition={listPosition ? {
            current: listPosition.currentIndex,
            filteredTotal: listPosition.filteredTotal
          } : undefined}
          onReviewStatusChange={handleReviewStatusChange}
          onPublicationStatusChange={handlePublicationStatusChange}
        />

        <EditableContent>
          <EditActionBar>
            <div className="action-bar-content">
              <div className="unsaved-changes">
                {isEditing ? (
                  isModified ? (
                    <>
                      <WarningOutlined />
                      <span>יש שינויים שלא נשמרו</span>
                    </>
                  ) : (
                    <span style={{ color: '#8c8c8c' }}>אין שינויים</span>
                  )
                ) : (
                  <span style={{ color: '#595959', fontSize: '14px' }}>
                    לחץ על שדה כדי לערוך
                  </span>
                )}
              </div>
              <div className="action-buttons">
                <Button 
                  onClick={handleCancel}
                  disabled={!isEditing || !isModified}
                >
                  בטל
                </Button>
                <Button 
                  type="primary"
                  onClick={handleSaveButtonClick}
                  disabled={!isEditing || !isModified}
                >
                  שמור שינויים
                </Button>
              </div>
            </div>
          </EditActionBar>

          <MainContent>
            <QuestionContentSection
              question={question}
              isEditing={isEditing}
              onEdit={() => setIsEditing(true)}
              onSave={handleSave}
              onModified={setIsModified}
              ref={contentSectionRef}
              data-section="content"
            />
            
            <QuestionMetadataSection
              question={question}
              isEditing={isEditing}
              onEdit={() => setIsEditing(true)}
              onSave={handleSave}
              onModified={setIsModified}
            />

            <SolutionAndEvaluationSection
              question={question}
              isEditing={isEditing}
              onEdit={() => setIsEditing(true)}
              onSave={handleSave}
              onModified={setIsModified}
            />
          </MainContent>
        </EditableContent>

        <JsonSection title="Question JSON Data">
          <QuestionJsonData question={question} />
        </JsonSection>

        <JsonSection title="Import Info">
          <QuestionImportInfo importInfo={question?.import_info} />
        </JsonSection>
      </Space>
    </PageContainer>
  );
}; 