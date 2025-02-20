import React from 'react';
import { Collapse, Slider, Select, Switch, Space, Typography, Divider } from 'antd';
import type { FilterState, DifficultyLevel } from '../../types/question';

const { Panel } = Collapse;
const { Text } = Typography;

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  1: 'קל מאוד',
  2: 'קל',
  3: 'בינוני',
  4: 'קשה',
  5: 'קשה מאוד'
};

interface QuestionFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  expanded: boolean;
}

export const QuestionFilter: React.FC<QuestionFilterProps> = ({
  filters,
  onChange,
  expanded
}) => {
  const handleDifficultyChange = (value: [number, number]) => {
    // Convert the tuple to an array of DifficultyLevels
    const difficultyArray = Array.from(
      { length: value[1] - value[0] + 1 },
      (_, i) => {
        const level = value[0] + i;
        // Ensure the value is a valid DifficultyLevel (1-5)
        if (level >= 1 && level <= 5) {
          return level as DifficultyLevel;
        }
        return null;
      }
    ).filter((v): v is DifficultyLevel => v !== null);
    
    onChange({ ...filters, difficulty: difficultyArray });
  };

  const handleTopicsChange = (value: string[]) => {
    onChange({ ...filters, topics: value });
  };

  const handleTypeChange = (value: string[]) => {
    onChange({ ...filters, questionTypes: value });
  };

  const handleTimeLimitChange = (value: [number, number]) => {
    onChange({ ...filters, timeLimit: value });
  };

  const handleLanguageChange = (value: string[]) => {
    onChange({ ...filters, programmingLanguages: value });
  };

  // Convert difficulty array to range tuple
  const getDifficultyRange = (): [number, number] => {
    if (!filters.difficulty?.length) return [1, 5];
    const validDifficulties = filters.difficulty.map(d => 
      typeof d === 'string' ? parseInt(d) : d
    ).filter((d): d is DifficultyLevel => d >= 1 && d <= 5);
    return [
      Math.min(...validDifficulties),
      Math.max(...validDifficulties)
    ];
  };

  return (
    <Collapse 
      defaultActiveKey={['difficulty', 'topics']} 
      className="question-filter-collapse"
      bordered={false}
    >
      <Panel 
        header={
          <Text strong>רמת קושי</Text>
        } 
        key="difficulty"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Slider
            range
            min={1}
            max={5}
            step={1}
            value={getDifficultyRange()}
            onChange={handleDifficultyChange}
            marks={DIFFICULTY_LABELS}
          />
        </Space>
      </Panel>

      <Panel 
        header={
          <Text strong>נושאים</Text>
        } 
        key="topics"
      >
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="בחר נושאים"
          value={filters.topics}
          onChange={handleTopicsChange}
          options={[
            { label: 'אלגברה', value: 'algebra' },
            { label: 'גיאומטריה', value: 'geometry' },
            { label: 'טריגונומטריה', value: 'trigonometry' },
            { label: 'חדו"א', value: 'calculus' },
            { label: 'וקטורים', value: 'vectors' },
            { label: 'הסתברות', value: 'probability' }
          ]}
        />
      </Panel>

      <Panel 
        header={
          <Text strong>סוג שאלה</Text>
        } 
        key="type"
      >
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="בחר סוגי שאלות"
          value={filters.questionTypes}
          onChange={handleTypeChange}
          options={[
            { label: 'רב-ברירה', value: 'multiple_choice' },
            { label: 'פתוח', value: 'open' },
            { label: 'קוד', value: 'code' },
            { label: 'שלב אחר שלב', value: 'step_by_step' }
          ]}
        />
      </Panel>

      {expanded && (
        <>
          <Panel 
            header={
              <Text strong>הגבלת זמן</Text>
            } 
            key="time"
          >
            <Slider
              range
              min={1}
              max={60}
              value={filters.timeLimit || [1, 30]}
              onChange={handleTimeLimitChange}
              marks={{
                1: '1 דק׳',
                15: '15 דק׳',
                30: '30 דק׳',
                45: '45 דק׳',
                60: 'שעה'
              }}
            />
          </Panel>

          <Panel 
            header={
              <Text strong>שפות תכנות</Text>
            }
            key="languages"
          >
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="בחר שפות תכנות"
              value={filters.programmingLanguages}
              onChange={handleLanguageChange}
              options={[
                { label: 'Python', value: 'python' },
                { label: 'JavaScript', value: 'javascript' },
                { label: 'Java', value: 'java' },
                { label: 'C#', value: 'csharp' },
                { label: 'C++', value: 'cpp' }
              ]}
            />
          </Panel>

          <Panel 
            header={
              <Text strong>מאפיינים נוספים</Text>
            } 
            key="additional"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0'
              }}>
                <Text>כולל מקרי בדיקה</Text>
                <Switch
                  checked={filters.hasTestCases}
                  onChange={checked => onChange({ ...filters, hasTestCases: checked })}
                />
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0'
              }}>
                <Text>הצג פתרון מלא</Text>
                <Switch defaultChecked />
              </div>
            </Space>
          </Panel>
        </>
      )}
    </Collapse>
  );
}; 