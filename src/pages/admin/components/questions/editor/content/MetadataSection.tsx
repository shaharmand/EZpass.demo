import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Space, Typography, Select, Rate, Input, Divider, Spin } from 'antd';
import styled from 'styled-components';
import { DatabaseQuestion } from '../../../../../../types/question';
import { EditableWrapper } from '../../../../../../components/shared/EditableWrapper';
import { universalTopicsV2 } from '../../../../../../services/universalTopics';
import { getQuestionSourceDisplay, enumMappings, translateQuestionType } from '../../../../../../utils/translations';
import { SourceType } from '../../../../../../types/question';
import { SourceEditor } from '../../../../../../components/shared/SourceEditor';
import { BookOutlined, ClockCircleOutlined, StarOutlined, DatabaseOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const MetadataLabel = styled(Text)`
  font-size: 13px;
  color: #9ca3af;
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
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

const SectionTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
  
  .anticon {
    color: #6b7280;
    font-size: 18px;
  }
`;

const TopicSelectGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TopicDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const TopicName = styled(Text)`
  font-size: 13px;
  color: #6b7280;
  margin-right: 12px;
  
  &::before {
    content: '›';
    margin-left: 8px;
    color: #8c8c8c;
  }
`;

const SubtopicName = styled(Text)`
  font-size: 16px;
  color: #1d39c4;
  font-weight: 600;
  margin-bottom: 4px;
`;

const MetadataSectionWrapper = styled.div`
  margin-bottom: 32px;
  position: relative;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ReadOnlyMetadata = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #e5e7eb;
    border-radius: 4px 0 0 4px;
  }
`;

const MetadataRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MetadataKey = styled(Text)`
  font-size: 13px;
  color: #6b7280;
  min-width: 100px;
  font-weight: 500;
`;

const DifficultyDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const DifficultyStars = styled.div`
  color: #fadb14;
  font-size: 16px;
  display: flex;
  gap: 4px;
  margin-right: auto;
  
  .filled {
    color: #fadb14;
    filter: drop-shadow(0 0 2px rgba(250, 219, 20, 0.2));
  }
  
  .empty {
    color: #d9d9d9;
  }
`;

const SourceDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const SourceMain = styled(Text)`
  font-size: 15px;
  color: #000000;
  font-weight: 600;
`;

const SourceDetails = styled(Text)`
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
`;

const EditableField = styled.div`
  position: relative;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    &::before {
      content: '✎';
      position: absolute;
      right: -24px;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
      opacity: 0.5;
    }
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  z-index: 10;
`;

const ValidationMessage = styled.div<{ type: 'error' | 'warning' | 'success' }>`
  font-size: 13px;
  color: ${props => props.type === 'error' ? '#dc2626' : props.type === 'warning' ? '#d97706' : '#059669'};
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
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

  // Remove specific handlers and use a general field change function
  const handleFieldChange = (path: string, value: any) => {
    console.log(`[Metadata] Field changed at path ${path}:`, value);
    
    // Announce changes in the same format as content fields
    const changes: Partial<DatabaseQuestion> = {
      id: question.id,
      data: {
        ...question.data,
        metadata: {
          ...question.data.metadata,
          [path]: value
        }
      }
    };
    onContentChange(changes);
  };

  const domain = universalTopicsV2.getDomainSafe(
    question.data.metadata.subjectId,
    question.data.metadata.domainId
  );
  
  const subject = universalTopicsV2.getSubjectSafe(question.data.metadata.subjectId);
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
    <Space direction="vertical" style={{ width: '100%' }} size={24}>
      <MetadataSectionWrapper>
        <SectionTitle>
          <DatabaseOutlined />
          מידע בסיסי
        </SectionTitle>
        <ReadOnlyMetadata>
          <MetadataRow>
            <MetadataKey>סוג שאלה:</MetadataKey>
            <MetadataValue>
              {translateQuestionType(question.data.metadata.type)}
            </MetadataValue>
          </MetadataRow>
          <MetadataRow>
            <MetadataKey>מקצוע:</MetadataKey>
            <MetadataValue>
              {subject?.name || 'לא מוגדר'}
            </MetadataValue>
          </MetadataRow>
          <MetadataRow>
            <MetadataKey>תחום:</MetadataKey>
            <MetadataValue>
              {domain?.name || 'לא מוגדר'}
            </MetadataValue>
          </MetadataRow>
        </ReadOnlyMetadata>
      </MetadataSectionWrapper>

      <MetadataSectionWrapper>
        <SectionTitle>
          <BookOutlined />
          סיווג נושאי
        </SectionTitle>
        <EditableField>
          <EditableWrapper
            label={<MetadataLabel>נושא ותת-נושא</MetadataLabel>}
            fieldPath="metadata"
            placeholder="בחר נושא..."
            onValueChange={(value: TopicValue) => {
              if (value.topicId !== undefined) {
                handleFieldChange('topicId', value.topicId);
              }
              if (value.subtopicId !== undefined) {
                handleFieldChange('subtopicId', value.subtopicId);
              }
            }}
            onBlur={onFieldBlur}
            validate={validateTopic}
            isEditing={editableFields.topic}
            onStartEdit={() => {
              setEditableFields(prev => ({ ...prev, topic: true }));
            }}
            onCancelEdit={() => {
              setEditableFields(prev => ({ ...prev, topic: false }));
            }}
            renderEditMode={(value: any, onChange) => {
              const currentValue: TopicValue = {
                topicId: value?.topicId,
                subtopicId: value?.subtopicId
              };
              
              return (
                <TopicSelectGroup>
                  <Select
                    value={currentValue.topicId}
                    onChange={(topicId) => {
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
                  <Select
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
                <TopicDisplay>
                  {subtopicName && <SubtopicName>{subtopicName}</SubtopicName>}
                  <TopicName>{topicName}</TopicName>
                </TopicDisplay>
              );
            }}
          />
        </EditableField>
      </MetadataSectionWrapper>

      <MetadataSectionWrapper>
        <SectionTitle>
          <StarOutlined />
          רמת קושי ומשך
        </SectionTitle>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <EditableField>
            <EditableWrapper
              label={<span />}
              fieldPath="metadata.difficulty"
              placeholder="בחר רמת קושי..."
              onValueChange={(value) => handleFieldChange('difficulty', value)}
              onBlur={onFieldBlur}
              validate={validateDifficulty}
              isEditing={editableFields.difficulty}
              onStartEdit={() => {
                setEditableFields(prev => ({ ...prev, difficulty: true }));
              }}
              onCancelEdit={() => {
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
                <DifficultyDisplay>
                  <MetadataValue>{getDifficultyLabel(value)}</MetadataValue>
                  <DifficultyStars>
                    {[1,2,3,4,5].map((star) => (
                      <StarOutlined key={star} className={star <= value ? 'filled' : 'empty'} />
                    ))}
                  </DifficultyStars>
                </DifficultyDisplay>
              )}
            />
          </EditableField>

          <EditableField>
            <EditableWrapper
              label={<span />}
              fieldPath="metadata.estimatedTime"
              placeholder="הזן זמן מוערך..."
              onValueChange={(value) => handleFieldChange('estimatedTime', value)}
              onBlur={onFieldBlur}
              validate={validateEstimatedTime}
              isEditing={editableFields.estimatedTime}
              onStartEdit={() => {
                setEditableFields(prev => ({ ...prev, estimatedTime: true }));
              }}
              onCancelEdit={() => {
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
          </EditableField>
        </Space>
      </MetadataSectionWrapper>

      <MetadataSectionWrapper>
        <SectionTitle>
          <DatabaseOutlined />
          מקור השאלה
        </SectionTitle>
        <EditableField>
          <EditableWrapper
            label={<span />}
            fieldPath="metadata.source"
            placeholder="בחר מקור..."
            onValueChange={(value) => handleFieldChange('source', value)}
            onBlur={onFieldBlur}
            validate={validateSource}
            isEditing={editableFields.source}
            onStartEdit={() => {
              setEditableFields(prev => ({ ...prev, source: true }));
            }}
            onCancelEdit={() => {
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
              
              const sourceInfo = {
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
              };

              const displayText = getQuestionSourceDisplay(sourceInfo);
              const [mainSource, ...details] = displayText.split('•').map(s => s.trim());
              
              return (
                <SourceDisplay>
                  <SourceMain>{mainSource}</SourceMain>
                  {details.length > 0 && (
                    <SourceDetails>{details.join(' • ')}</SourceDetails>
                  )}
                </SourceDisplay>
              );
            }}
          />
        </EditableField>
      </MetadataSectionWrapper>
    </Space>
  );
}); 