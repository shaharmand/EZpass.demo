import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Typography, Space, Rate, InputNumber, Select } from 'antd';
import { QuestionType } from '../../../../types/question';
import { universalTopicsV2 } from '../../../../services/universalTopics';

const { Text } = Typography;

const PanelSection = styled.div`
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }

  .ant-rate {
    font-size: 16px;
    direction: ltr;
    
    .ant-rate-star:not(:last-child) {
      margin-inline-end: 4px;
    }
  }

  .time-input {
    width: 100%;
  }

  .source-select {
    width: 100%;
  }
`;

const SectionTitle = styled(Text)`
  display: block;
  font-weight: 500;
  margin-bottom: 12px;
  color: #262626;
`;

const SectionDescription = styled(Text)`
  display: block;
  font-size: 13px;
  color: #595959;
  margin-bottom: 8px;
`;

interface PropertiesPanelProps {
  type: QuestionType;
  topicId?: string;
  subtopicId?: string;
  difficulty?: number;
  estimatedTime?: number;
  source?: {
    type: string;
    period?: string;
    moed?: string;
  };
  subjectId: string;
  domainId: string;
  isEditing: boolean;
  onPropertyChange: (property: string, value: any) => void;
}

const SOURCE_TYPES = [
  { value: 'bagrut', label: 'בגרות' },
  { value: 'meitzav', label: 'מיצב' },
  { value: 'practice', label: 'תרגול' },
  { value: 'exam', label: 'מבחן' },
  { value: 'other', label: 'אחר' }
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  type,
  topicId,
  subtopicId,
  difficulty = 1,
  estimatedTime = 5,
  source,
  subjectId,
  domainId,
  isEditing,
  onPropertyChange
}) => {
  const domain = universalTopicsV2.getDomainSafe(subjectId, domainId);
  
  const topics = useMemo(() => {
    if (!domain) return [];
    return domain.topics.map(topic => ({
      label: topic.name,
      value: topic.id
    }));
  }, [domain]);

  const subtopics = useMemo(() => {
    if (!domain || !topicId) return [];
    const topic = domain.topics.find(t => t.id === topicId);
    return topic?.subTopics.map(subtopic => ({
      label: subtopic.name,
      value: subtopic.id
    })) || [];
  }, [domain, topicId]);

  const handleTopicChange = (newTopicId: string | null) => {
    onPropertyChange('topicId', newTopicId);
    onPropertyChange('subtopicId', null); // Clear subtopic when topic changes
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <PanelSection>
        <SectionTitle>נושא</SectionTitle>
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          <Select
            className="topic-select"
            value={topicId}
            onChange={handleTopicChange}
            disabled={!isEditing}
            options={topics}
            placeholder="בחר נושא"
            style={{ width: '100%' }}
            allowClear
            showSearch
            optionFilterProp="label"
          />
          {topicId && (
            <Select
              className="subtopic-select"
              value={subtopicId}
              onChange={value => onPropertyChange('subtopicId', value)}
              disabled={!isEditing}
              options={subtopics}
              placeholder="בחר תת-נושא"
              style={{ width: '100%' }}
              allowClear
              showSearch
              optionFilterProp="label"
            />
          )}
        </Space>
      </PanelSection>

      <PanelSection>
        <SectionTitle>רמת קושי</SectionTitle>
        <SectionDescription>דרג את רמת הקושי של השאלה מ-1 עד 5</SectionDescription>
        <Rate 
          value={difficulty} 
          onChange={value => onPropertyChange('difficulty', value)}
          disabled={!isEditing}
        />
      </PanelSection>

      <PanelSection>
        <SectionTitle>זמן מוערך (דקות)</SectionTitle>
        <SectionDescription>הערך את הזמן הדרוש לפתרון השאלה</SectionDescription>
        <InputNumber
          className="time-input"
          min={1}
          max={60}
          value={estimatedTime}
          onChange={value => onPropertyChange('estimatedTime', value)}
          disabled={!isEditing}
          addonAfter="דקות"
        />
      </PanelSection>

      <PanelSection>
        <SectionTitle>מקור</SectionTitle>
        <SectionDescription>בחר את מקור השאלה</SectionDescription>
        <Select
          className="source-select"
          value={source?.type}
          onChange={value => onPropertyChange('source', { ...source, type: value })}
          disabled={!isEditing}
          options={SOURCE_TYPES}
          placeholder="בחר מקור"
        />
      </PanelSection>
    </Space>
  );
}; 