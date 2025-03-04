import React, { useState } from 'react';
import { Space, Typography, Popover } from 'antd';
import { StarFilled, StarOutlined, AimOutlined } from '@ant-design/icons';
import { Question, DifficultyLevel } from '../../types/question';
import { SkipReason } from '../../types/prepUI';
import { getQuestionTopicName, getQuestionTypeLabel } from '../../utils/questionUtils';
import { getEnumTranslation } from '../../utils/translations';
import { DifficultyFeedbackContent } from './DifficultyFeedback';
import { TypeFilterContent } from './TypeFilter';
import { SubtopicPopoverContent } from './SubtopicPopover';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import './QuestionHeader.css';

const { Text } = Typography;

interface QuestionHeaderProps {
  question: Question;
  onSkip: (reason: SkipReason) => Promise<void>;
}

export const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  question,
  onSkip
}) => {
  const [isSubtopicPopoverOpen, setIsSubtopicPopoverOpen] = useState(false);
  const [isDifficultyPopoverOpen, setIsDifficultyPopoverOpen] = useState(false);
  const [isTypePopoverOpen, setIsTypePopoverOpen] = useState(false);
  const { prep } = useStudentPrep();

  const isSubtopicFocused = (subtopicId: string) => 
    prep?.focusedSubTopic === subtopicId;

  const isTypeFocused = (type: string) => 
    prep?.focusedType === type;

  const renderDifficultyOption = (difficulty: DifficultyLevel) => {
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
            <div className={`type-selector ${isTypeFocused(question.metadata.type) ? 'focused' : ''}`}>
              {getQuestionTypeLabel(question.metadata.type)}
              <AimOutlined className="focus-icon" />
            </div>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default QuestionHeader; 