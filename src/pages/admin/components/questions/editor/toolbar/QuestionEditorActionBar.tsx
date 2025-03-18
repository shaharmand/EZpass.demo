import React, { useEffect, useState } from 'react';
import { SaveOutlined, CloseOutlined, WarningOutlined, LoadingOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { Tooltip, Space, Typography } from 'antd';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

const { Text } = Typography;

const ActionBar = styled.div<{ $hasChanges: boolean }>`
  width: 100%;
  max-width: 1400px;
  margin: 24px auto;
  background: #ffffff;
  padding: 16px 24px;
  border-radius: 12px;
  border: ${props => props.$hasChanges ? '2px solid #faad14' : '1px solid #e5e7eb'};
  box-shadow: ${props => props.$hasChanges ? 
    '0 4px 12px -1px rgba(250, 173, 20, 0.1), 0 2px 6px -1px rgba(250, 173, 20, 0.06)' : 
    '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: 1500;
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.98);
  display: ${props => props.$hasChanges ? 'block' : 'none'};

  &:hover {
    border-color: ${props => props.$hasChanges ? '#d48806' : '#d1d5db'};
    box-shadow: ${props => props.$hasChanges ? 
      '0 -6px 16px -1px rgba(250, 173, 20, 0.15), 0 -4px 8px -1px rgba(250, 173, 20, 0.08)' : 
      '0 -6px 8px -1px rgba(0, 0, 0, 0.06), 0 -4px 6px -1px rgba(0, 0, 0, 0.04)'};
    transform: translate(-50%, -2px);
  }

  @media (max-width: 1448px) {
    width: calc(100% - 48px);
    bottom: 36px;
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
  font-size: 15px;
  font-weight: 600;
  color: #d48806;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;

  .warning-icon {
    font-size: 18px;
    color: #faad14;
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary'; $isLoading?: boolean }>`
  all: unset;
  cursor: ${props => props.$isLoading ? 'wait' : 'pointer'};
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
  pointer-events: ${props => props.$isLoading ? 'none' : 'auto'};

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

    ${props.$isLoading && `
      background: #3b82f6;
      &:hover {
        background: #3b82f6;
        transform: none;
        box-shadow: 0 1px 2px rgba(37, 99, 235, 0.05);
      }
    `}
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

    ${props.$isLoading && `
      color: #9ca3af;
      background: #f3f4f6;
      border-color: #e5e7eb;
      &:hover {
        color: #9ca3af;
        background: #f3f4f6;
        border-color: #e5e7eb;
        transform: none;
      }
    `}
  `}

  .action-button-icon {
    font-size: 16px;
  }

  @media (max-width: 768px) {
    padding: 0 16px;
    font-size: 14px;
  }
`;

const KeyboardShortcut = styled.span`
  font-size: 12px;
  color: #6b7280;
  padding: 2px 6px;
  background: #f3f4f6;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  margin-left: 8px;
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
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        if (hasUnsavedChanges && !isSaving) {
          handleSave();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        if (hasUnsavedChanges) {
          onCancel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, isSaving, onCancel]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasUnsavedChanges) return null;

  return (
    <ActionBar $hasChanges={hasUnsavedChanges}>
      <ActionBarContent>
        <Space align="center">
          <UnsavedChangesText>
            <WarningOutlined className="warning-icon" />
            יש שינויים שלא נשמרו
          </UnsavedChangesText>
          {lastSaved && (
            <Text type="secondary" style={{ fontSize: '13px' }}>
              נשמר לאחרונה: {formatDistanceToNow(lastSaved, { addSuffix: true, locale: he })}
            </Text>
          )}
        </Space>
        <ActionButtonsContainer>
          <Tooltip title="ESC">
            <ActionButton onClick={onCancel} $isLoading={isSaving}>
              <CloseOutlined className="action-button-icon" />
              ביטול
              <KeyboardShortcut>ESC</KeyboardShortcut>
            </ActionButton>
          </Tooltip>
          <Tooltip title="⌘ + S">
            <ActionButton $variant="primary" onClick={handleSave} $isLoading={isSaving}>
              {isSaving ? (
                <>
                  <LoadingOutlined className="action-button-icon" />
                  שומר...
                </>
              ) : (
                <>
                  <SaveOutlined className="action-button-icon" />
                  שמירה
                  <KeyboardShortcut>⌘S</KeyboardShortcut>
                </>
              )}
            </ActionButton>
          </Tooltip>
        </ActionButtonsContainer>
      </ActionBarContent>
    </ActionBar>
  );
};

export default QuestionEditorActionBar; 