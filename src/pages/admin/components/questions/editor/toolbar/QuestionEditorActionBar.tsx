import React from 'react';
import { SaveOutlined, CloseOutlined, WarningOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const ActionBar = styled.div<{ $hasChanges: boolean }>`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  background: #ffffff;
  padding: 16px 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05), 0 -2px 4px -1px rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: ${props => props.$hasChanges ? 'translate(-50%, 0)' : 'translate(-50%, 150%)'};
  opacity: ${props => props.$hasChanges ? 1 : 0};
  z-index: 1000;
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.98);
  pointer-events: ${props => props.$hasChanges ? 'auto' : 'none'};

  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 -6px 8px -1px rgba(0, 0, 0, 0.06), 0 -4px 6px -1px rgba(0, 0, 0, 0.04);
  }

  @media (max-width: 1448px) {
    width: calc(100% - 48px);
    margin: 0 24px;
  }
`;

const ActionBarContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UnsavedChangesText = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #faad14;
  display: flex;
  align-items: center;
  gap: 8px;

  .warning-icon {
    font-size: 18px;
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  all: unset;
  cursor: pointer;
  height: 40px;
  padding: 0 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  ${props => props.$variant === 'primary' ? `
    background: #2563eb;
    color: white;
    box-shadow: 0 1px 2px rgba(37, 99, 235, 0.05);

    &:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px -1px rgba(37, 99, 235, 0.1);
    }
  ` : `
    color: #374151;
    background: #ffffff;
    border: 1px solid #d1d5db;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &:hover {
      color: #2563eb;
      background: #f8fafc;
      border-color: #93c5fd;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
      background: #f1f5f9;
      border-color: #60a5fa;
    }
  `}

  .action-button-icon {
    font-size: 16px;
  }

  @media (max-width: 768px) {
    padding: 0 16px;
    font-size: 14px;
  }
`;

interface QuestionEditorActionBarProps {
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export const QuestionEditorActionBar: React.FC<QuestionEditorActionBarProps> = ({
  hasUnsavedChanges,
  onSave,
  onCancel
}) => {
  if (!hasUnsavedChanges) return null;

  return (
    <ActionBar $hasChanges={hasUnsavedChanges}>
      <ActionBarContent>
        <UnsavedChangesText>
          <WarningOutlined className="warning-icon" />
          יש שינויים שלא נשמרו
        </UnsavedChangesText>
        <ActionButtonsContainer>
          <ActionButton onClick={onCancel}>
            <CloseOutlined className="action-button-icon" />
            ביטול
          </ActionButton>
          <ActionButton $variant="primary" onClick={onSave}>
            <SaveOutlined className="action-button-icon" />
            שמירה
          </ActionButton>
        </ActionButtonsContainer>
      </ActionBarContent>
    </ActionBar>
  );
};

export default QuestionEditorActionBar; 