import React from 'react';
import { Typography } from 'antd';
import { Question } from '../../types/question';
import { SkipReason } from '../../types/prepUI';
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
  return (
    <div className="question-header simplified">
      <div className="title-row">
        <h2 className="question-title">
          <span>שאלה</span>
        </h2>
      </div>
    </div>
  );
};

export default QuestionHeader; 