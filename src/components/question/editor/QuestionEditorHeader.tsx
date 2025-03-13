import React from 'react';
import { Space, Button } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
`;

const ActionButtons = styled(Space)`
  display: flex;
  align-items: center;
`;

const UnsavedWarning = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #faad14;
  margin-right: 16px;
`;

interface QuestionEditorHeaderProps {
  isModified: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export const QuestionEditorHeader: React.FC<QuestionEditorHeaderProps> = ({
  isModified,
  onSave,
  onCancel,
}) => {
  return (
    <HeaderContainer>
      <ActionButtons>
        {isModified && (
          <UnsavedWarning>
            <WarningOutlined />
            <span>יש שינויים שלא נשמרו</span>
          </UnsavedWarning>
        )}
        <Button 
          onClick={onCancel} 
          disabled={!isModified}
        >
          ביטול
        </Button>
        <Button 
          type="primary"
          onClick={onSave}
          disabled={!isModified}
        >
          שמירה
        </Button>
      </ActionButtons>
    </HeaderContainer>
  );
}; 