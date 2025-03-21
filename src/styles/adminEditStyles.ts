import styled from 'styled-components';
import { Button, Input } from 'antd';

interface EditableContainerProps {
  $hasError?: boolean;
  $hasChanges?: boolean;
  $isEditing?: boolean;
}

export const EditableContainer = styled.div<EditableContainerProps>`
  padding: 12px;
  border-radius: 4px;
  background: #fff;
  border: 1px solid ${props => props.$hasError ? '#ff4d4f' : props.$hasChanges ? '#faad14' : '#f0f0f0'};
  transition: all 0.2s ease;
  cursor: ${props => props.$isEditing ? 'default' : 'pointer'};

  &:hover {
    border-color: ${props => props.$hasError ? '#ff7875' : props.$hasChanges ? '#d48806' : '#40a9ff'};
  }

  &:focus-within {
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
`;

export const EditHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

export const EditContent = styled.div`
  position: relative;
  width: 100%;
  transition: all 0.2s ease;
`;

export const EditFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  min-height: 24px;
`;

export const EditLabel = styled.div`
  font-size: 13px;
  color: #9ca3af;
  font-weight: normal;
`;

export const CancelButton = styled(Button)`
  position: absolute;
  top: -12px;
  right: -12px;
  width: 28px;
  height: 28px;
  min-width: 28px;
  padding: 0;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #d9d9d9;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1;
  transition: all 0.2s ease;

  &:hover {
    background: #e6f7ff;
    border-color: #1890ff;
    color: #1890ff;
    transform: scale(1.1);
  }

  &:active {
    background: #1890ff;
    border-color: #096dd9;
    color: #fff;
  }

  .anticon {
    font-size: 14px;
    line-height: 1;
  }
`;

export const DisplayView = styled.div<{ $isEmpty?: boolean; $hasError?: boolean }>`
  padding: 8px;
  min-height: 32px;
  color: ${props => props.$hasError ? '#ff4d4f' : props.$isEmpty ? '#bfbfbf' : '#262626'};
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
  }
`;

export const EditorWrapper = styled.div`
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    border-color: #40a9ff;
  }

  &:focus-within {
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

  // Override Lexical editor's internal change indicators
  .lexical-editor {
    [data-lexical-decorator="true"] {
      background: transparent !important;
    }
    
    .has-changes {
      background: transparent !important;
    }
  }
`;

// For the action bar unsaved changes warning
export const ActionBarStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  margin-right: 16px;
  color: #faad14;
  font-size: 14px;
  
  &:before {
    content: "⚠️";
    font-size: 16px;
  }
`;

export const ActionBar = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

export const StatusText = styled.span`
  font-size: 12px;
  color: #8c8c8c;
`;

// Helper type for consistent styling props
export interface EditableStyleProps {
  $isEmpty?: boolean;
  $isEditing?: boolean;
  $hasChanges?: boolean;
} 