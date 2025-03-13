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

const StatusBar = styled.div<{ $hasValidationIssues: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: #fff;
  border-top: 1px solid ${props => props.$hasValidationIssues ? '#faad14' : '#f0f0f0'};
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
  
  useEffect(() => {
    const validateCurrentQuestion = async () => {
      const result = await validateQuestion(question.data);
      setValidationResult(result);
    };
    validateCurrentQuestion();
  }, [question.data]);

  const hasErrors = validationResult.errors.length > 0;
  const hasWarnings = validationResult.warnings.length > 0;
  const hasValidationIssues = hasErrors || hasWarnings;

  return (
    <QuestionStatusManager
      question={question}
      onQuestionUpdated={onQuestionUpdated}
      hasUnsavedChanges={hasUnsavedChanges}
    >
      {({ canPublish, canApprove, onApprove, onPublish, isPendingReview, isDraft }: {
        canPublish: boolean;
        canApprove: boolean;
        onApprove: () => Promise<void>;
        onPublish: () => Promise<void>;
        isPendingReview: boolean;
        isDraft: boolean;
      }): React.ReactElement => {
        return (
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

            <StatusBar $hasValidationIssues={hasValidationIssues}>
              <StatusRow>
                <StatusColumn>
                  <StatusItem>
                    <div className="status-header">
                      <span className="label">סטטוס סקירה:</span>
                      <CompactTag color={isPendingReview ? 'warning' : 'success'}>
                        {isPendingReview ? 'ממתין לבדיקה' : 'מאושר'}
                      </CompactTag>
                      <ActionButton 
                        className="review-button"
                        onClick={onApprove}
                        disabled={!canApprove}
                        icon={isPendingReview ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                        $isPendingReview={isPendingReview}
                      >
                        {isPendingReview ? 'אישור' : 'העבר לבדיקה'}
                      </ActionButton>
                    </div>
                    <div className="status-content">
                      {!isPendingReview && question.review_metadata?.reviewedAt && (
                        <MetadataItem>
                          נבדק על ידי {question.review_metadata.reviewedBy}{' '}
                          ב-{dayjs(question.review_metadata.reviewedAt).locale('he').format('DD/MM/YYYY HH:mm')}
                          {question.review_metadata?.comments && (
                            <Tooltip title={question.review_metadata.comments}>
                              <ExclamationCircleOutlined style={{ color: '#1677ff' }} />
                            </Tooltip>
                          )}
                        </MetadataItem>
                      )}
                    </div>
                  </StatusItem>
                </StatusColumn>

                <StatusColumn>
                  <StatusItem>
                    <div className="status-header">
                      <span className="label">סטטוס פרסום:</span>
                      <CompactTag color={isDraft ? 'warning' : 'success'}>
                        {isDraft ? 'טיוטה' : 'מפורסם'}
                      </CompactTag>
                      <ActionButton
                        className="publish-button"
                        onClick={onPublish}
                        disabled={!canPublish}
                        icon={isDraft ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                        $isDraft={isDraft}
                      >
                        {isDraft ? 'פרסום' : 'העבר לטיוטה'}
                      </ActionButton>
                    </div>
                    <div className="status-content">
                      {!isDraft && question.publication_metadata?.publishedAt && (
                        <MetadataItem>
                          פורסם על ידי {question.publication_metadata.publishedBy}{' '}
                          ב-{dayjs(question.publication_metadata.publishedAt).locale('he').format('DD/MM/YYYY HH:mm')}
                        </MetadataItem>
                      )}
                    </div>
                  </StatusItem>
                </StatusColumn>

                <StatusColumn>
                  <StatusItem>
                    <div className="status-header">
                      <span className="label">סטטוס אימות:</span>
                      {hasValidationIssues ? (
                        <Space>
                          {hasErrors && (
                            <CompactTag 
                              color="error"
                              icon={<ExclamationCircleOutlined />}
                            >
                              {validationResult.errors.length} שגיאות
                            </CompactTag>
                          )}
                          {hasWarnings && (
                            <CompactTag 
                              color="warning"
                              icon={<WarningOutlined />}
                            >
                              {validationResult.warnings.length} אזהרות
                            </CompactTag>
                          )}
                        </Space>
                      ) : (
                        <CompactTag 
                          color="success"
                          icon={<CheckCircleOutlined />}
                        >
                          תקין
                        </CompactTag>
                      )}
                    </div>
                    <div className="status-content">
                      {hasValidationIssues && (
                        <MetadataItem>
                          יש לתקן את השגיאות לפני המשך העריכה
                        </MetadataItem>
                      )}
                    </div>
                  </StatusItem>
                </StatusColumn>

                <StatusColumn>
                  <StatusItem>
                    <div className="status-header">
                      <span className="label">סטטוס עדכון:</span>
                      <CompactTag color="default" className="update-status">
                        {question.update_metadata ? 'מעודכן' : 'לא נשמר'}
                      </CompactTag>
                    </div>
                    <div className="status-content">
                      {question.update_metadata?.lastUpdatedAt && (
                        <MetadataItem>
                          עודכן על ידי {question.update_metadata.lastUpdatedBy}{' '}
                          ב-{dayjs(question.update_metadata.lastUpdatedAt).locale('he').format('DD/MM/YYYY HH:mm')}
                        </MetadataItem>
                      )}
                    </div>
                  </StatusItem>
                </StatusColumn>
              </StatusRow>
            </StatusBar>

            {hasValidationIssues && (
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
            )}
          </HeaderContainer>
        );
      }}
    </QuestionStatusManager>
  );
}; 