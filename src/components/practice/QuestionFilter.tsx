import React from 'react';
import { Space, Select, Slider, Switch, Tree, Typography, Divider, Button, Tooltip } from 'antd';
import { StarFilled, StarOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import type { FilterState, DifficultyLevel, QuestionType } from '../../types/question';
import { Topic } from '../../types/subject';
import type { StudentPrep } from '../../types/prepState';

const { Text } = Typography;

interface QuestionFilterProps {
  onFiltersChange: (filters: FilterState) => void;
  filters: FilterState;
  expanded: boolean;
  prep: StudentPrep;
}

export const QuestionFilter: React.FC<QuestionFilterProps> = ({
  onFiltersChange,
  filters,
  expanded,
  prep
}) => {
  // Difficulty options with visual representation
  const difficultyOptions = [
    { value: 1, label: 'קל מאוד', color: '#52c41a' },
    { value: 2, label: 'קל', color: '#95de64' },
    { value: 3, label: 'בינוני', color: '#ffc53d' },
    { value: 4, label: 'קשה', color: '#ff7a45' },
    { value: 5, label: 'קשה מאוד', color: '#f5222d' }
  ];

  const renderDifficultyOption = (option: { value: number; label: string; color: string }) => (
    <Space>
      {[...Array(option.value)].map((_, i) => (
        <StarFilled key={i} style={{ color: option.color }} />
      ))}
      {[...Array(5 - option.value)].map((_, i) => (
        <StarOutlined key={i + option.value} style={{ color: option.color }} />
      ))}
      <Text>{option.label}</Text>
    </Space>
  );

  const handleDifficultyChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      difficulty: values as DifficultyLevel[]
    });
  };

  const getTreeData = (): DataNode[] => {
    return prep.exam.topics.map((topic: Topic) => ({
      title: (
        <Space>
          <Text>{topic.name}</Text>
          {topic.description && (
            <Tooltip title={topic.description}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {topic.description}
              </Text>
            </Tooltip>
          )}
        </Space>
      ),
      key: topic.id,
      children: topic.subTopics.map(subTopic => ({
        title: (
          <Space>
            <Text>{subTopic.name}</Text>
            {subTopic.description && (
              <Tooltip title={subTopic.description}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {subTopic.description}
                </Text>
              </Tooltip>
            )}
          </Space>
        ),
        key: subTopic.id,
        isLeaf: true
      }))
    }));
  };

  const handleTopicSelect = (
    checked: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] }
  ) => {
    const checkedKeys = Array.isArray(checked) ? checked : checked.checked;
    
    // Separate topics and subtopics
    const topics: string[] = [];
    const subTopics: string[] = [];
    
    checkedKeys.forEach(key => {
      const keyStr = key.toString();
      // If key is in topics array, it's a topic
      if (prep.exam.topics.some(t => t.id === keyStr)) {
        topics.push(keyStr);
      } else {
        // Otherwise it's a subtopic
        subTopics.push(keyStr);
      }
    });

    onFiltersChange({
      ...filters,
      topics,
      subTopics
    });
  };

  const getAvailableQuestionTypes = () => {
    return prep.exam.allowedQuestionTypes.map(type => ({
      // TODO: Fix QuestionType enum usage when this component is needed
      // Currently commented out due to type import issues
      label: type === 'multiple_choice' ? 'רב ברירה' :
             type === 'open' ? 'פתוח' :
             type === 'numerical' ? 'חישובית' : type,
      value: type
    }));
  };

  const handleTypeToggle = (type: QuestionType) => {
    const currentTypes = filters.questionTypes || [];
    const typeIndex = currentTypes.indexOf(type);
    
    let newTypes: string[];
    if (typeIndex === -1) {
      newTypes = [...currentTypes, type];
    } else {
      newTypes = currentTypes.filter(t => t !== type);
    }

    onFiltersChange({
      ...filters,
      questionTypes: newTypes
    });
  };

  const handleSourceChange = (sources: Array<'bagrut' | 'mahat'>) => {
    const rest = { ...filters };
    delete rest.source;

    onFiltersChange({
      ...rest,
      source: sources.length ? { 
        type: 'exam',
        examTemplateId: sources[0]
      } : undefined
    });
  };

  if (!expanded) {
    return null;
  }

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Difficulty Filter */}
      <div className="filter-section">
        <Text strong>רמת קושי</Text>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="בחר רמת קושי"
          value={filters.difficulty}
          onChange={handleDifficultyChange}
          options={difficultyOptions.map(option => ({
            label: renderDifficultyOption(option),
            value: option.value
          }))}
        />
      </div>

      {/* Topic Filter */}
      <div className="filter-section">
        <Text strong>נושאים</Text>
        <Tree
          checkable
          selectable={false}
          checkedKeys={[
            ...(filters.topics || []),
            ...(filters.subTopics || [])
          ]}
          onCheck={handleTopicSelect}
          treeData={getTreeData()}
        />
      </div>

      {/* Question Type Filter */}
      <div className="filter-section">
        <Text strong>סוג שאלה</Text>
        <Space direction="vertical" style={{ width: '100%' }}>
          {getAvailableQuestionTypes().map(type => (
            <Button
              key={type.value}
              type={filters.questionTypes?.includes(type.value) ? 'primary' : 'default'}
              onClick={() => handleTypeToggle(type.value as QuestionType)}
              style={{ width: '100%', textAlign: 'right' }}
            >
              {type.label}
            </Button>
          ))}
        </Space>
      </div>

      {/* Source Filter */}
      <div className="filter-section">
        <Text strong>מקור</Text>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="בחר מקור"
          value={filters.source?.type === 'exam' && filters.source.examTemplateId ? 
            [filters.source.examTemplateId as ('bagrut' | 'mahat')] : 
            []}
          onChange={handleSourceChange}
          options={[
            { label: 'בגרות', value: 'bagrut' },
            { label: 'מכינה', value: 'mahat' }
          ]}
        />
      </div>
    </div>
  );
}; 