import React from 'react';
import { Space, Button, Tag, Typography, Tooltip, Row, Col, Alert } from 'antd';
import { LeftOutlined, RightOutlined, HomeOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { Question, PublicationStatusEnum, ReviewStatusEnum, REVIEW_STATUS_DESCRIPTIONS, ReviewMetadata } from '../../../types/question';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';
import 'dayjs/locale/he';
import { getSupabase } from '../../../lib/supabase';
import { notification } from 'antd';
import { QuestionEditToolbar } from './QuestionEditToolbar';

const { Text } = Typography;

const NavigationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
`;

const CompactTag = styled(Tag)`
  &&& {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    height: 24px;
    .anticon {
      margin-right: 0;
    }
  }
`;

const HeaderContainer = styled.div`
  border-bottom: 2px solid #e8e8e8;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  margin-bottom: 24px;
`;

interface StatusBarProps {
  $hasValidationIssues?: boolean;
}

const StatusBar = styled.div<StatusBarProps>`
  display: flex;
  align-items: stretch;
  padding: 12px 24px;
  background: #fff;
  border-bottom: ${props => props.$hasValidationIssues ? '1px solid #f0f0f0' : 'none'};
`;

const StatusColumn = styled(Col)`
  position: relative;
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    right: -12px;
    top: 50%;
    transform: translateY(-50%);
    height: 24px;
    width: 1px;
    background: #f0f0f0;
  }
`;

const CompactValidation = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  .success-icon {
    color: #52c41a;
    font-size: 16px;
  }
`;

interface ValidationBarProps {
  $type: 'error' | 'warning';
}

const ValidationBar = styled.div<ValidationBarProps>`
  display: flex;
  align-items: center;
  padding: 12px 24px;
  background: ${props => props.$type === 'error' ? '#fff2f0' : '#fffbe6'};
  border-bottom: 1px solid ${props => props.$type === 'error' ? '#ffccc7' : '#ffe58f'};
  gap: 12px;
`;

const ValidationContent = styled.div`
  flex: 1;
  .ant-alert {
    border: none;
    background: transparent;
    padding: 0;
    .ant-alert-message {
      color: inherit;
    }
    .ant-alert-description {
      color: inherit;
    }
  }
`;

const StatusItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 48px;

  .status-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #666;

    .label {
      font-weight: 500;
      color: #262626;
    }
  }
`;

const MetadataItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
  margin-right: 8px;
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
    validation_status?: 'valid' | 'warning' | 'error';
    validation_remarks?: string[];
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
    total: number;
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
  const isValidationError = question.validation_status === 'error';
  const isValidationWarning = question.validation_status === 'warning';
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Text strong style={{ fontSize: '16px' }}>עריכת שאלה</Text>
          <Tag color="blue">ID: {question.id}</Tag>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button 
            type="text"
            icon={<HomeOutlined />} 
            onClick={onBack}
          >
            חזרה לספרייה
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderRight: '1px solid #f0f0f0', paddingRight: '8px' }}>
            <Button
              type="text"
              icon={<RightOutlined />}
              disabled={!hasPrevious}
              onClick={onPrevious}
            />
            {currentPosition && (
              <Text style={{ minWidth: '60px', textAlign: 'center', fontSize: '14px', color: '#595959', padding: '0 8px', fontWeight: 500 }}>
                {currentPosition.current} / {currentPosition.total}
              </Text>
            )}
            <Button
              type="text"
              icon={<LeftOutlined />}
              disabled={!hasNext}
              onClick={onNext}
            />
          </div>
        </div>
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
      >
        <StatusBar $hasValidationIssues={hasValidationIssues}>
          <Row gutter={48} style={{ width: '100%', alignItems: 'stretch' }}>
            <StatusColumn span={8}>
              <StatusItem>
                <div className="status-header">
                  <span className="label">סטטוס פרסום:</span>
                  <CompactTag color={isDraft ? 'default' : 'success'}>
                    {isDraft ? 'טיוטה' : 'מפורסם'}
                  </CompactTag>
                </div>
                {question.publication_metadata?.publishedAt && (
                  <MetadataItem>
                    פורסם על ידי {question.publication_metadata.publishedBy} 
                    ב-{dayjs(question.publication_metadata.publishedAt).locale('he').format('DD/MM/YYYY HH:mm')}
                  </MetadataItem>
                )}
              </StatusItem>
            </StatusColumn>
            
            <StatusColumn span={8}>
              <StatusItem>
                <div className="status-header">
                  <span className="label">סטטוס בדיקה:</span>
                  <CompactTag color={isPendingReview ? 'warning' : 'success'}>
                    {REVIEW_STATUS_DESCRIPTIONS[question.review_status]}
                  </CompactTag>
                </div>
                {question.review_metadata?.reviewedAt && (
                  <MetadataItem>
                    נבדק על ידי {question.review_metadata.reviewedBy} 
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

            <StatusColumn span={8}>
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
          </Row>
        </StatusBar>

        {hasValidationIssues && (
          <ValidationBar $type={isValidationError ? 'error' : 'warning'}>
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
      </QuestionEditToolbar>
    </HeaderContainer>
  );
}; 