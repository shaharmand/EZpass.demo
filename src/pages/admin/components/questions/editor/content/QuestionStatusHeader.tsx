import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Space, Button, Typography, Tag, Tooltip } from 'antd';
import { 
  HomeOutlined, 
  LeftOutlined, 
  RightOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Question, DatabaseQuestion, ValidationStatus, PublicationStatusEnum, ReviewStatusEnum } from '../../../../../../types/question';
import { QuestionStatusManager } from './QuestionStatusManager';
import { validateQuestion, ValidationResult, ValidationError, ValidationWarning } from '../../../../../../utils/questionValidator';

const { Text } = Typography;

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  margin-bottom: 16px;
  width: 100%;
  position: relative;
  z-index: 1;
  overflow: hidden;
`;

const NavigationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
`;

const NavigationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  .nav-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .counter {
    color: #262626;
    font-size: 14px;
    direction: ltr;
    display: inline-block;
    min-width: 80px;
    text-align: center;
    font-weight: 500;
  }
`;

const NavigationButton = styled(Button)`
  &.home-button {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #e6e6e6;
    padding: 4px 12px;
    color: #262626;
    background: white;
    height: 32px;
    
    &:hover {
      background: #e6f4ff;
      color: #1677ff;
      border-color: #1677ff;
    }

    .anticon {
      font-size: 16px;
    }
  }

  &:not(.home-button) {
    color: #1677ff;
    border-color: #1677ff;
    
    &:hover:not(:disabled) {
      color: #4096ff;
      border-color: #4096ff;
    }

    &:disabled {
      color: #d9d9d9;
      border-color: #d9d9d9;
    }
  }
`;

const StatusBar = styled.div<{ $hasValidationIssues: boolean; $isDraft: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 24px;
  background: ${props => {
    if (props.$hasValidationIssues) return '#fff2e8';
    if (props.$isDraft) return '#fffbe6';
    return '#f6ffed';
  }};
  border-bottom: 1px solid ${props => {
    if (props.$hasValidationIssues) return '#ffbb96';
    if (props.$isDraft) return '#ffe58f';
    return '#b7eb8f';
  }};
`;

const StatusActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-right: auto;
`;

const StatusInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const StatusBadge = styled.div<{ $type: 'error' | 'warning' | 'success' | 'info' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  position: relative;
  cursor: default;
  
  ${props => {
    switch (props.$type) {
      case 'error':
        return 'background: #fff2f0; color: #cf1322; border: 1px solid #ffa39e;';
      case 'warning':
        return 'background: #fffbe6; color: #d4b106; border: 1px solid #ffe58f;';
      case 'success':
        return 'background: #f6ffed; color: #389e0d; border: 1px solid #b7eb8f;';
      case 'info':
        return 'background: #e6f4ff; color: #1677ff; border: 1px solid #91caff;';
    }
  }}

  .metadata {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 4px;
    padding: 8px;
    font-size: 12px;
    color: #595959;
    white-space: nowrap;
    display: none;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  &:hover .metadata {
    display: block;
  }
`;

const ValidationPanel = styled.div<{ $isVisible: boolean }>`
  max-height: ${props => props.$isVisible ? '500px' : '0'};
  opacity: ${props => props.$isVisible ? '1' : '0'};
  transition: all 0.3s ease;
  overflow: hidden;
  background: #fff;
  border-bottom: ${props => props.$isVisible ? '1px solid #f0f0f0' : 'none'};
`;

const StatusRow = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 32px;
  padding: 16px 24px;
`;

const StatusColumn = styled.div`
  flex: 1;
  max-width: 280px;
  position: relative;
  background: #fafafa;
  border-radius: 4px;
  padding: 12px 16px;
`;

const StatusItem = styled.div`
  .status-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .label {
      color: #595959;
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
    }
  }

  .status-content {
    min-height: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`;

const MetadataItem = styled.div`
  color: #595959;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const CompactTag = styled(Tag)`
  margin: 0;
  font-size: 12px;
  line-height: 20px;
  height: 20px;
  padding: 0 8px;
  border-radius: 4px;
  
  &.update-status {
    background: #f5f5f5;
    border-color: #d9d9d9;
    color: #595959;
  }

  &.draft-status {
    background: #fff7e6;
    border-color: #ffd591;
    color: #d46b08;
  }

  &.published-status {
    background: #f6ffed;
    border-color: #b7eb8f;
    color: #389e0d;
  }

  &.pending-review {
    background: #e6f7ff;
    border-color: #91d5ff;
    color: #096dd9;
  }

  &.approved {
    background: #f6ffed;
    border-color: #b7eb8f;
    color: #389e0d;
  }

  &.has-errors {
    background: #fff1f0;
    border-color: #ffa39e;
    color: #cf1322;
  }

  &.has-warnings {
    background: #fffbe6;
    border-color: #ffe58f;
    color: #d4b106;
  }

  &.valid {
    background: #f6ffed;
    border-color: #b7eb8f;
    color: #389e0d;
  }
`;

const ActionButton = styled(Button)<{ $isPendingReview?: boolean; $isDraft?: boolean }>`
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  
  &.review-button {
    color: ${props => props.$isPendingReview ? '#52c41a' : '#1677ff'};
    border-color: ${props => props.$isPendingReview ? '#52c41a' : '#1677ff'};
    
    &:hover:not(:disabled) {
      color: ${props => props.$isPendingReview ? '#73d13d' : '#4096ff'};
      border-color: ${props => props.$isPendingReview ? '#73d13d' : '#4096ff'};
    }

    &:disabled {
      color: #d9d9d9 !important;
      border-color: #d9d9d9 !important;
      background: #f5f5f5 !important;
      cursor: not-allowed;
    }
  }
  
  &.publish-button {
    color: ${props => props.$isDraft ? '#52c41a' : '#1677ff'};
    border-color: ${props => props.$isDraft ? '#52c41a' : '#1677ff'};
    
    &:hover:not(:disabled) {
      color: ${props => props.$isDraft ? '#73d13d' : '#4096ff'};
      border-color: ${props => props.$isDraft ? '#73d13d' : '#4096ff'};
    }

    &:disabled {
      color: #d9d9d9 !important;
      border-color: #d9d9d9 !important;
      background: #f5f5f5 !important;
      cursor: not-allowed;
    }
  }
`;

const ValidationInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 24px;
`;

const ValidationSection = styled.div<{ $type: ValidationStatus }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: ${props => props.$type === ValidationStatus.ERROR ? '#fff2f0' : '#fffbe6'};
  border: 1px solid ${props => props.$type === ValidationStatus.ERROR ? '#ffccc7' : '#ffe58f'};
  border-radius: 4px;
`;

const ValidationItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #262626;
`;

const ValidationList = styled.ul<{ $type: ValidationStatus }>`
  margin: 0;
  padding: 0 16px;
  list-style-type: disc;

  li {
    margin: 4px 0;
    color: ${props => props.$type === ValidationStatus.ERROR ? '#cf1322' : '#d4b106'};
    font-size: 13px;
  }
`;

const REVIEW_STATUS_DESCRIPTIONS = {
  [ReviewStatusEnum.PENDING_REVIEW]: 'ממתין לבדיקה',
  [ReviewStatusEnum.APPROVED]: 'מאושר'
};

interface QuestionStatusHeaderProps {
  question: DatabaseQuestion;
  onBack: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentPosition?: {
    current: number;
    filteredTotal: number;
  };
  onQuestionUpdated: (updatedQuestion: DatabaseQuestion) => void;
  hasUnsavedChanges?: boolean;
}

export const QuestionStatusHeader: React.FC<QuestionStatusHeaderProps> = ({
  question,
  onBack,
  onPrevious,
  onNext,
  hasPrevious = true,
  hasNext = true,
  currentPosition = { current: 1, filteredTotal: 1 },
  onQuestionUpdated,
  hasUnsavedChanges = false
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult>({ 
    status: ValidationStatus.ERROR,
    errors: [], 
    warnings: [] 
  });
  
  const [showValidation, setShowValidation] = useState(false);
  
  useEffect(() => {
    const validateCurrentQuestion = async () => {
      const result = await validateQuestion(question.data);
      setValidationResult(result);
      if (result.errors.length > 0) {
        setShowValidation(true);
      }
    };
    validateCurrentQuestion();
  }, [question.data]);

  const hasErrors = validationResult.errors.length > 0;
  const hasWarnings = validationResult.warnings.length > 0;
  const hasValidationIssues = hasErrors || hasWarnings;
  const isApproved = question.review_status === ReviewStatusEnum.APPROVED;

  return (
    <QuestionStatusManager
      question={question}
      onQuestionUpdated={onQuestionUpdated}
      hasUnsavedChanges={hasUnsavedChanges}
    >
      {({ canPublish, canApprove, onApprove, onPublish, isPendingReview, isDraft }) => (
        <HeaderContainer>
          <NavigationBar>
            <NavigationButton className="home-button" icon={<HomeOutlined />} onClick={onBack}>
              חזרה לספרייה
            </NavigationButton>
            <NavigationControls>
              <div className="nav-group">
                <NavigationButton 
                  icon={<RightOutlined />} 
                  disabled={!hasPrevious}
                  onClick={onPrevious}
                />
                <Text className="counter">
                  {currentPosition.current} / {currentPosition.filteredTotal}
                </Text>
                <NavigationButton 
                  icon={<LeftOutlined />} 
                  disabled={!hasNext}
                  onClick={onNext}
                />
              </div>
            </NavigationControls>
          </NavigationBar>

          <StatusBar $hasValidationIssues={hasValidationIssues} $isDraft={isDraft}>
            <StatusInfo>
              {/* Review Status */}
              <StatusBadge $type={isPendingReview ? 'warning' : 'success'}>
                <span>{isPendingReview ? 'ממתין לבדיקה' : 'מאושר'}</span>
                {!isPendingReview && question.review_metadata?.reviewedAt && (
                  <div className="metadata">
                    נבדק על ידי {question.review_metadata.reviewedBy}{' '}
                    ב-{dayjs(question.review_metadata.reviewedAt).locale('he').format('DD/MM/YYYY HH:mm')}
                    {question.review_metadata?.comments && (
                      <Tooltip title={question.review_metadata.comments}>
                        <ExclamationCircleOutlined style={{ color: '#1677ff', marginRight: '4px' }} />
                      </Tooltip>
                    )}
                  </div>
                )}
              </StatusBadge>

              {/* Publication Status */}
              <StatusBadge $type={isDraft ? 'warning' : 'success'}>
                <span>{isDraft ? 'טיוטה' : 'מפורסם'}</span>
                {!isDraft && question.publication_metadata?.publishedAt && (
                  <div className="metadata">
                    פורסם על ידי {question.publication_metadata.publishedBy}{' '}
                    ב-{dayjs(question.publication_metadata.publishedAt).locale('he').format('DD/MM/YYYY HH:mm')}
                  </div>
                )}
              </StatusBadge>

              {/* Validation Status */}
              {hasValidationIssues ? (
                <Button 
                  type="text"
                  danger={hasErrors}
                  icon={hasErrors ? <ExclamationCircleOutlined /> : <WarningOutlined />}
                  onClick={() => setShowValidation(!showValidation)}
                >
                  {hasErrors ? `${validationResult.errors.length} שגיאות` : ''}
                  {hasErrors && hasWarnings ? ' | ' : ''}
                  {hasWarnings ? `${validationResult.warnings.length} אזהרות` : ''}
                </Button>
              ) : (
                <StatusBadge $type="success">
                  <CheckCircleOutlined />
                  <span>תקין</span>
                </StatusBadge>
              )}

              {/* Update Status */}
              <StatusBadge $type="info">
                <span>{question.update_metadata ? 'מעודכן' : 'לא נשמר'}</span>
                {question.update_metadata?.lastUpdatedAt && (
                  <div className="metadata">
                    עודכן על ידי {question.update_metadata.lastUpdatedBy}{' '}
                    ב-{dayjs(question.update_metadata.lastUpdatedAt).locale('he').format('DD/MM/YYYY HH:mm')}
                  </div>
                )}
              </StatusBadge>
            </StatusInfo>

            <StatusActions>
              {/* Review Action */}
              <Tooltip title={!canApprove && hasUnsavedChanges ? 'יש לשמור את השינויים תחילה' : ''}>
                <ActionButton 
                  className="review-button"
                  onClick={onApprove}
                  disabled={!canApprove}
                  icon={isPendingReview ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                  $isPendingReview={isPendingReview}
                >
                  {isPendingReview ? 'אישור' : 'העבר לבדיקה'}
                </ActionButton>
              </Tooltip>

              {/* Publish Action */}
              <Tooltip title={
                !canPublish ? (
                  hasUnsavedChanges ? 'יש לשמור את השינויים תחילה' :
                  !isApproved ? 'לא ניתן לפרסם שאלה שלא אושרה' : ''
                ) : ''
              }>
                <ActionButton
                  className="publish-button"
                  onClick={onPublish}
                  disabled={!canPublish}
                  icon={isDraft ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                  $isDraft={isDraft}
                >
                  {isDraft ? 'פרסום' : 'העבר לטיוטה'}
                </ActionButton>
              </Tooltip>
            </StatusActions>
          </StatusBar>

          <ValidationPanel $isVisible={showValidation && hasValidationIssues}>
            <ValidationInfo>
              {hasErrors && (
                <ValidationSection $type={ValidationStatus.ERROR}>
                  <ValidationItem>
                    <CompactTag color="error" icon={<ExclamationCircleOutlined />}>
                      שגיאות ({validationResult.errors.length})
                    </CompactTag>
                  </ValidationItem>
                  <ValidationList $type={ValidationStatus.ERROR}>
                    {validationResult.errors.map((error, index) => (
                      <li key={`error-${index}`}>{error.message}</li>
                    ))}
                  </ValidationList>
                </ValidationSection>
              )}
              
              {hasWarnings && (
                <ValidationSection $type={ValidationStatus.WARNING}>
                  <ValidationItem>
                    <CompactTag color="warning" icon={<WarningOutlined />}>
                      אזהרות ({validationResult.warnings.length})
                    </CompactTag>
                  </ValidationItem>
                  <ValidationList $type={ValidationStatus.WARNING}>
                    {validationResult.warnings.map((warning, index) => (
                      <li key={`warning-${index}`}>{warning.message}</li>
                    ))}
                  </ValidationList>
                </ValidationSection>
              )}
            </ValidationInfo>
          </ValidationPanel>
        </HeaderContainer>
      )}
    </QuestionStatusManager>
  );
}; 