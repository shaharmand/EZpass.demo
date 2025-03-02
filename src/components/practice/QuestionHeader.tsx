import React, { useState } from 'react';
import { Space, Typography, Popover } from 'antd';
import { StarFilled, StarOutlined, AimOutlined } from '@ant-design/icons';
import { Question, FilterState, QuestionType } from '../../types/question';
import { SkipReason } from '../../types/prepUI';
import { getQuestionTopicName, getQuestionTypeLabel } from '../../utils/questionUtils';
import { DifficultyFeedbackContent } from './DifficultyFeedback';
import { TypeFilterContent } from './TypeFilter';
import { SubtopicPopoverContent } from './SubtopicPopover';
import './QuestionHeader.css';

const { Text } = Typography;

interface QuestionHeaderProps {
  question: Question;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSkip: (reason: SkipReason, filters?: FilterState) => Promise<void>;
}

export const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  question,
  filters,
  onFiltersChange,
  onSkip,
}) => {
  const [isDifficultyPopoverOpen, setIsDifficultyPopoverOpen] = useState(false);
  const [isTypePopoverOpen, setIsTypePopoverOpen] = useState(false);
  const [isSubtopicPopoverOpen, setIsSubtopicPopoverOpen] = useState(false);

  const hasTypeFocus = () => !!filters.questionTypes?.length;
  const hasSubtopicFocus = () => !!filters.subTopics?.length;

  const isTypeFocused = (type: QuestionType) => 
    filters.questionTypes?.length === 1 && filters.questionTypes[0] === type;

  const isSubtopicFocused = (subtopicId: string) => 
    filters.subTopics?.length === 1 && filters.subTopics[0] === subtopicId;

  const renderDifficultyOption = (difficulty: number) => {
    return (
      <Space>
        {[...Array(5)].map((_, i) => (
          i < difficulty ? 
            <StarFilled key={i} style={{ color: '#f59e0b', fontSize: '12px' }} /> :
            <StarOutlined key={i} style={{ color: '#d1d5db', fontSize: '12px' }} />
        ))}
      </Space>
    );
  };

  return (
    <div className="question-header">
      <div className="title-row">
        <h2 className="question-title">
          <Popover 
            content={
              <SubtopicPopoverContent 
                question={question}
                filters={filters}
                onFiltersChange={onFiltersChange}
                onClose={() => setIsSubtopicPopoverOpen(false)}
              />
            }
            trigger={['hover', 'click']}
            placement="bottom"
            open={isSubtopicPopoverOpen}
            onOpenChange={setIsSubtopicPopoverOpen}
            overlayInnerStyle={{
              padding: '12px',
              borderRadius: '12px'
            }}
          >
            <span 
              className="topic-selector"
              style={{ cursor: 'pointer' }}
            >
              <span>שאלה ב</span>
              <span className={`topic-name ${question.metadata.subtopicId && isSubtopicFocused(question.metadata.subtopicId) ? 'focused' : ''}`}>
                {getQuestionTopicName(question)}
                <AimOutlined className="focus-icon" />
              </span>
            </span>
          </Popover>
        </h2>
        <div className="metadata-indicators">
          <Popover 
            content={
              <DifficultyFeedbackContent 
                question={question}
                onSkip={onSkip}
                onClose={() => setIsDifficultyPopoverOpen(false)}
              />
            }
            trigger={['hover', 'click']}
            placement="bottom"
            open={isDifficultyPopoverOpen}
            onOpenChange={setIsDifficultyPopoverOpen}
            arrowPointAtCenter={true}
            overlayStyle={{
              minWidth: '200px'
            }}
          >
            <div className="difficulty-selector">
              {renderDifficultyOption(question.metadata.difficulty)}
            </div>
          </Popover>
          <Popover 
            content={
              <TypeFilterContent 
                question={question}
                filters={filters}
                onFiltersChange={onFiltersChange}
                onSkip={onSkip}
                onClose={() => setIsTypePopoverOpen(false)}
              />
            }
            trigger={['hover', 'click']}
            placement="bottom"
            open={isTypePopoverOpen}
            onOpenChange={setIsTypePopoverOpen}
            destroyTooltipOnHide={true}
            overlayStyle={{
              minWidth: '280px'
            }}
          >
            <div className={`type-selector ${hasTypeFocus() ? 'focused' : ''}`}>
              <span className="type-label">{getQuestionTypeLabel(question.metadata.type)}</span>
              <span className="focus-status" style={{
                fontSize: '12px',
                color: hasTypeFocus() && isTypeFocused(question.metadata.type) ? '#2563eb' : '#94a3b8',
                fontWeight: hasTypeFocus() && isTypeFocused(question.metadata.type) ? '500' : 'normal',
                backgroundColor: hasTypeFocus() && isTypeFocused(question.metadata.type) ? '#e0f2fe' : 'transparent',
                padding: '2px 8px',
                borderRadius: '10px'
              }}>
                {hasTypeFocus() && isTypeFocused(question.metadata.type) ? 'במיקוד' : 'ללא מיקוד'}
              </span>
              <AimOutlined className="focus-icon" style={{ 
                color: hasTypeFocus() && isTypeFocused(question.metadata.type) ? '#2563eb' : '#64748b',
                fontSize: '14px'
              }} />
            </div>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default QuestionHeader; 