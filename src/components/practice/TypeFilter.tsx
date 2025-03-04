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

export const TypeFilterContent: React.FC<TypeFilterContentProps> = ({
  question,
  onSkip,
  onClose
}) => {
  const { prep, setFocusedType } = useStudentPrep();
  
  const questionTypes = [
    { type: QuestionType.MULTIPLE_CHOICE, label: 'שאלות סגורות' },
    { type: QuestionType.OPEN, label: 'שאלות פתוחות' },
    { type: QuestionType.NUMERICAL, label: 'שאלות חישוביות' }
  ];

  const hasTypeFocus = () => !!prep?.focusedType;
  const isTypeFocused = (type: QuestionType) => prep?.focusedType === type;

  const handleTypeSelect = (selectedType: QuestionType | null) => {
    if (selectedType === null) {
      // Just remove focus
      setFocusedType(null);
    } else if (selectedType === question.metadata.type) {
      // Current type - just update focus
      setFocusedType(selectedType);
    } else {
      // Different type - skip with focus change
      setFocusedType(selectedType);
      onSkip('filter_change');
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
        {questionTypes.map(({ type, label }) => (
          <Button
            key={type}
            onClick={() => handleTypeSelect(type)}
            icon={<AimOutlined className={isTypeFocused(type) ? 'focused' : ''} />}
            className={`type-filter-option ${isTypeFocused(type) ? 'selected' : ''}`}
          >
            {`מיקוד ב${label}`}
          </Button>
        ))}
      </Space>
    </div>
  );
}; 