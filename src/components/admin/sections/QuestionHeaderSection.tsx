import React from 'react';
import { Space, Button, Tag, Typography, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, HomeOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { Question, PublicationStatusEnum, ReviewStatusEnum, REVIEW_STATUS_DESCRIPTIONS, ReviewMetadata } from '../../../types/question';
import { useAuth } from '../../../contexts/AuthContext';
import dayjs from 'dayjs';
import 'dayjs/locale/he';
import { getSupabase } from '../../../lib/supabase';
import { notification } from 'antd';
import { BaseHeader } from '../../base/BaseHeader';

const { Text } = Typography;

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

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 24px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  gap: 24px;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;

  .label {
    font-weight: 500;
    color: #262626;
  }
`;

interface QuestionHeaderSectionProps {
  question: Question & { 
    publication_status: PublicationStatusEnum;
    review_status: ReviewStatusEnum;
    review_metadata: ReviewMetadata;
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

  const centerContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <div style={{ fontSize: '18px', fontWeight: 500, color: '#262626', display: 'flex', alignItems: 'center', gap: '12px' }}>
        ממשק מנהל - עריכת שאלה
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal', fontSize: '14px' }}>
          <span style={{ background: '#e6f4ff', border: '1px solid #91caff', color: '#1677ff', padding: '4px 8px', borderRadius: '6px', fontWeight: 500 }}>
            ID: {question.id}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #e6e6e6', padding: '4px', borderRadius: '8px', height: '40px' }}>
        <Button 
          type="text"
          icon={<HomeOutlined />} 
          onClick={onBack}
        >
          חזרה לספרייה
        </Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid #f0f0f0', paddingLeft: '8px', marginLeft: '8px' }}>
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
    </div>
  );

  const rightContent = (
    <Space>
      <Button 
        type="primary"
        onClick={onSave}
        disabled={!isModified}
      >
        שמור שינויים
      </Button>

      <Button 
        type={isPendingReview ? 'default' : 'primary'}
        onClick={handleReviewStatusChange}
        icon={isPendingReview ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
        style={{ marginRight: '8px' }}
      >
        {isPendingReview ? 'אשר שאלה' : 'העבר לבדיקה'}
      </Button>

      <Tooltip title={!isApproved ? 'לא ניתן לפרסם שאלה שלא אושרה' : ''}>
        <Button 
          type={isDraft ? 'primary' : 'default'}
          onClick={handlePublicationStatusChange}
          disabled={!isApproved || (isDraft && isPendingReview)}
          style={{ marginRight: 8 }}
        >
          {isDraft ? 'פרסם שאלה' : 'העבר לטיוטה'}
        </Button>
      </Tooltip>
    </Space>
  );

  return (
    <BaseHeader
      centerContent={centerContent}
      rightContent={rightContent}
    >
      <StatusBar>
        <StatusItem>
          <span className="label">סטטוס פרסום:</span>
          <CompactTag color={isDraft ? 'default' : 'success'}>
            {isDraft ? 'טיוטה' : 'מפורסם'}
          </CompactTag>
        </StatusItem>

        <StatusItem>
          <span className="label">סטטוס בדיקה:</span>
          <CompactTag color={isPendingReview ? 'warning' : 'success'}>
            {REVIEW_STATUS_DESCRIPTIONS[question.review_status]} ({isPendingReview ? 'ממתין לבדיקה' : 'מאושר'})
          </CompactTag>
          {question.review_metadata?.reviewedAt && (
            <Text type="secondary" style={{ marginRight: 8 }}>
              נבדק על ידי {question.review_metadata.reviewedBy} ב-{dayjs(question.review_metadata.reviewedAt).locale('he').format('DD/MM/YYYY HH:mm')}
            </Text>
          )}
          {question.review_metadata?.comments && (
            <Text type="secondary">
              הערה: {question.review_metadata.comments}
            </Text>
          )}
        </StatusItem>
      </StatusBar>
    </BaseHeader>
  );
}; 