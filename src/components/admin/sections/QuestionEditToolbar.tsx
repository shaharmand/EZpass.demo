import React from 'react';
import { Space, Button, Tooltip } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { Question, PublicationStatusEnum, ReviewStatusEnum } from '../../../types/question';

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
`;

interface QuestionEditToolbarProps {
  question: Question & {
    publication_status: PublicationStatusEnum;
    review_status: ReviewStatusEnum;
  };
  isModified: boolean;
  onSave: () => void;
  onReviewStatusChange: () => void;
  onPublicationStatusChange: () => void;
  isDraft: boolean;
  isPendingReview: boolean;
  isApproved: boolean;
  children?: React.ReactNode;
}

export const QuestionEditToolbar: React.FC<QuestionEditToolbarProps> = ({
  isModified,
  onSave,
  onReviewStatusChange,
  onPublicationStatusChange,
  isDraft,
  isPendingReview,
  isApproved,
  children
}) => {
  return (
    <div>
      <ToolbarContainer>
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
            onClick={onReviewStatusChange}
            icon={isPendingReview ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          >
            {isPendingReview ? 'אשר שאלה' : 'העבר לבדיקה'}
          </Button>

          <Tooltip title={!isApproved ? 'לא ניתן לפרסם שאלה שלא אושרה' : ''}>
            <Button 
              type={isDraft ? 'primary' : 'default'}
              onClick={onPublicationStatusChange}
              disabled={!isApproved || (isDraft && isPendingReview)}
            >
              {isDraft ? 'פרסם שאלה' : 'העבר לטיוטה'}
            </Button>
          </Tooltip>
        </Space>
      </ToolbarContainer>
      {children}
    </div>
  );
}; 