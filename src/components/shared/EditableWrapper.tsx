import React, { useState, useCallback, ReactNode, useEffect } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { useQuestion } from '../../contexts/QuestionContext';
import {
  EditableContainer,
  EditHeader,
  EditContent,
  EditLabel,
  CancelButton,
  DisplayView
} from '../../styles/adminEditStyles';

interface EditableWrapperProps {
  label: string;
  placeholder?: string;
  onValueChange: (value: any) => void;
  onBlur?: () => void;
  renderEditMode: (value: any, onChange: (value: any) => void) => ReactNode;
  renderDisplayMode?: (value: any) => ReactNode;
  className?: string;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  resetKey?: number;
  fieldPath: string;
}

const getValueFromPath = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

export const EditableWrapper: React.FC<EditableWrapperProps> = ({
  label,
  placeholder = '',
  onValueChange,
  renderEditMode,
  renderDisplayMode,
  className,
  isEditing: controlledEditing,
  onStartEdit,
  onCancelEdit,
  resetKey,
  fieldPath
}) => {
  const questionContext = useQuestion();
  const [currentValue, setCurrentValue] = useState(() => 
    getValueFromPath(questionContext.originalQuestion.current?.data, fieldPath)
  );
  const isEditing = controlledEditing !== undefined ? controlledEditing : false;
  const hasChanges = currentValue !== getValueFromPath(questionContext.originalQuestion.current?.data, fieldPath);
  const isEmpty = !currentValue && currentValue !== 0;

  // Handle resets from parent
  useEffect(() => {
    if (resetKey) {
      const resetValue = getValueFromPath(questionContext.originalQuestion.current?.data, fieldPath);
      setCurrentValue(resetValue);
    }
  }, [resetKey, questionContext, fieldPath]);

  const handleCancel = useCallback(() => {
    const contextValue = getValueFromPath(questionContext.originalQuestion.current?.data, fieldPath);
    setCurrentValue(contextValue);
    onValueChange(contextValue);
    if (onCancelEdit) {
      onCancelEdit();
    }
  }, [questionContext, fieldPath, onValueChange, onCancelEdit]);

  const handleChange = useCallback((value: any) => {
    setCurrentValue(value);
    onValueChange(value);
  }, [onValueChange]);

  return (
    <EditableContainer 
      onClick={() => !isEditing && onStartEdit?.()}
      data-editing={isEditing}
      className={className}
      $hasChanges={hasChanges}
    >
      <EditHeader>
        <EditLabel>{label}</EditLabel>
      </EditHeader>

      <EditContent>
        {isEditing ? (
          <>
            {renderEditMode(currentValue, handleChange)}
            <CancelButton
              icon={<CloseOutlined />}
              onClick={handleCancel}
            />
          </>
        ) : (
          renderDisplayMode ? (
            renderDisplayMode(currentValue)
          ) : (
            <DisplayView $isEmpty={isEmpty}>
              {isEmpty ? placeholder : currentValue}
            </DisplayView>
          )
        )}
      </EditContent>
    </EditableContainer>
  );
}; 