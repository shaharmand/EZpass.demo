import React from 'react';
import { Space, Select, Slider, Switch, Tree, Typography, Divider, Button, Tooltip } from 'antd';
import type { FilterState } from '../../types/question';
import type { DataNode } from 'antd/es/tree';
import { useStudentPrep } from '../../contexts/StudentPrepContext';

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

  // Convert exam topics to Tree data structure
  const getTreeData = (): DataNode[] => {
    if (!activePrep?.exam.topics) return [];
    
    return activePrep.exam.topics.map(topic => ({
      title: (
        <Tooltip 
          title={topic.description}
          mouseEnterDelay={0.5}
          placement="right"
        >
          <span>{topic.name}</span>
        </Tooltip>
      ),
      key: topic.topicId,
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
      const isTopic = activePrep?.exam.topics.some(t => t.topicId === keyStr);
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

  const handleTypeToggle = (type: string) => {
    const currentTypes = filters.questionTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
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

  const questionTypes = [
    { label: 'סגורות', value: 'multiple_choice' },
    { label: 'פתוח', value: 'open' },
    { label: 'קוד', value: 'code' },
    { label: 'חישובית', value: 'step_by_step' }
  ];

  // TODO: Filter available question types based on exam type
  const getAvailableQuestionTypes = (examType?: 'bagrut' | 'mahat') => {
    if (!examType) return questionTypes;
    
    // TODO: Implement filtering logic based on exam type
    // For now, return all types except 'code' for formal exams
    return examType ? questionTypes.filter(t => t.value !== 'code') : questionTypes;
  };

  // Check if we're showing all types (no filter)
  const isShowingAllTypes = !filters.questionTypes || filters.questionTypes.length === 0 ||
    filters.questionTypes.length === getAvailableQuestionTypes(filters.source?.examType).length;

  return (
    <div className="question-filter">
      {/* Topics Tree - Most Important */}
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
              {questionTypes.map(type => (
                <Button
                  key={type.value}
                  type={(filters.questionTypes || []).includes(type.value) ? 'primary' : 'default'}
                  onClick={() => handleTypeToggle(type.value)}
                  className="type-button"
                >
                  {type.label}
                </Button>
              ))}
            </Button.Group>
          </div>
        </Space>
      </div>

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

      {/* Time Limit - Optional */}
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
                onChange({ ...filters, timeLimit: [5, 15] });
              }
            }}
          />
        </Space>
        {filters.timeLimit && (
          <Slider
            range
            min={1}
            max={30}
            value={filters.timeLimit}
            onChange={(value) => onChange({ ...filters, timeLimit: value as [number, number] })}
            marks={{
              1: '1 דק׳',
              15: '15 דק׳',
              30: '30 דק׳'
            }}
          />
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

          .type-buttons {
            display: flex;
            justify-content: flex-start;
            width: 100%;
          }

          .type-button-group {
            display: inline-flex;
            border-radius: 8px;
            overflow: hidden;
          }

          .type-button {
            height: 32px;
            padding: 0 16px;
            font-size: 14px;
            border: 1px solid #e5e7eb;
            transition: all 0.2s ease;
            border-radius: 0;
          }

          .type-button:first-child {
            border-start-start-radius: 8px;
            border-end-start-radius: 8px;
          }

          .type-button:last-child {
            border-start-end-radius: 8px;
            border-end-end-radius: 8px;
          }

          .type-button:not(:first-child) {
            margin-left: -1px;
          }

          .type-button:not(.ant-btn-primary) {
            background: white;
            border-color: #e5e7eb;
            color: #6b7280;
          }

          .type-button:not(.ant-btn-primary):hover {
            color: #3b82f6;
            border-color: #3b82f6;
            z-index: 1;
          }

          .type-button.ant-btn-primary {
            background: #3b82f6;
            border-color: #3b82f6;
            z-index: 2;
          }

          .type-button.ant-btn-primary:hover {
            background: #2563eb;
            border-color: #2563eb;
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
            overflow: hidden;
          }

          .exam-type-buttons button {
            min-width: 100px;
            height: 32px;
            font-size: 14px;
          }

          .exam-details {
            display: flex;
            gap: 8px;
          }
        `}
      </style>
    </div>
  );
}; 