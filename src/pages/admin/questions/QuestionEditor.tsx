import React, { useState, useEffect, FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Space, Typography, Button, message, Tag, Divider, Tooltip } from 'antd';
import { 
  Question, 
  DatabaseQuestion,
  ValidationStatus,
  PublicationStatusEnum
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
      const mergedQuestion: DatabaseQuestion = {
        ...question,
        ...updatedQuestion,
        publication_status: question.publication_status,
        validation_status: currentValidation?.status || ValidationStatus.ERROR
      };
      
      await questionStorage.saveQuestion(mergedQuestion);
      message.success('Question saved successfully');
      setQuestion(mergedQuestion);
      setIsEditing(false);
      setIsModified(true);
    } catch (error) {
      console.error('Failed to save question:', error);
      message.error('Failed to save question');
    }
  };

  const handleStatusChange = async (newStatus: PublicationStatusEnum) => {
    if (!question) return;
    
    try {
      await questionStorage.updateQuestionStatus(question.id, newStatus);
      
      const updatedQuestion: DatabaseQuestion = {
        ...question,
        publication_status: newStatus,
        updated_at: new Date().toISOString()
      };

      await questionStorage.saveQuestion(updatedQuestion);
      setQuestion(updatedQuestion);
      message.success(`Question ${newStatus.toLowerCase()} successfully`);
      setIsModified(false);
    } catch (error) {
      console.error('Failed to update status:', error);
      message.error('Failed to update status');
    }
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

  const renderValidationStatus = () => {
    if (!currentValidation) return null;

    const { errors, warnings, status } = currentValidation;
    
    return (
      <ValidationSection>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Validation Status (Development)</Title>
            <Tag color={status === ValidationStatus.VALID ? 'green' : 
                      status === ValidationStatus.WARNING ? 'orange' : 'gold'}>
              {status === ValidationStatus.VALID ? 'Valid' : 
               status === ValidationStatus.WARNING ? 'Warning' : 'In Development'}
            </Tag>
          </div>
          {errors.map((error: ValidationError, idx: number) => (
            <ValidationMessage key={`error-${idx}`}>
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
              <Text>{error.message}</Text>
            </ValidationMessage>
          ))}
          {warnings.map((warning: ValidationWarning, idx: number) => (
            <ValidationMessage key={`warning-${idx}`}>
              <WarningOutlined style={{ color: '#faad14' }} />
              <Text>{warning.message}</Text>
            </ValidationMessage>
          ))}
        </Space>
      </ValidationSection>
    );
  };

  const renderActions = () => {
    if (!question) return null;

    const status = question.publication_status;

    return (
      <HeaderActions>
        <Button 
          onClick={handleHeaderSave}
          type="primary"
          icon={<SaveOutlined />}
          disabled={!isModified}
        >
          שמור
        </Button>
        {status === PublicationStatusEnum.DRAFT ? (
          <Tooltip title={currentValidation?.status === ValidationStatus.ERROR ? 
            'שים לב: חסרים שדות בשאלה (מותר בשלב הפיתוח)' : 
            'פרסם את השאלה'}>
            <Button 
              type="primary"
              className="publish-button"
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusChange(PublicationStatusEnum.PUBLISHED)}
            >
              פרסם
            </Button>
          </Tooltip>
        ) : (
          <Button
            danger
            icon={<EditOutlined />}
            onClick={() => handleStatusChange(PublicationStatusEnum.DRAFT)}
          >
            בטל פרסום
          </Button>
        )}
      </HeaderActions>
    );
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
      <Space direction="vertical" style={{ width: '100%' }}>
        <HeaderCard>
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {/* Page Title */}
            <Title level={4} style={{ margin: 0, marginBottom: '8px' }}>
              ממשק מנהל - עריכת שאלה
            </Title>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Left Side: Navigation + ID */}
              <Space size="large">
                <NavigationGroup>
                  <Button 
                    icon={<HomeOutlined />} 
                    onClick={() => navigate('/admin/questions')}
                  />
                  <Button 
                    icon={<RightOutlined />} 
                    onClick={handlePrevious}
                    disabled={!prevQuestionId}
                  />
                  <Button 
                    icon={<LeftOutlined />} 
                    onClick={handleNext}
                    disabled={!nextQuestionId}
                  />
                  {listPosition && (
                    <span style={{ 
                      padding: '0 12px',
                      borderRight: '1px solid #f0f0f0',
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      {listPosition.currentIndex + 1} / {listPosition.totalQuestions}
                    </span>
                  )}
                </NavigationGroup>

                <span style={{ 
                  color: '#1677ff', 
                  background: '#e6f4ff', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  border: '1px solid #91caff',
                  fontSize: '14px'
                }}>
                  ID: {question.id}
                </span>
              </Space>

              {/* Right Side: Actions */}
              <Space size="small">
                <Button 
                  onClick={handleHeaderSave}
                  type="primary"
                  icon={<SaveOutlined />}
                  disabled={!isModified}
                >
                  שמור
                </Button>
                {question.publication_status === PublicationStatusEnum.DRAFT ? (
                  <Tooltip title={currentValidation?.status === ValidationStatus.ERROR ? 
                    'שים לב: חסרים שדות בשאלה (מותר בשלב הפיתוח)' : 
                    'פרסם את השאלה'}>
                    <Button 
                      type="primary"
                      className="publish-button"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleStatusChange(PublicationStatusEnum.PUBLISHED)}
                    >
                      פרסם
                    </Button>
                  </Tooltip>
                ) : (
                  <Button
                    danger
                    icon={<EditOutlined />}
                    onClick={() => handleStatusChange(PublicationStatusEnum.DRAFT)}
                  >
                    בטל פרסום
                  </Button>
                )}
              </Space>
            </div>
          </Space>
        </HeaderCard>

        {renderValidationStatus()}

        <MainContent>
          <QuestionContentSection
            question={question}
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onSave={handleSave}
          />
          
          <QuestionMetadataSection
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

          <JsonSection title="Question JSON Data">
            <QuestionJsonData question={question} />
          </JsonSection>

          <JsonSection title="Import Info">
            <QuestionImportInfo importInfo={question?.import_info} />
          </JsonSection>
        </MainContent>
      </Space>
    </PageContainer>
  );
}; 