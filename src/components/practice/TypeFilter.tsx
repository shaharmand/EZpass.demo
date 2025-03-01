import React from 'react';
import { Button, Space, Typography } from 'antd';
import { AimOutlined } from '@ant-design/icons';
import { Question, QuestionType, FilterState } from '../../types/question';
import { SkipReason } from '../../types/prepUI';
import './TypeFilter.css';

const { Text } = Typography;

interface TypeFilterContentProps {
  question: Question;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSkip: (reason: SkipReason, filters?: FilterState) => void;
  onClose: () => void;
}

export const TypeFilterContent: React.FC<TypeFilterContentProps> = ({
  question,
  filters,
  onFiltersChange,
  onSkip,
  onClose
}) => {
  const questionTypes = [
    { type: 'multiple_choice' as QuestionType, label: 'שאלות סגורות' },
    { type: 'open' as QuestionType, label: 'שאלות פתוחות' },
    { type: 'step_by_step' as QuestionType, label: 'שאלות חישוביות' }
  ];

  const hasTypeFocus = () => !!filters.questionTypes?.length;
  const isTypeFocused = (type: QuestionType) => 
    filters.questionTypes?.length === 1 && filters.questionTypes[0] === type;

  const handleTypeSelect = (selectedType: QuestionType | null) => {
    if (selectedType === null) {
      // Just remove focus
      const { questionTypes, ...otherFilters } = filters;
      onFiltersChange(otherFilters);
    } else if (selectedType === question.type) {
      // Current type - just update filter
      onFiltersChange({ ...filters, questionTypes: [selectedType] });
    } else {
      // Different type - skip with filter change
      onSkip('filter_change' as SkipReason, { questionTypes: [selectedType] });
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