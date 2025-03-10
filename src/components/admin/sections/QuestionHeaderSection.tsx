import React from 'react';
import { Space, Button, Tag, Typography, Tooltip, Row, Col, Alert } from 'antd';
import { LeftOutlined, RightOutlined, HomeOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { 
  Question, 
  PublicationStatusEnum, 
  ReviewStatusEnum, 
  REVIEW_STATUS_DESCRIPTIONS, 
  ReviewMetadata,
  ValidationStatus 
} from '../../../types/question';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';
import 'dayjs/locale/he';
import { getSupabase } from '../../../lib/supabase';
import { notification } from 'antd';
import { universalTopicsV2 } from '../../../services/universalTopics';
import { getEnumTranslation } from '../../../utils/translations';

const { Text } = Typography;

const NavigationGroup = styled(Space.Compact)`
  direction: rtl;
  .ant-btn {
    margin: 0;
  }
`;

const NavigationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
`;

const NavigationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  
  .nav-group {
    display: inline-flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 8px;
    padding: 2px;
    
    .ant-btn {
      min-width: 32px;
      height: 32px;
      padding: 0;
      border: none;
      
      &:hover {
        background: #e6e6e6;
      }
      
      &:disabled {
        background: transparent;
        opacity: 0.5;
      }
    }

    .counter {
      padding: 0 12px;
      font-weight: 500;
      color: #262626;
    }
  }

  .home-button {
    color: #595959;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &:hover {
      color: #1677ff;
    }
  }
`;

const QuestionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .question-id {
    color: #1677ff;
    background: #e6f4ff;
    padding: 6px 12px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 14px;
    border: none;
    box-shadow: 0 0 0 1px #91caff;
  }

  .metadata-tag {
    font-size: 14px;
    color: #434343;
    background: #fafafa;
    padding: 6px 12px;
    border-radius: 8px;
    font-weight: 500;
    border: none;
    box-shadow: 0 0 0 1px #d9d9d9;
    
    &:hover {
      background: #f5f5f5;
    }
  }
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;

  .title {
    font-size: 16px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
  }

  .core-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .question-id {
    font-size: 14px;
    color: #1677ff;
    background: #e6f4ff;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid #91caff;
  }

  .metadata-tag {
    font-size: 14px;
    color: #666;
    background: #f5f5f5;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid #d9d9d9;
  }
`;

const CompactTag = styled(Tag)`
  &&& {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    height: 24px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
    border: none;
    background: ${props => props.color === 'success' ? '#f6ffed' : 
      props.color === 'warning' ? '#fffbe6' : 
      props.color === 'error' ? '#fff2f0' : '#f5f5f5'};
    color: ${props => props.color === 'success' ? '#52c41a' : 
      props.color === 'warning' ? '#faad14' : 
      props.color === 'error' ? '#ff4d4f' : '#595959'};
    box-shadow: 0 0 0 1px ${props => props.color === 'success' ? '#b7eb8f' : 
      props.color === 'warning' ? '#ffe58f' : 
      props.color === 'error' ? '#ffccc7' : '#d9d9d9'};
      
    .anticon {
      font-size: 14px;
    }

    &:hover {
      opacity: 0.85;
    }
  }
`;

const HeaderContainer = styled.div`
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
`;

interface StatusBarProps {
  $hasValidationIssues?: boolean;
}

const StatusBar = styled.div<StatusBarProps>`
  display: flex;
  align-items: stretch;
  padding: 12px 24px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
`;

const StatusColumn = styled(Col)`
  position: relative;
  padding: 0 20px;
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 24px;
    width: 1px;
    background: #e8e8e8;
  }
`;

const StatusItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  .status-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;

    .label {
      font-weight: 500;
      color: #595959;
    }
  }
`;

const MetadataItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #8c8c8c;

  .anticon {
    font-size: 14px;
  }
`;

interface ValidationBarProps {
  $type: Extract<ValidationStatus, 'error' | 'warning'>;
}

const ValidationBar = styled.div<ValidationBarProps>`
  display: flex;
  align-items: flex-start;
  padding: 12px 24px;
  background: ${props => props.$type === ValidationStatus.ERROR ? '#fff2f0' : '#fffbe6'};
  border-top: 1px solid ${props => props.$type === ValidationStatus.ERROR ? '#ffccc7' : '#ffe58f'};
  gap: 12px;

  .anticon {
    margin-top: 2px;
    font-size: 16px;
  }
`;

const ValidationContent = styled.div`
  flex: 1;
  .ant-alert {
    border: none;
    background: transparent;
    padding: 0;
    .ant-alert-message {
      color: inherit;
      font-size: 14px;
    }
    .ant-alert-description {
      color: inherit;
      font-size: 13px;
      
      ul {
        margin: 4px 0 0;
        padding: 0 16px;
      }
    }
  }
`;

const CompactValidation = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  
  .success-icon {
    color: #52c41a;
    font-size: 14px;
  }

  .ant-typography {
    font-size: 13px;
  }
`;

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;

  .ant-space {
    gap: 16px !important;
  }

  .ant-btn {
    height: 32px;
    border-radius: 6px;
    
    &:not(.ant-btn-primary) {
      border-color: #d9d9d9;
      
      &:hover {
        border-color: #1677ff;
        color: #1677ff;
      }
    }
  }

  .divider {
    width: 1px;
    height: 24px;
    background: #e8e8e8;
    margin: 0 8px;
  }
`;

interface QuestionHeaderSectionProps {
  question: Question & { 
    publication_status: PublicationStatusEnum;
    publication_metadata: {
      publishedAt?: string;
      publishedBy?: string;
      archivedAt?: string;
      archivedBy?: string;
      reason?: string;
    };
    review_status: ReviewStatusEnum;
    review_metadata: ReviewMetadata;
    validation_status?: ValidationStatus;
    validation_remarks?: string[];
    update_metadata?: {
      lastUpdatedAt: string;
      lastUpdatedBy: string;
    };
    created_at: string;
  };
  onBack: () => void;
  onSave: () => void;
  isModified?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentPosition?: {
    current: number;
    filteredTotal: number;
  };
  onReviewStatusChange?: (updatedQuestion: Question & { 
    publication_status: PublicationStatusEnum;
    review_status: ReviewStatusEnum;
  }) => void;
  onPublicationStatusChange?: (updatedQuestion: Question & { 
    publication_status: PublicationStatusEnum;
    review_status: ReviewStatusEnum;
  }) => void;
}

interface QuestionEditToolbarProps {
  question: Question & { 
    publication_status: PublicationStatusEnum;
    review_status: ReviewStatusEnum;
  };
  isModified?: boolean;
  onSave: () => void;
  onReviewStatusChange?: () => void;
  onPublicationStatusChange?: () => void;
  isDraft: boolean;
  isPendingReview: boolean;
  isApproved: boolean;
}

const QuestionEditToolbar = ({
  question,
  isModified,
  onSave,
  onReviewStatusChange,
  onPublicationStatusChange,
  isDraft,
  isPendingReview,
  isApproved,
}: QuestionEditToolbarProps) => {
  return (
    <ToolbarContainer>
      <Space>
        <Button 
          type="primary"
          onClick={onSave}
          disabled={!isModified}
        >
          שמירה
        </Button>
        <span className="divider" />
        <Button
          onClick={onPublicationStatusChange}
          icon={isDraft ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
        >
          {isDraft ? 'פרסום' : 'העבר לטיוטה'}
        </Button>
        <Button
          onClick={onReviewStatusChange}
          icon={isPendingReview ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
        >
          {isPendingReview ? 'אישור' : 'העבר לבדיקה'}
        </Button>
      </Space>
    </ToolbarContainer>
  );
};

export const QuestionHeaderSection: React.FC<QuestionHeaderSectionProps> = ({
  question,
  onBack,
  onSave,
  isModified = false,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  currentPosition,
  onReviewStatusChange,
  onPublicationStatusChange,
}) => {
  const { user } = useAuth();
  const isDraft = question.publication_status === PublicationStatusEnum.DRAFT;
  const isPendingReview = question.review_status === ReviewStatusEnum.PENDING_REVIEW;
  const isApproved = question.review_status === ReviewStatusEnum.APPROVED;

  const remarks = question.validation_remarks || [];
  const hasRemarks = remarks.length > 0;
  const isValidationError = question.validation_status === ValidationStatus.ERROR;
  const isValidationWarning = question.validation_status === ValidationStatus.WARNING;
  const hasValidationIssues = (isValidationError || isValidationWarning) && hasRemarks;

  const handleReviewStatusChange = async () => {
    if (!onReviewStatusChange || !user) return;
    
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Supabase client not initialized');

      // Get current user's profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .single();

      // If pending review, approve it. If approved, move back to pending review
      const newStatus = isPendingReview ? ReviewStatusEnum.APPROVED : ReviewStatusEnum.PENDING_REVIEW;
      
      await onReviewStatusChange({
        ...question,
        review_status: newStatus
      });

      notification.success({
        message: 'סטטוס עודכן בהצלחה',
        description: `השאלה ${newStatus === ReviewStatusEnum.APPROVED ? 'אושרה' : 'הועברה לבדיקה'}`
      });
    } catch (error) {
      console.error('Failed to update review status:', error);
      notification.error({
        message: 'שגיאה בעדכון סטטוס',
        description: 'אנא נסה שוב'
      });
    }
  };

  const handlePublicationStatusChange = () => {
    if (!onPublicationStatusChange || !user) return;
    
    // Toggle between draft and published
    onPublicationStatusChange({
      ...question,
      publication_status: isDraft ? PublicationStatusEnum.PUBLISHED : PublicationStatusEnum.DRAFT
    });
  };

  return (
    <HeaderContainer>
      <NavigationBar>
        <QuestionInfo>
          <Text className="question-id">ID: {question.id}</Text>
          <Text className="metadata-tag">
            נוצר ב-{dayjs(question.created_at).locale('he').format('DD/MM/YYYY')}
          </Text>
          {question.metadata?.domainId && (
            <span className="metadata-tag">
              {universalTopicsV2.getDomainSafe(question.metadata.subjectId || '', question.metadata.domainId)?.name || question.metadata.domainId}
            </span>
          )}
          {question.metadata?.subjectId && (
            <span className="metadata-tag">
              {universalTopicsV2.getSubjectSafe(question.metadata.subjectId)?.name || question.metadata.subjectId}
            </span>
          )}
        </QuestionInfo>
        <NavigationControls>
          <Button className="home-button" icon={<HomeOutlined />} onClick={onBack}>
            חזרה לספרייה
          </Button>
          <div className="nav-group">
            <Button 
              icon={<RightOutlined />} 
              disabled={!hasPrevious}
              onClick={onPrevious}
            />
            <Text className="counter">
              {currentPosition?.filteredTotal || 0} / {currentPosition?.current || 1}
            </Text>
            <Button 
              icon={<LeftOutlined />} 
              disabled={!hasNext}
              onClick={onNext}
            />
          </div>
        </NavigationControls>
      </NavigationBar>

      <QuestionEditToolbar
        question={question}
        isModified={isModified}
        onSave={onSave}
        onReviewStatusChange={handleReviewStatusChange}
        onPublicationStatusChange={handlePublicationStatusChange}
        isDraft={isDraft}
        isPendingReview={isPendingReview}
        isApproved={isApproved}
      />

      <StatusBar $hasValidationIssues={hasValidationIssues}>
        <Row gutter={48} style={{ width: '100%', alignItems: 'stretch' }}>
          <StatusColumn span={6}>
            <StatusItem>
              <div className="status-header">
                <span className="label">סטטוס פרסום:</span>
                <CompactTag color={isDraft ? 'default' : 'success'}>
                  {isDraft ? 'טיוטה' : 'מפורסם'}
                </CompactTag>
              </div>
              {!isDraft && question.publication_metadata?.publishedAt && (
                <MetadataItem>
                  פורסם על ידי {question.publication_metadata.publishedBy}{' '}
                  ב-{dayjs(question.publication_metadata.publishedAt).locale('he').format('DD/MM/YYYY HH:mm')}
                </MetadataItem>
              )}
            </StatusItem>
          </StatusColumn>
          
          <StatusColumn span={6}>
            <StatusItem>
              <div className="status-header">
                <span className="label">סטטוס בדיקה:</span>
                <CompactTag color={isPendingReview ? 'warning' : 'success'}>
                  {REVIEW_STATUS_DESCRIPTIONS[question.review_status]}
                </CompactTag>
              </div>
              {isApproved && question.review_metadata?.reviewedAt && (
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
            </StatusItem>
          </StatusColumn>

          <StatusColumn span={6}>
            <StatusItem>
              <div className="status-header">
                <span className="label">סטטוס אימות:</span>
                {isValidationError || isValidationWarning ? (
                  <CompactTag 
                    color={isValidationError ? 'error' : 'warning'}
                    icon={isValidationError ? 
                      <ExclamationCircleOutlined /> : 
                      <WarningOutlined />}
                  >
                    {remarks.length} {isValidationError ? 'שגיאות' : 'אזהרות'}
                  </CompactTag>
                ) : (
                  <CompactValidation>
                    <CheckCircleOutlined className="success-icon" />
                    <Text type="success">תקין</Text>
                  </CompactValidation>
                )}
              </div>
              {hasValidationIssues && (
                <MetadataItem>
                  יש לתקן את השגיאות לפני המשך העריכה
                </MetadataItem>
              )}
            </StatusItem>
          </StatusColumn>

          <StatusColumn span={6}>
            <StatusItem>
              <div className="status-header">
                <span className="label">סטטוס עדכון:</span>
                <CompactTag color={question.update_metadata?.lastUpdatedBy && 
                                 question.update_metadata?.lastUpdatedAt && 
                                 dayjs(question.update_metadata.lastUpdatedAt).isValid() ? 'success' : 'default'}>
                  {question.update_metadata?.lastUpdatedBy && 
                   question.update_metadata?.lastUpdatedAt && 
                   dayjs(question.update_metadata.lastUpdatedAt).isValid() ? 'עודכן' : 'לא עודכן'}
                </CompactTag>
              </div>
              {question.update_metadata?.lastUpdatedBy && 
               question.update_metadata?.lastUpdatedAt && 
               dayjs(question.update_metadata.lastUpdatedAt).isValid() && (
                <MetadataItem>
                  עודכן על ידי {question.update_metadata.lastUpdatedBy}{' '}
                  ב-{dayjs(question.update_metadata.lastUpdatedAt).locale('he').format('DD/MM/YYYY HH:mm')}
                </MetadataItem>
              )}
            </StatusItem>
          </StatusColumn>
        </Row>
      </StatusBar>

      {hasValidationIssues && (
        <ValidationBar $type={isValidationError ? ValidationStatus.ERROR : ValidationStatus.WARNING}>
          {isValidationError ? (
            <ExclamationCircleOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />
          ) : (
            <WarningOutlined style={{ fontSize: '20px', color: '#faad14' }} />
          )}
          <ValidationContent>
            <Alert
              type={isValidationError ? 'error' : 'warning'}
              message={
                <Text strong>
                  נמצאו {remarks.length} {isValidationError ? 'שגיאות' : 'אזהרות'}:
                </Text>
              }
              description={
                <ul style={{ margin: '4px 0 0', padding: '0 16px' }}>
                  {remarks.map((remark, index) => (
                    <li key={index}>{remark}</li>
                  ))}
                </ul>
              }
              showIcon={false}
            />
          </ValidationContent>
        </ValidationBar>
      )}
    </HeaderContainer>
  );
}; 