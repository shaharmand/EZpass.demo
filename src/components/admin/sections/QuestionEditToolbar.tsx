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
  min-width: 120px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  border-width: 2px;
  border-color: #1677ff;
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
    background-color: ${props => props.type === 'primary' ? '#52c41a' : '#fff'};
    border-color: ${props => props.type === 'primary' ? '#52c41a' : '#52c41a'};
    color: ${props => props.type === 'primary' ? '#fff' : '#52c41a'};
    
    &:not(:disabled) {
      &:hover {
        background-color: ${props => props.type === 'primary' ? '#73d13d' : '#f6ffed'} !important;
        border-color: ${props => props.type === 'primary' ? '#73d13d' : '#73d13d'} !important;
        color: ${props => props.type === 'primary' ? '#fff' : '#52c41a'} !important;
      }
      
      &:active {
        background-color: ${props => props.type === 'primary' ? '#389e0d' : '#d9f7be'} !important;
        border-color: ${props => props.type === 'primary' ? '#389e0d' : '#389e0d'} !important;
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
    background-color: ${props => props.type === 'primary' ? '#1677ff' : '#fff'};
    border-color: ${props => props.type === 'primary' ? '#1677ff' : '#1677ff'};
    color: ${props => props.type === 'primary' ? '#fff' : '#1677ff'};
    
    &:not(:disabled) {
      &:hover {
        background-color: ${props => props.type === 'primary' ? '#4096ff' : '#e6f4ff'} !important;
        border-color: #4096ff !important;
        color: ${props => props.type === 'primary' ? '#fff' : '#4096ff'} !important;
      }
      
      &:active {
        background-color: ${props => props.type === 'primary' ? '#0958d9' : '#bae0ff'} !important;
        border-color: #0958d9 !important;
      }
    }
  }
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

          <ActionButton 
            className="review-button"
            type={isPendingReview ? 'default' : 'primary'}
            onClick={onReviewStatusChange}
            icon={isPendingReview ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          >
            {isPendingReview ? 'אשר שאלה' : 'העבר לבדיקה'}
          </ActionButton>

          <Tooltip title={!isApproved ? 'לא ניתן לפרסם שאלה שלא אושרה' : ''}>
            <ActionButton 
              className="publish-button"
              type={isDraft ? 'primary' : 'default'}
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