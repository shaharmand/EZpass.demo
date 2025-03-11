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

const ActionButton = styled(Button)`
  &&& {
    min-width: 120px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 500;
    border-width: 2px;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.02);
    transition: all 0.2s;
    
    &:not(:disabled) {
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      
      &:active {
        transform: translateY(0);
        box-shadow: 0 2px 0 rgba(0, 0, 0, 0.02);
      }
    }
    
    &.publish-button {
      background-color: #ffffff;
      border-color: #d9d9d9;
      color: #8c8c8c;
      
      &:not(:disabled) {
        &:hover {
          background-color: #fafafa !important;
          border-color: #8c8c8c !important;
          color: #595959 !important;
        }
        
        &:active {
          background-color: #f0f0f0 !important;
          border-color: #595959 !important;
          color: #262626 !important;
        }
      }
      
      &:disabled {
        background-color: #f5f5f5;
        border-color: #d9d9d9;
        color: rgba(0, 0, 0, 0.25);
        box-shadow: none;
      }
    }

    &.review-button {
      background-color: #ffffff;
      border-color: #91caff;
      color: #1677ff;
      
      &:not(:disabled) {
        &:hover {
          background-color: #e6f4ff !important;
          border-color: #69b1ff !important;
          color: #0958d9 !important;
        }
        
        &:active {
          background-color: #bae0ff !important;
          border-color: #0958d9 !important;
          color: #003eb3 !important;
        }
      }
    }
  }
`;

interface QuestionEditToolbarProps {
  question: Question & {
    publication_status: PublicationStatusEnum;
    review_status: ReviewStatusEnum;
  };
  isModified?: boolean;
  onSave?: () => void;
  onReviewStatusChange?: () => void;
  onPublicationStatusChange?: () => void;
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
          {onSave && (
            <Button 
              type="primary"
              onClick={onSave}
              disabled={!isModified}
            >
              שמור שינויים
            </Button>
          )}

          <ActionButton 
            className="review-button"
            onClick={onReviewStatusChange}
            icon={isPendingReview ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          >
            {isPendingReview ? 'אשר שאלה' : 'העבר לבדיקה'}
          </ActionButton>

          <Tooltip title={!isApproved ? 'לא ניתן לפרסם שאלה שלא אושרה' : ''}>
            <ActionButton 
              className="publish-button"
              onClick={onPublicationStatusChange}
              disabled={!isApproved || (isDraft && isPendingReview)}
            >
              {isDraft ? 'פרסם שאלה' : 'העבר לטיוטה'}
            </ActionButton>
          </Tooltip>
        </Space>
      </ToolbarContainer>
      {children}
    </div>
  );
}; 