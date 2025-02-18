import React from 'react';
import { Button } from 'antd';
import { 
  DownOutlined, 
  CloseOutlined 
} from '@ant-design/icons';

// Styles
const selectedButtonStyle = {
  color: '#2563eb',
  borderColor: '#2563eb',
  backgroundColor: '#EEF2FF'
};

const unselectedButtonStyle = {
  color: '#64748b',
  borderColor: '#e5e7eb',
  backgroundColor: 'transparent'
};

interface Filters {
  topic: string | null;
  subtopic: string | null;
  type: string | null;
  difficulty: number | null;
  source: {
    season: string | null;
    moed: string | null;
    year: number | null;
  };
}

interface QuestionFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  isExpanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

const QuestionFilters: React.FC<QuestionFiltersProps> = ({
  filters,
  onFiltersChange,
  isExpanded,
  onExpandChange
}) => {
  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== null && (typeof value !== 'object' || Object.values(value).some(v => v !== null))
  ).length;

  const handleTypeChange = (type: string | null) => {
    onFiltersChange({
      ...filters,
      type
    });
  };

  const handleDifficultyChange = (difficulty: number | null) => {
    onFiltersChange({
      ...filters,
      difficulty
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      topic: null,
      subtopic: null,
      type: null,
      difficulty: null,
      source: {
        season: null,
        moed: null,
        year: null
      }
    });
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      marginBottom: '16px'
    }}>
      {/* Header */}
      <div 
        onClick={() => onExpandChange(!isExpanded)}
        style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ 
            color: '#475569', 
            fontSize: '1rem', 
            fontWeight: 500 
          }}>
            סינון שאלות
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              backgroundColor: '#f1f5f9',
              color: '#475569',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: '500',
              border: '1px solid #e5e7eb'
            }}>
              {activeFiltersCount > 0 ? `${activeFiltersCount} מסננים פעילים` : 'כל השאלות'}
            </span>
            
            {activeFiltersCount > 0 && (
              <Button
                type="link"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFilters();
                }}
                style={{
                  color: '#2563eb',
                  fontWeight: '500',
                  padding: '0 4px',
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CloseOutlined style={{ fontSize: '12px' }} />
                ניקוי סינונים
              </Button>
            )}
          </div>
        </div>

        <DownOutlined 
          style={{ 
            transform: isExpanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.3s',
            fontSize: '12px',
            color: '#2563eb'
          }} 
        />
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Question type selector */}
            <div>
              <span style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
                סוג שאלה:
              </span>
              <div style={{
                display: 'flex',
                gap: '8px',
                backgroundColor: '#f1f5f9',
                padding: '4px',
                borderRadius: '8px'
              }}>
                <Button
                  onClick={() => handleTypeChange(null)}
                  style={{
                    ...(filters.type === null ? selectedButtonStyle : unselectedButtonStyle),
                    height: '36px',
                    padding: '0 16px'
                  }}
                >
                  כל סוגי השאלות
                </Button>
                {['multiple_choice', 'open', 'step_by_step'].map(type => (
                  <Button
                    key={type}
                    onClick={() => handleTypeChange(type)}
                    style={{
                      ...(filters.type === type ? selectedButtonStyle : unselectedButtonStyle),
                      height: '36px',
                      padding: '0 16px'
                    }}
                  >
                    {type === 'multiple_choice' ? 'רב-ברירה' : 
                     type === 'open' ? 'שאלה פתוחה' : 'חישובית'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Difficulty selector */}
            <div>
              <span style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>
                רמה:
              </span>
              <div style={{
                display: 'flex',
                gap: '4px',
                backgroundColor: '#f1f5f9',
                padding: '4px',
                borderRadius: '8px'
              }}>
                <Button
                  onClick={() => handleDifficultyChange(null)}
                  style={{
                    ...(filters.difficulty === null ? selectedButtonStyle : unselectedButtonStyle),
                    height: '36px',
                    padding: '0 16px'
                  }}
                >
                  כל הרמות
                </Button>
                {[1, 2, 3, 4, 5].map(level => (
                  <Button
                    key={level}
                    onClick={() => handleDifficultyChange(level)}
                    style={{
                      ...(filters.difficulty === level ? selectedButtonStyle : unselectedButtonStyle),
                      height: '36px',
                      padding: '0 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {Array.from({ length: level }, (_, i) => (
                        <div
                          key={i}
                          style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: filters.difficulty === level ? '#2563eb' : '#94a3b8',
                            opacity: filters.difficulty === level ? 1 : 0.8
                          }}
                        />
                      ))}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionFilters; 