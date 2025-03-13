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

const getDifficultyLabel = (difficulty: number): string => {
  switch (difficulty) {
    case 1:
      return 'קל מאוד';
    case 2:
      return 'קל';
    case 3:
      return 'בינוני';
    case 4:
      return 'קשה';
    case 5:
      return 'קשה מאוד';
    default:
      return 'לא מוגדר';
  }
};

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
    topicId: false,
    subtopicId: false,
    difficulty: false,
    estimatedTime: false,
    source: false
  });

  // Expose reset method
  useImperativeHandle(ref, () => ({
    resetChanges: () => {
      console.log('[Metadata] Reset changes called');
      setEditableFields({
        topicId: false,
        subtopicId: false,
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

  const validateTopic = (value: string) => {
    return !!value;
  };

  const validateSubtopic = (value: string) => {
    return !!value;
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
        label={<MetadataLabel>נושא</MetadataLabel>}
        fieldPath="metadata.topicId"
        placeholder="בחר נושא..."
        onValueChange={(value) => handleMetadataChange('topicId', value)}
        onBlur={onFieldBlur}
        validate={validateTopic}
        isEditing={editableFields.topicId}
        onStartEdit={() => {
          console.log('[Metadata] Starting topic edit');
          setEditableFields(prev => ({ ...prev, topicId: true }));
        }}
        onCancelEdit={() => {
          console.log('[Metadata] Canceling topic edit');
          setEditableFields(prev => ({ ...prev, topicId: false }));
        }}
        renderEditMode={(value, onChange) => (
          <Select
            value={value}
            onChange={onChange}
            style={{ width: '100%' }}
            options={domain?.topics.map(t => ({
              label: t.name,
              value: t.id
            }))}
          />
        )}
        renderDisplayMode={(value) => (
          <MetadataValue>{topic?.name || value}</MetadataValue>
        )}
      />

      <EditableWrapper
        label={<MetadataLabel>תת-נושא</MetadataLabel>}
        fieldPath="metadata.subtopicId"
        placeholder="בחר תת-נושא..."
        onValueChange={(value) => handleMetadataChange('subtopicId', value)}
        onBlur={onFieldBlur}
        validate={validateSubtopic}
        isEditing={editableFields.subtopicId}
        onStartEdit={() => {
          console.log('[Metadata] Starting subtopic edit');
          setEditableFields(prev => ({ ...prev, subtopicId: true }));
        }}
        onCancelEdit={() => {
          console.log('[Metadata] Canceling subtopic edit');
          setEditableFields(prev => ({ ...prev, subtopicId: false }));
        }}
        renderEditMode={(value, onChange) => (
          <Select
            value={value}
            onChange={onChange}
            style={{ width: '100%' }}
            options={subtopics.map(st => ({
              label: st.name,
              value: st.id
            }))}
            disabled={!topic || subtopics.length === 0}
            placeholder={!topic ? 'יש לבחור נושא תחילה' : 'בחר תת-נושא'}
          />
        )}
        renderDisplayMode={(value) => {
          const subtopicName = value ? getSubtopicName(value) : null;
          return <MetadataValue>{subtopicName || 'לא נבחר תת-נושא'}</MetadataValue>;
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
          <div style={{ 
            background: 'white',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            padding: '4px 11px'
          }}>
            <Rate
              value={value}
              onChange={onChange}
              style={{ width: '100%' }}
            />
          </div>
        )}
        renderDisplayMode={(value) => (
          <Space size={8} align="center">
            <Rate value={value} disabled />
            <Text>{getDifficultyLabel(value)}</Text>
          </Space>
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
            style={{ width: '100%' }}
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
                season: value.period,
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