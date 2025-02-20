import React from 'react';
import { Space, Tag, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { FilterState, DifficultyLevel, QuestionType } from '../../types/question';

const { Text } = Typography;

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  1: 'קל מאוד',
  2: 'קל',
  3: 'בינוני',
  4: 'קשה',
  5: 'קשה מאוד'
};

interface FilterSummaryProps {
  filters: FilterState;
  onClearFilter: (key: keyof FilterState, value: DifficultyLevel | string | boolean | [number, number]) => void;
}

export const FilterSummary: React.FC<FilterSummaryProps> = ({
  filters,
  onClearFilter
}) => {
  const getDifficultyLabel = (level: DifficultyLevel | string): string => {
    const numLevel = typeof level === 'string' ? parseInt(level) : level;
    return DIFFICULTY_LABELS[numLevel as DifficultyLevel] || `רמה ${level}`;
  };

  const getQuestionTypeLabel = (type: string) => {
    switch(type) {
      case 'multiple_choice': return 'רב-ברירה';
      case 'open': return 'פתוח';
      case 'code': return 'קוד';
      case 'step_by_step': return 'שלב אחר שלב';
      default: return type;
    }
  };

  const renderFilterTags = () => {
    const tags = [];

    // Difficulty filters
    if (filters.difficulty?.length) {
      filters.difficulty.forEach(level => {
        const difficultyLevel = typeof level === 'string' ? parseInt(level) as DifficultyLevel : level;
        tags.push(
          <Tag
            key={`difficulty-${level}`}
            closable
            onClose={() => onClearFilter('difficulty', difficultyLevel)}
            color="blue"
          >
            {`קושי: ${getDifficultyLabel(level)}`}
          </Tag>
        );
      });
    }

    // Topic filters
    if (filters.topics?.length) {
      filters.topics.forEach(topic => {
        tags.push(
          <Tag
            key={`topic-${topic}`}
            closable
            onClose={() => onClearFilter('topics', topic)}
            color="green"
          >
            {`נושא: ${topic}`}
          </Tag>
        );
      });
    }

    // Question type filters
    if (filters.questionTypes?.length) {
      filters.questionTypes.forEach(type => {
        tags.push(
          <Tag
            key={`type-${type}`}
            closable
            onClose={() => onClearFilter('questionTypes', type)}
            color="purple"
          >
            {`סוג: ${getQuestionTypeLabel(type)}`}
          </Tag>
        );
      });
    }

    // Time limit
    if (filters.timeLimit) {
      tags.push(
        <Tag
          key="time-limit"
          closable
          onClose={() => onClearFilter('timeLimit', filters.timeLimit!)}
          color="orange"
        >
          {`זמן: ${filters.timeLimit[0]}-${filters.timeLimit[1]} דקות`}
        </Tag>
      );
    }

    // Programming languages
    if (filters.programmingLanguages?.length) {
      filters.programmingLanguages.forEach(lang => {
        tags.push(
          <Tag
            key={`lang-${lang}`}
            closable
            onClose={() => onClearFilter('programmingLanguages', lang)}
            color="cyan"
          >
            {`שפה: ${lang}`}
          </Tag>
        );
      });
    }

    // Has test cases
    if (filters.hasTestCases) {
      tags.push(
        <Tag
          key="test-cases"
          closable
          onClose={() => onClearFilter('hasTestCases', true)}
          color="magenta"
        >
          כולל מקרי בדיקה
        </Tag>
      );
    }

    return tags;
  };

  return (
    <div className="filter-summary">
      <Space size={[4, 8]} wrap>
        {renderFilterTags()}
      </Space>
    </div>
  );
}; 