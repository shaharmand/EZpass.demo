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
  label: ReactNode;
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
  validate?: (value: any) => boolean;
}

const getValueFromPath = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

export const EditableWrapper: React.FC<EditableWrapperProps> = ({
  label,
  placeholder = '',
  onValueChange,
  onBlur,
  renderEditMode,
  renderDisplayMode,
  className,
  isEditing: controlledEditing,
  onStartEdit,
  onCancelEdit,
  resetKey,
  fieldPath,
  validate
}) => {
  const questionContext = useQuestion();
  const [currentValue, setCurrentValue] = useState(() => {
    const initialValue = getValueFromPath(questionContext.originalQuestion.current?.data, fieldPath);
    console.log('[EditableWrapper] Initial value for', fieldPath, ':', initialValue);
    return initialValue;
  });
  const isEditing = controlledEditing !== undefined ? controlledEditing : false;
  const hasChanges = currentValue !== getValueFromPath(questionContext.originalQuestion.current?.data, fieldPath);
  const isEmpty = !currentValue && currentValue !== 0;

  // Add effect to update currentValue when question changes in context
  useEffect(() => {
    const unsubscribe = questionContext.onQuestionChange((updatedQuestion) => {
      const newValue = getValueFromPath(updatedQuestion.data, fieldPath);
      console.log('[EditableWrapper] Question changed in context for', fieldPath, '- new value:', newValue);
      setCurrentValue(newValue);
    });
    
    return () => unsubscribe();
  }, [questionContext, fieldPath]);

  // Handle resets from parent
  useEffect(() => {
    if (resetKey) {
      const resetValue = getValueFromPath(questionContext.originalQuestion.current?.data, fieldPath);
      console.log('[EditableWrapper] Reset triggered for', fieldPath, '- reset value:', resetValue);
      setCurrentValue(resetValue);
    }
  }, [resetKey, questionContext, fieldPath]);

  const handleCancel = useCallback(() => {
    console.log('[EditableWrapper] Cancel clicked for', fieldPath);
    const contextValue = getValueFromPath(questionContext.originalQuestion.current?.data, fieldPath);
    console.log('[EditableWrapper] Original value from context:', contextValue);
    setCurrentValue(contextValue);
    onValueChange(contextValue);
    if (onCancelEdit) {
      console.log('[EditableWrapper] Calling onCancelEdit for', fieldPath);
      onCancelEdit();
    }
  }, [questionContext, fieldPath, onValueChange, onCancelEdit]);

  const handleChange = useCallback((value: any) => {
    console.log('[EditableWrapper] Value changed for', fieldPath, ':', value);
    setCurrentValue(value);
    onValueChange(value);
  }, [onValueChange, fieldPath]);

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