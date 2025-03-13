import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const EditableFieldContainer = styled.div<{ $isEditing?: boolean }>`
  position: relative;
  width: 100%;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;
  padding: 16px;
  margin-bottom: 16px;

  &:hover {
    border-color: #40a9ff;
    cursor: pointer;
    background: #fafafa;
  }

  ${props => props.$isEditing && `
    border-color: #40a9ff;
    background: #fff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  `}

  .edit-field-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .edit-field-content {
    position: relative;
    width: 100%;
  }

  .edit-field-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    min-height: 24px;
  }
`;

const EditFieldCancelButton = styled(Button)`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  min-width: 24px;
  padding: 0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.02);
  z-index: 1;

  &:hover {
    background: #fafafa;
    border-color: #40a9ff;
    color: #40a9ff;
  }

  .anticon {
    font-size: 12px;
    line-height: 1;
  }
`;

const EditFieldLabel = styled.div`
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 4px;
`;

const EditFieldStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #8c8c8c;
`;

const DisplayContent = styled.div<{ $isEmpty?: boolean }>`
  font-size: 16px;
  line-height: 1.6;
  color: ${props => props.$isEmpty ? '#bfbfbf' : '#595959'};
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  min-height: 40px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f0f0;
  }
`;

interface EditableFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  renderEditContent: () => ReactNode;
  statusText?: string;
  className?: string;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  placeholder = '',
  isEditing,
  onEdit,
  onCancel,
  renderEditContent,
  statusText,
  className
}) => {
  const isEmpty = !value || value.trim().length === 0;

  return (
    <EditableFieldContainer 
      onClick={() => !isEditing && onEdit()}
      $isEditing={isEditing}
      className={className}
    >
      <div className="edit-field-header">
        <EditFieldLabel>{label}</EditFieldLabel>
        {statusText && <EditFieldStatus>{statusText}</EditFieldStatus>}
      </div>
      
      <div className="edit-field-content">
        {isEditing ? (
          <>
            {renderEditContent()}
            <EditFieldCancelButton
              icon={<CloseOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            />
          </>
        ) : (
          <DisplayContent $isEmpty={isEmpty}>
            {isEmpty ? placeholder : value}
          </DisplayContent>
        )}
      </div>
    </EditableFieldContainer>
  );
}; 