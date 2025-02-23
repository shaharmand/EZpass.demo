import React from 'react';
import { Space, Select, Slider, Switch, Tree, Typography, Divider, Button, Tooltip } from 'antd';
import { StarFilled, StarOutlined } from '@ant-design/icons';
import type { FilterState, DifficultyLevel, QuestionType } from '../../types/question';
import type { DataNode } from 'antd/es/tree';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import { Topic } from '../../types/subject';

const { Text } = Typography;

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
  const { activePrep } = useStudentPrep();

  // Difficulty options with colors and labels
  const difficultyOptions = [
    { value: 1, label: 'קל מאוד' },
    { value: 2, label: 'קל' },
    { value: 3, label: 'בינוני' },
    { value: 4, label: 'קשה' },
    { value: 5, label: 'קשה מאוד' }
  ];

  const renderDifficultyOption = (option: { value: number; label: string; color: string }) => (
    <div className="difficulty-option">
      <div className="stars">
        {[...Array(option.value)].map((_, i) => (
          <StarFilled key={i} style={{ color: option.color, fontSize: '12px' }} />
        ))}
        {[...Array(5 - option.value)].map((_, i) => (
          <StarOutlined key={i} style={{ color: '#d1d5db', fontSize: '12px' }} />
        ))}
      </div>
      <Text className="option-label">{option.label}</Text>
    </div>
  );

  const handleDifficultyChange = (values: number[]) => {
    const validDifficulties = values.map(v => Math.max(1, Math.min(5, v)) as DifficultyLevel);
    onChange({ ...filters, difficulty: validDifficulties });
  };

  // Convert exam topics to Tree data structure
  const getTreeData = (): DataNode[] => {
    if (!activePrep?.exam.topics) return [];
    
    return activePrep.exam.topics.map((topic: Topic) => ({
      title: (
        <Tooltip 
          title={topic.description}
          mouseEnterDelay={0.5}
          placement="right"
        >
          <span>{topic.name}</span>
        </Tooltip>
      ),
      key: topic.id,
      children: topic.subTopics.map(subTopic => ({
        title: (
          <Tooltip 
            title={
              <div>
                <div>{subTopic.description}</div>
                {subTopic.typicalQuestions && subTopic.typicalQuestions.length > 0 && (
                  <>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <Text strong>שאלות אופייניות:</Text>
                      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        {subTopic.typicalQuestions.map((question: string, index: number) => (
                          <li key={index}>{question}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            }
            mouseEnterDelay={0.5}
            placement="right"
          >
            <span>{subTopic.name}</span>
          </Tooltip>
        ),
        key: subTopic.id,
        isLeaf: true
      }))
    }));
  };

  // Handle topic/subtopic selection
  const handleTopicSelect = (
    checked: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] }
  ) => {
    const selectedKeys = Array.isArray(checked) ? checked : checked.checked;
    const topics: string[] = [];
    const subTopics: string[] = [];
    
    selectedKeys.forEach(key => {
      const keyStr = String(key);
      const isTopic = activePrep?.exam.topics.some((t: Topic) => t.id === keyStr);
      if (isTopic) {
        topics.push(keyStr);
      } else {
        subTopics.push(keyStr);
      }
    });

    onChange({
      ...filters,
      topics,
      subTopics
    });
  };

  const questionTypes = [
    { label: 'סגורות', value: 'multiple_choice' as QuestionType },
    { label: 'פתוח', value: 'open' as QuestionType },
    { label: 'קוד', value: 'code' as QuestionType },
    { label: 'חישובית', value: 'step_by_step' as QuestionType }
  ];

  const getAvailableQuestionTypes = () => {
    const allowedTypes = activePrep?.exam.allowedQuestionTypes || [];
    return questionTypes.filter(type => allowedTypes.includes(type.value));
  };

  const handleTypeToggle = (type: QuestionType) => {
    const currentTypes = filters.questionTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    // If no types selected, remove the questionTypes filter entirely
    if (newTypes.length === 0) {
      const { questionTypes, ...restFilters } = filters;
      onChange(restFilters);  // This removes questionTypes completely instead of setting it to []
      return;
    }
    
    onChange({ ...filters, questionTypes: newTypes });
  };

  const handleSourceChange = (sources: Array<'bagrut' | 'mahat'>) => {
    if (!sources.length) {
      const { source, ...rest } = filters;
      onChange(rest);
    } else {
      onChange({ ...filters, source: { examType: sources[0] } });
    }
  };

  // Check if we're showing all types (no filter)
  const isShowingAllTypes = !filters.questionTypes || filters.questionTypes.length === 0 ||
    filters.questionTypes.length === getAvailableQuestionTypes().length;

  return (
    <div className="question-filter">
      {/* Topics Tree - First Priority */}
      <div className="filter-section">
        <Text strong>נושאים</Text>
        <Tree
          checkable
          treeData={getTreeData()}
          checkedKeys={[...(filters.topics || []), ...(filters.subTopics || [])]}
          onCheck={handleTopicSelect}
          className="topic-tree"
        />
      </div>

      <Divider />

      {/* Question Type - Second Priority */}
      <div className="filter-section">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>סוג שאלה</Text>
          <div className="type-buttons">
            <Button.Group className="type-button-group">
              {questionTypes.map(type => {
                const allowedTypes = activePrep?.exam.allowedQuestionTypes || [];
                const isAllowed = allowedTypes.includes(type.value);
                return (
                  <Button
                    key={type.value}
                    type={(filters.questionTypes || []).includes(type.value) ? 'primary' : 'default'}
                    onClick={() => handleTypeToggle(type.value)}
                    disabled={!isAllowed}
                    className="type-button"
                  >
                    {type.label}
                  </Button>
                );
              })}
            </Button.Group>
          </div>
        </Space>
      </div>

      <Divider />

      {/* Source - Third Priority */}
      <div className="filter-section">
        <Text strong>מקור</Text>
        <div className="source-selection">
          <div className="exam-type-buttons">
            <Button.Group>
              <Button
                type={filters.source?.examType === 'bagrut' ? 'primary' : 'default'}
                onClick={() => handleSourceChange(['bagrut'])}
              >
                בגרות
              </Button>
              <Button
                type={filters.source?.examType === 'mahat' ? 'primary' : 'default'}
                onClick={() => handleSourceChange(['mahat'])}
              >
                מה״ט
              </Button>
            </Button.Group>
          </div>

          {filters.source?.examType && (
            <div className="exam-details">
              <Select
                style={{ width: 100 }}
                placeholder="שנה"
                value={filters.source.year}
                onChange={(year) => onChange({
                  ...filters,
                  source: { ...filters.source!, year: year }
                })}
                options={[
                  { label: '2024', value: 2024 },
                  { label: '2023', value: 2023 },
                  { label: '2022', value: 2022 },
                  { label: '2021', value: 2021 },
                  { label: '2020', value: 2020 }
                ]}
              />
              <Select
                style={{ width: 100 }}
                placeholder="עונה"
                value={filters.source.season}
                onChange={(season) => onChange({
                  ...filters,
                  source: { ...filters.source!, season }
                })}
                options={[
                  { label: 'חורף', value: 'winter' },
                  { label: 'קיץ', value: 'summer' }
                ]}
              />
              <Select
                style={{ width: 100 }}
                placeholder="מועד"
                value={filters.source.moed}
                onChange={(moed) => onChange({
                  ...filters,
                  source: { ...filters.source!, moed }
                })}
                options={[
                  { label: 'מועד א׳', value: 'a' },
                  { label: 'מועד ב׳', value: 'b' },
                  { label: 'מועד ג׳', value: 'c' }
                ]}
              />
            </div>
          )}
        </div>
      </div>

      <Divider />

      {/* Difficulty Section - Fourth Priority */}
      <div className="filter-section">
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong>התמקדות ברמת קושי</Text>
          <Switch
            checked={!!filters.difficulty}
            onChange={(checked) => {
              if (!checked) {
                const { difficulty, ...rest } = filters;
                onChange(rest);
              } else {
                onChange({ ...filters, difficulty: [3] });
              }
            }}
          />
        </Space>
        {filters.difficulty && (
          <div className="difficulty-buttons">
            <Button.Group className="difficulty-button-group">
              {difficultyOptions.map(option => (
                <Button
                  key={option.value}
                  type={filters.difficulty?.[0] === option.value ? 'primary' : 'default'}
                  onClick={() => onChange({ ...filters, difficulty: [option.value as DifficultyLevel] })}
                  className="difficulty-button"
                >
                  <div className="difficulty-button-content">
                    <div className="stars">
                      {[...Array(option.value)].map((_, i) => (
                        <StarFilled key={i} style={{ 
                          color: filters.difficulty?.[0] === option.value ? '#2563eb' : '#6b7280', 
                          fontSize: '12px' 
                        }} />
                      ))}
                      {[...Array(5 - option.value)].map((_, i) => (
                        <StarOutlined key={i} style={{ 
                          color: filters.difficulty?.[0] === option.value ? '#2563eb' : '#d1d5db', 
                          fontSize: '12px' 
                        }} />
                      ))}
                    </div>
                    <Text className="difficulty-label">{option.label}</Text>
                  </div>
                </Button>
              ))}
            </Button.Group>
          </div>
        )}
      </div>

      <Divider />

      {/* Time Limit - Last Priority */}
      <div className="filter-section">
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong>הגבלת זמן</Text>
          <Switch
            checked={!!filters.timeLimit}
            onChange={(checked) => {
              if (!checked) {
                const { timeLimit, ...rest } = filters;
                onChange(rest);
              } else {
                onChange({ ...filters, timeLimit: [5, 15] });  // Default to 5-15 minutes range
              }
            }}
          />
        </Space>
        {filters.timeLimit && (
          <div className="time-limit-buttons">
            <Button.Group className="time-button-group">
              <Button
                type={filters.timeLimit[1] <= 5 ? 'primary' : 'default'}
                onClick={() => onChange({ ...filters, timeLimit: [1, 5] })}
                className="time-button"
              >
                עד 5 דק׳
              </Button>
              <Button
                type={filters.timeLimit[1] <= 15 && filters.timeLimit[1] > 5 ? 'primary' : 'default'}
                onClick={() => onChange({ ...filters, timeLimit: [5, 15] })}
                className="time-button"
              >
                5-15 דק׳
              </Button>
              <Button
                type={filters.timeLimit[1] <= 30 && filters.timeLimit[1] > 15 ? 'primary' : 'default'}
                onClick={() => onChange({ ...filters, timeLimit: [15, 30] })}
                className="time-button"
              >
                15-30 דק׳
              </Button>
              <Button
                type={filters.timeLimit[1] > 30 ? 'primary' : 'default'}
                onClick={() => onChange({ ...filters, timeLimit: [30, 60] })}
                className="time-button"
              >
                30+ דק׳
              </Button>
            </Button.Group>
          </div>
        )}
      </div>

      <style>
        {`
          .question-filter {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .filter-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .topic-tree {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
          }

          .ant-tree-treenode {
            padding: 4px 0 !important;
          }

          .ant-tree-node-content-wrapper {
            flex: 1;
          }

          /* Tree component styling */
          .ant-tree-checkbox-checked .ant-tree-checkbox-inner {
            background-color: #2563eb !important;
            border-color: #2563eb !important;
          }

          .ant-tree-checkbox-indeterminate .ant-tree-checkbox-inner {
            background-color: #2563eb !important;
            border-color: #2563eb !important;
          }

          .ant-tree-checkbox:hover .ant-tree-checkbox-inner {
            border-color: #2563eb !important;
          }

          .ant-tree-node-content-wrapper:hover {
            background-color: rgba(37, 99, 235, 0.1) !important;
          }

          .ant-tree-node-selected {
            background-color: rgba(37, 99, 235, 0.1) !important;
          }

          .ant-tree-checkbox-indeterminate .ant-tree-checkbox-inner::after {
            background-color: white !important;
          }

          .type-buttons {
            display: flex;
            justify-content: flex-start;
            width: 100%;
          }

          .type-button-group {
            display: inline-flex;
            border-radius: 8px;
            overflow: visible;
          }

          .type-button {
            height: 32px;
            padding: 0 16px;
            font-size: 14px;
            border: 1px solid #e5e7eb;
            transition: all 0.2s ease;
            border-radius: 0;
            position: relative;
          }

          .type-button:not(:first-child) {
            margin-left: -1px;
          }

          .type-button:first-child {
            border-start-start-radius: 8px;
            border-end-start-radius: 8px;
          }

          .type-button:last-child {
            border-start-end-radius: 8px;
            border-end-end-radius: 8px;
          }

          .type-button:not(.ant-btn-primary) {
            background: white;
            border-color: #e5e7eb;
            color: #6b7280;
          }

          .type-button:not(.ant-btn-primary):hover {
            color: #2563eb;
            border-color: #2563eb;
            z-index: 1;
          }

          .type-button.ant-btn-primary {
            background: #EEF2FF;
            border-color: #2563eb;
            color: #2563eb;
            z-index: 2;
            border-width: 1.5px;
          }

          .type-button:not(.ant-btn-primary):hover {
            color: #2563eb;
            border-color: #2563eb;
            z-index: 1;
            position: relative;
          }

          .ant-select {
            width: 100%;
          }

          .source-selection {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .exam-type-buttons {
            display: flex;
            justify-content: flex-start;
          }

          .exam-type-buttons .ant-btn-group {
            border-radius: 8px;
            overflow: visible;
          }

          .exam-type-buttons button {
            min-width: 100px;
            height: 32px;
            font-size: 14px;
            border: 1px solid #e5e7eb;
            transition: all 0.2s ease;
            position: relative;
          }

          .exam-type-buttons button:not(.ant-btn-primary) {
            background: white;
            border-color: #e5e7eb;
            color: #6b7280;
          }

          .exam-type-buttons button:not(.ant-btn-primary):hover {
            color: #2563eb;
            border-color: #2563eb;
            z-index: 1;
          }

          .exam-type-buttons button.ant-btn-primary {
            background: #EEF2FF;
            border-color: #2563eb;
            color: #2563eb;
            z-index: 2;
            border-width: 1.5px;
          }

          .exam-type-buttons button:not(.ant-btn-primary):hover {
            color: #2563eb;
            border-color: #2563eb;
            z-index: 1;
            position: relative;
          }

          .exam-details {
            display: flex;
            gap: 8px;
          }

          /* Difficulty Slider Styling */
          .difficulty-slider {
            padding: 16px 8px 24px;
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            margin-top: 8px;
          }

          .difficulty-mark {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            transform: translateX(50%);
            margin-top: 8px;
            width: 80px;
          }

          .stars {
            display: flex;
            gap: 1px;
          }

          .mark-label {
            font-size: 12px;
            color: #6b7280;
            white-space: nowrap;
          }

          /* Override Ant Design Slider styles */
          .ant-slider {
            margin: 8px 0 0;
          }

          .ant-slider-rail {
            background: #e5e7eb !important;
            height: 4px !important;
          }

          .ant-slider-track {
            background: #2563eb !important;
            height: 4px !important;
          }

          .ant-slider-handle {
            width: 16px !important;
            height: 16px !important;
            border-color: #2563eb !important;
            background: white !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
          }

          .ant-slider-handle:hover {
            border-color: #2563eb !important;
          }

          .ant-slider-handle:focus {
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
          }

          .ant-slider-mark {
            margin-top: 16px !important;
          }

          .ant-slider-mark-text {
            color: #6b7280 !important;
            font-size: 12px !important;
          }

          .ant-slider-mark-text-active {
            color: #1f2937 !important;
          }

          .difficulty-option {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 0;
          }

          .option-label {
            font-size: 14px;
            color: #4b5563;
          }

          .difficulty-select {
            margin-top: 8px;
          }

          .difficulty-select .ant-select-selection-item {
            padding: 0 8px !important;
          }

          .difficulty-buttons {
            display: flex;
            justify-content: flex-start;
            width: 100%;
            margin-top: 8px;
          }

          .difficulty-button-group {
            display: flex;
            width: 100%;
            gap: 0;
            border-radius: 8px;
            overflow: visible;
          }

          .difficulty-button {
            flex: 1;
            height: auto;
            padding: 6px 8px;
            border: 1px solid #e5e7eb;
            transition: all 0.2s ease;
            border-radius: 0 !important;
            background: white;
            min-width: 0;
            position: relative;
          }

          .difficulty-button:not(:first-child) {
            margin-left: -1px;
          }

          .difficulty-button:first-child {
            border-start-start-radius: 8px !important;
            border-end-start-radius: 8px !important;
          }

          .difficulty-button:last-child {
            border-start-end-radius: 8px !important;
            border-end-end-radius: 8px !important;
          }

          .difficulty-button:not(.ant-btn-primary) {
            background: white;
            border-color: #e5e7eb;
            color: #6b7280;
          }

          .difficulty-button:not(.ant-btn-primary):hover {
            color: #2563eb;
            border-color: #2563eb;
            z-index: 1;
          }

          .difficulty-button.ant-btn-primary {
            background: #EEF2FF;
            border-color: #2563eb;
            color: #2563eb;
            z-index: 2;
            border-width: 1.5px;
            position: relative;
          }

          .difficulty-button.ant-btn-primary .stars {
            color: #2563eb;
          }

          .difficulty-button.ant-btn-primary .difficulty-label {
            color: #2563eb;
          }

          .difficulty-button.ant-btn-primary:hover {
            background: #EEF2FF;
            border-color: #2563eb;
            color: #2563eb;
            z-index: 2;
          }

          .difficulty-button:not(.ant-btn-primary):hover {
            color: #2563eb;
            border-color: #2563eb;
            z-index: 1;
            position: relative;
          }

          .difficulty-button-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
          }

          .difficulty-label {
            font-size: 12px;
            color: inherit;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }

          .time-limit-buttons {
            display: flex;
            justify-content: flex-start;
            width: 100%;
            margin-top: 8px;
          }

          .time-button-group {
            display: flex;
            width: 100%;
            border-radius: 8px;
            overflow: visible;
          }

          .time-button {
            flex: 1;
            height: 32px;
            padding: 0 12px;
            font-size: 14px;
            border: 1px solid #e5e7eb;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 0;
            position: relative;
          }

          .time-button:not(:first-child) {
            margin-left: -1px;
          }

          .time-button:first-child {
            border-start-start-radius: 8px;
            border-end-start-radius: 8px;
          }

          .time-button:last-child {
            border-start-end-radius: 8px;
            border-end-end-radius: 8px;
          }

          .time-button:not(.ant-btn-primary) {
            background: white;
            border-color: #e5e7eb;
            color: #6b7280;
          }

          .time-button:not(.ant-btn-primary):hover {
            color: #2563eb;
            border-color: #2563eb;
            z-index: 1;
          }

          .time-button.ant-btn-primary {
            background: #EEF2FF;
            border-color: #2563eb;
            color: #2563eb;
            z-index: 2;
            border-width: 1.5px;
          }

          .time-button:not(.ant-btn-primary):hover {
            color: #2563eb;
            border-color: #2563eb;
            z-index: 1;
            position: relative;
          }

          /* Ensure button borders are always visible */
          .ant-btn-group > .ant-btn {
            position: relative;
          }

          .ant-btn-group > .ant-btn:hover,
          .ant-btn-group > .ant-btn-primary {
            border-color: #2563eb;
          }

          .ant-btn-group > .ant-btn-primary {
            border-width: 1.5px;
            margin: -0.25px;  /* Compensate for thicker border */
          }
        `}
      </style>
    </div>
  );
}; 