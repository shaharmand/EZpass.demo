import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Space, Typography, Select, Rate, Input } from 'antd';
import styled from 'styled-components';
import { DatabaseQuestion } from '../../../../../../types/question';
import { EditableWrapper } from '../../../../../../components/shared/EditableWrapper';
import { universalTopicsV2 } from '../../../../../../services/universalTopics';
import { getQuestionSourceDisplay } from '../../../../../../utils/translations';
import { SourceType } from '../../../../../../types/question';
import { SourceEditor } from '../../../../../../components/shared/SourceEditor';

const { Text } = Typography;

const MetadataLabel = styled(Text)`
  font-size: 13px;
  color: #9ca3af;
  display: block;
  margin-bottom: 4px;
`;

const MetadataValue = styled(Text)`
  font-size: 15px;
  color: #000000;
  display: block;
  font-weight: 500;
`;

const MetadataItem = styled.div`
  &:not(:last-child) {
    margin-bottom: 24px;
  }
`;

const EditableFieldWrapper = styled.div`
  position: relative;
  padding-right: 24px; // Add space for the X button
  
  .ant-select, .ant-input-number, .ant-input, .rate-wrapper {
    padding-right: 28px; // Add padding to prevent text overlap with X
  }

  .close-button {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #f0f0f0;
    cursor: pointer;
    color: #8c8c8c;
    font-size: 12px;
    transition: all 0.2s;
    
    &:hover {
      background: #d9d9d9;
      color: #595959;
    }
  }
`;

const TopicSelectGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SubtopicSelect = styled(Select)`
  margin-top: 4px;
`;

interface TopicValue {
  topicId: string | undefined;
  subtopicId: string | undefined;
}

interface TopicMetadata {
  topicId: string | null;
  subtopicId: string | null;
}

const getDifficultyLabel = (difficulty: number): string => {
  switch (difficulty) {
    case 1:
      return `קל מאוד (${difficulty})`;
    case 2:
      return `קל (${difficulty})`;
    case 3:
      return `בינוני (${difficulty})`;
    case 4:
      return `קשה (${difficulty})`;
    case 5:
      return `קשה מאוד (${difficulty})`;
    default:
      return 'לא מוגדר';
  }
};

const difficultyOptions = [
  { value: 1, label: 'קל מאוד (1)' },
  { value: 2, label: 'קל (2)' },
  { value: 3, label: 'בינוני (3)' },
  { value: 4, label: 'קשה (4)' },
  { value: 5, label: 'קשה מאוד (5)' }
];

export interface MetadataSectionHandle {
  resetChanges: () => void;
}

export interface MetadataSectionProps {
  question: DatabaseQuestion;
  onContentChange: (changes: Partial<DatabaseQuestion>) => void;
  onFieldBlur?: () => void;
}

export const MetadataSection = forwardRef<MetadataSectionHandle, MetadataSectionProps>(({
  question,
  onContentChange,
  onFieldBlur
}, ref) => {
  const [editableFields, setEditableFields] = useState({
    topic: false,
    difficulty: false,
    estimatedTime: false,
    source: false
  });

  // Expose reset method
  useImperativeHandle(ref, () => ({
    resetChanges: () => {
      console.log('[Metadata] Reset changes called');
      setEditableFields({
        topic: false,
        difficulty: false,
        estimatedTime: false,
        source: false
      });
    }
  }));

  const handleMetadataChange = (property: string, value: any) => {
    console.log(`[Metadata] ${property} changed:`, value);
    onContentChange({
      data: {
        ...question.data,
        metadata: {
          ...question.data.metadata,
          [property]: value
        }
      }
    });
  };

  const handleTopicChange = (topicValue: TopicValue) => {
    console.log('[Metadata] Topic/Subtopic changed:', topicValue);
    
    // Only include defined values in the update
    const updates: Partial<typeof question.data.metadata> = {};
    if (topicValue.topicId !== undefined) {
      updates.topicId = topicValue.topicId;
    }
    if (topicValue.subtopicId !== undefined) {
      updates.subtopicId = topicValue.subtopicId;
    }
    
    onContentChange({
      data: {
        ...question.data,
        metadata: {
          ...question.data.metadata,
          ...updates
        }
      }
    });
  };

  const domain = universalTopicsV2.getDomainSafe(
    question.data.metadata.subjectId,
    question.data.metadata.domainId
  );
  
  const topic = domain?.topics.find(t => t.id === question.data.metadata.topicId);
  const subtopics = topic?.subTopics || [];

  // Get the subtopic name directly from the domain
  const getSubtopicName = (subtopicId: string) => {
    return domain?.topics
      .flatMap(t => t.subTopics)
      .find(st => st.id === subtopicId)?.name;
  };

  const validateTopic = (value: TopicValue) => {
    return !!value.topicId;
  };

  const validateDifficulty = (value: number) => {
    return value >= 1 && value <= 5;
  };

  const validateEstimatedTime = (value: number) => {
    return value > 0;
  };

  const validateSource = (value: any) => {
    return !!value?.type;
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <EditableWrapper
        label={<MetadataLabel>נושא ותת-נושא</MetadataLabel>}
        fieldPath="metadata"
        placeholder="בחר נושא..."
        onValueChange={(value: TopicValue) => handleTopicChange(value)}
        onBlur={onFieldBlur}
        validate={validateTopic}
        isEditing={editableFields.topic}
        onStartEdit={() => {
          console.log('[Metadata] Starting topic/subtopic edit');
          setEditableFields(prev => ({ ...prev, topic: true }));
        }}
        onCancelEdit={() => {
          console.log('[Metadata] Canceling topic/subtopic edit');
          setEditableFields(prev => ({ ...prev, topic: false }));
        }}
        renderEditMode={(value: any, onChange) => {
          // Extract current values from metadata
          const currentValue: TopicValue = {
            topicId: value?.topicId,
            subtopicId: value?.subtopicId
          };
          
          return (
            <TopicSelectGroup>
              <Select
                value={currentValue.topicId}
                onChange={(topicId) => {
                  // When topic changes, select the first subtopic if available
                  const newTopic = domain?.topics.find(t => t.id === topicId);
                  const firstSubtopic = newTopic?.subTopics?.[0];
                  
                  onChange({
                    ...value,
                    topicId,
                    subtopicId: firstSubtopic?.id
                  });
                }}
                style={{ width: '100%' }}
                placeholder="בחר נושא..."
                options={domain?.topics.map(t => ({
                  label: t.name,
                  value: t.id
                }))}
              />
              <SubtopicSelect
                value={currentValue.subtopicId}
                onChange={(subtopicId) => {
                  onChange({ ...value, subtopicId });
                }}
                style={{ width: '100%' }}
                options={subtopics.map(st => ({
                  label: st.name,
                  value: st.id
                }))}
                disabled={!currentValue.topicId || subtopics.length === 0}
                placeholder={!currentValue.topicId ? 'יש לבחור נושא תחילה' : 'בחר תת-נושא'}
              />
            </TopicSelectGroup>
          );
        }}
        renderDisplayMode={(value: any) => {
          const topicName = domain?.topics.find(t => t.id === value?.topicId)?.name;
          const subtopicName = value?.subtopicId ? getSubtopicName(value.subtopicId) : undefined;
          
          if (!topicName) return <MetadataValue>לא נבחר נושא</MetadataValue>;
          
          return (
            <MetadataValue>
              {subtopicName ? (
                <>
                  {subtopicName}
                  {` (${topicName})`}
                </>
              ) : (
                topicName
              )}
            </MetadataValue>
          );
        }}
      />

      <EditableWrapper
        label={<MetadataLabel>רמת קושי</MetadataLabel>}
        fieldPath="metadata.difficulty"
        placeholder="בחר רמת קושי..."
        onValueChange={(value) => handleMetadataChange('difficulty', value)}
        onBlur={onFieldBlur}
        validate={validateDifficulty}
        isEditing={editableFields.difficulty}
        onStartEdit={() => {
          console.log('[Metadata] Starting difficulty edit');
          setEditableFields(prev => ({ ...prev, difficulty: true }));
        }}
        onCancelEdit={() => {
          console.log('[Metadata] Canceling difficulty edit');
          setEditableFields(prev => ({ ...prev, difficulty: false }));
        }}
        renderEditMode={(value, onChange) => (
          <Select
            value={value}
            onChange={onChange}
            style={{ width: '100%' }}
            options={difficultyOptions}
            placeholder="בחר רמת קושי..."
          />
        )}
        renderDisplayMode={(value) => (
          <MetadataValue>
            {getDifficultyLabel(value)}
          </MetadataValue>
        )}
      />

      <EditableWrapper
        label={<MetadataLabel>זמן מוערך</MetadataLabel>}
        fieldPath="metadata.estimatedTime"
        placeholder="הזן זמן מוערך..."
        onValueChange={(value) => handleMetadataChange('estimatedTime', value)}
        onBlur={onFieldBlur}
        validate={validateEstimatedTime}
        isEditing={editableFields.estimatedTime}
        onStartEdit={() => {
          console.log('[Metadata] Starting estimatedTime edit');
          setEditableFields(prev => ({ ...prev, estimatedTime: true }));
        }}
        onCancelEdit={() => {
          console.log('[Metadata] Canceling estimatedTime edit');
          setEditableFields(prev => ({ ...prev, estimatedTime: false }));
        }}
        renderEditMode={(value, onChange) => (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{ width: '100px' }}
            suffix="דקות"
          />
        )}
        renderDisplayMode={(value) => (
          <MetadataValue>{value ? `${value} דקות` : 'לא הוגדר זמן'}</MetadataValue>
        )}
      />

      <EditableWrapper
        label={<MetadataLabel>מקור</MetadataLabel>}
        fieldPath="metadata.source"
        placeholder="בחר מקור..."
        onValueChange={(value) => handleMetadataChange('source', value)}
        onBlur={onFieldBlur}
        validate={validateSource}
        isEditing={editableFields.source}
        onStartEdit={() => {
          console.log('[Metadata] Starting source edit');
          setEditableFields(prev => ({ ...prev, source: true }));
        }}
        onCancelEdit={() => {
          console.log('[Metadata] Canceling source edit');
          setEditableFields(prev => ({ ...prev, source: false }));
        }}
        renderEditMode={(value, onChange) => (
          <SourceEditor
            value={value}
            onChange={onChange}
            initialValue={value}
            domainId={question.data.metadata.domainId}
          />
        )}
        renderDisplayMode={(value) => {
          if (!value || !('type' in value)) return <MetadataValue>לא הוגדר מקור</MetadataValue>;
          
          return <MetadataValue>
            {getQuestionSourceDisplay({
              sourceType: value.type === 'exam' ? SourceType.EXAM : SourceType.EZPASS,
              ...(value.type === 'exam' ? {
                examTemplateId: value.examTemplateId,
                year: value.year,
                period: value.period,
                moed: value.moed,
                order: value.order
              } : {
                creatorType: value.creatorType
              })
            })}
          </MetadataValue>;
        }}
      />
    </Space>
  );
}); 