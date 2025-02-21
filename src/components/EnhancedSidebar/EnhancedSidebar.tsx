import React, { useState } from 'react';
import { Card, Tabs, Button, Badge, Space, Typography, Drawer, Tag, Collapse, Tooltip } from 'antd';
import { FilterOutlined, InfoCircleOutlined, SettingOutlined, CloseOutlined } from '@ant-design/icons';
import QuestionMetadata from '../QuestionMetadata';
import { QuestionFilter } from './QuestionFilter';
import { FilterSummary } from './FilterSummary';
import type { Question, FilterState, DifficultyLevel } from '../../types/question';
import './EnhancedSidebar.css';

const { TabPane } = Tabs;
const { Text } = Typography;
const { Panel } = Collapse;

// Helper to convert numeric difficulty to display string
const getDifficultyLabel = (difficulty: DifficultyLevel): string => {
  switch (difficulty) {
    case 1: return 'קל מאוד';
    case 2: return 'קל';
    case 3: return 'בינוני';
    case 4: return 'קשה';
    case 5: return 'קשה מאוד';
    default: return `רמה ${difficulty}`;
  }
};

// Helper to ensure source has the correct type
const formatSource = (source: any): { type: 'exam' | 'book' | 'ezpass'; examType?: string; year?: number; season?: string; moed?: string; bookName?: string; publisher?: string } => {
  if (typeof source === 'string') return { type: 'ezpass' };
  if (!source || typeof source !== 'object') return { type: 'ezpass' };
  
  return {
    type: (source.type as 'exam' | 'book' | 'ezpass') || 'ezpass',
    examType: source.examType,
    year: source.year,
    season: source.season,
    moed: source.moed,
    bookName: source.bookName,
    publisher: source.publisher
  };
};

interface EnhancedSidebarProps {
  question: Question;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  question,
  filters,
  onFiltersChange
}) => {
  const [activeTab, setActiveTab] = useState<string>('info');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Format metadata for QuestionMetadata
  const formattedMetadata = question ? {
    topicId: question.metadata.topicId,
    subtopicId: question.metadata.subtopicId,
    type: question.type,
    difficulty: getDifficultyLabel(question.metadata.difficulty),
    source: formatSource(question.metadata.source)
  } : {
    topicId: '',
    type: 'multiple_choice' as const,
    difficulty: getDifficultyLabel(1),
    source: { type: 'ezpass' as const }
  };

  const handleClearFilter = (key: keyof FilterState, value: DifficultyLevel | string | boolean | [number, number]) => {
    const newFilters = { ...filters };
    
    switch (key) {
      case 'difficulty':
        if (typeof value === 'number' && Array.isArray(newFilters.difficulty)) {
          const difficultyLevel = value as DifficultyLevel;
          newFilters.difficulty = newFilters.difficulty
            .filter(v => typeof v === 'string' ? parseInt(v) !== difficultyLevel : v !== difficultyLevel)
            .map(v => typeof v === 'string' ? parseInt(v) as DifficultyLevel : v);
          if (newFilters.difficulty.length === 0) delete newFilters.difficulty;
        }
        break;
      
      case 'topics':
      case 'questionTypes':
      case 'programmingLanguages':
        if (typeof value === 'string' && Array.isArray(newFilters[key])) {
          const arrayKey = key;
          newFilters[arrayKey] = newFilters[arrayKey]!.filter(v => v !== value);
          if (newFilters[arrayKey]!.length === 0) delete newFilters[arrayKey];
        }
        break;
      
      case 'timeLimit':
        if (Array.isArray(value) && value.length === 2) {
          delete newFilters.timeLimit;
        }
        break;
      
      case 'hasTestCases':
        if (typeof value === 'boolean') {
          delete newFilters.hasTestCases;
        }
        break;
    }

    onFiltersChange(newFilters);
  };

  return (
    <>
      {/* Desktop View */}
      <div
        className={`enhanced-sidebar ${isExpanded ? 'expanded' : ''}`}
        style={{
          position: 'sticky',
          top: '24px',
          marginLeft: '24px'
        }}
      >
        <Card
          className="enhanced-sidebar-card"
          bodyStyle={{ padding: '16px' }}
          extra={
            <Space>
              <Tooltip title={isExpanded ? "כווץ" : "הרחב"}>
                <Button
                  type="text"
                  icon={isExpanded ? <CloseOutlined /> : <SettingOutlined />}
                  onClick={() => setIsExpanded(!isExpanded)}
                />
              </Tooltip>
            </Space>
          }
        >
          {Object.keys(filters).length > 0 && (
            <div className="filter-summary-container">
              <FilterSummary 
                filters={filters}
                onClearFilter={handleClearFilter}
              />
            </div>
          )}

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="enhanced-sidebar-tabs"
            items={[
              {
                key: 'info',
                label: (
                  <span>
                    <InfoCircleOutlined />
                    מידע
                  </span>
                ),
                children: <QuestionMetadata metadata={formattedMetadata} />
              },
              {
                key: 'filters',
                label: (
                  <Badge count={Object.keys(filters).length} size="small">
                    <span>
                      <FilterOutlined />
                      סינון
                    </span>
                  </Badge>
                ),
                children: (
                  <QuestionFilter
                    filters={filters}
                    onChange={onFiltersChange}
                    expanded={isExpanded}
                  />
                )
              }
            ]}
          />
        </Card>
      </div>

      {/* Mobile View - Drawer */}
      <Drawer
        title="הגדרות שאלה"
        placement="left"
        width={320}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
        className="enhanced-sidebar-drawer"
      >
        <Tabs
          defaultActiveKey="filters"
          items={[
            {
              key: 'info',
              label: 'מידע',
              children: <QuestionMetadata metadata={formattedMetadata} />
            },
            {
              key: 'filters',
              label: 'סינון',
              children: (
                <QuestionFilter
                  filters={filters}
                  onChange={onFiltersChange}
                  expanded={true}
                />
              )
            }
          ]}
        />
      </Drawer>
    </>
  );
}; 