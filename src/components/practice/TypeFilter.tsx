import React from 'react';
import { Button, Space, Typography } from 'antd';
import { AimOutlined } from '@ant-design/icons';
import { Question, QuestionType } from '../../types/question';
import { SkipReason } from '../../types/prepUI';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import './TypeFilter.css';

const { Text } = Typography;

interface TypeFilterContentProps {
  question: Question;
  onSkip: (reason: SkipReason) => void;
  onClose: () => void;
}

interface QuestionTypeOption {
  type: QuestionType;
  label: string;
  enabled: boolean;
}

export const TypeFilterContent: React.FC<TypeFilterContentProps> = ({
  question,
  onSkip,
  onClose
}) => {
  const { prep, setFocusedType } = useStudentPrep();
  
  const questionTypes: QuestionTypeOption[] = [
    { type: QuestionType.MULTIPLE_CHOICE, label: 'שאלות סגורות', enabled: true },
    { type: QuestionType.OPEN, label: 'שאלות פתוחות', enabled: true },
    { type: QuestionType.NUMERICAL, label: 'שאלות חישוביות', enabled: false }
  ];

  const hasTypeFocus = () => !!prep?.focusedType;
  const isTypeFocused = (type: QuestionType) => prep?.focusedType === type;

  const handleTypeSelect = (selectedType: QuestionTypeOption | null) => {
    console.log('🎯 TypeFilter: handleTypeSelect called with:', {
      selectedType,
      currentQuestionType: question.metadata.type,
      currentFocusedType: prep?.focusedType,
      timestamp: new Date().toISOString()
    });

    if (selectedType && !selectedType.enabled) {
      console.log('⚠️ TypeFilter: Ignoring disabled type');
      return;
    }
    
    if (selectedType === null) {
      console.log('🎯 TypeFilter: Removing focus');
      // Remove focus - no need to skip as any question type is fine
      setFocusedType(null);
    } else {
      console.log('🎯 TypeFilter: Setting new focus:', {
        newType: selectedType.type,
        currentType: question.metadata.type,
        willSkip: selectedType.type !== question.metadata.type
      });
      // Always set the focus first
      setFocusedType(selectedType.type);
      // Skip to next question if type is different from current
      if (selectedType.type !== question.metadata.type) {
        onSkip('filter_change');
      }
    }
    onClose();
  };

  return (
    <div className="type-filter-content">
      <div className="type-filter-header">
        <Text strong className="type-filter-title">
          מיקוד בסוג שאלה
        </Text>
        <Text className="type-filter-description">
          בחר/י את סוג השאלות שברצונך להתמקד בהן
        </Text>
      </div>

      <Space direction="vertical" className="type-filter-options">
        <Button
          onClick={() => handleTypeSelect(null)}
          icon={<AimOutlined className={!hasTypeFocus() ? 'focused' : ''} />}
          className={`type-filter-option ${!hasTypeFocus() ? 'selected' : ''}`}
        >
          ללא מיקוד
        </Button>
        {questionTypes.map(({ type, label, enabled }) => (
          <Button
            key={type}
            onClick={() => handleTypeSelect({ type, label, enabled })}
            icon={<AimOutlined className={isTypeFocused(type) ? 'focused' : ''} />}
            className={`type-filter-option ${isTypeFocused(type) ? 'selected' : ''} ${!enabled ? 'disabled' : ''}`}
            disabled={!enabled}
          >
            {`מיקוד ב${label}`}
            {!enabled && <span className="disabled-note"> (בקרוב)</span>}
          </Button>
        ))}
      </Space>
    </div>
  );
}; 