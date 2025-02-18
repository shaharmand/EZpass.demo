import React from 'react';
import { Typography, Space } from 'antd';
import type { Question } from '../types/question';
import { MarkdownRenderer } from './MarkdownRenderer';

const { Text } = Typography;

interface QuestionViewerProps {
  question: Question;
  showOptions?: boolean;
  showSolution?: boolean;
}

const QuestionViewer: React.FC<QuestionViewerProps> = ({
  question,
  showOptions = true,
  showSolution = false
}) => {
  return (
    <div className="question-viewer">
      {/* Question Content */}
      <div className="question-content">
        <MarkdownRenderer content={question.content.text} />
      </div>

      {/* Options (if multiple choice and showOptions is true) */}
      {showOptions && question.metadata.type === 'multiple_choice' && question.answer.options && (
        <div className="question-options" style={{ marginTop: '1rem' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {question.answer.options.map((option, index) => (
              <div 
                key={index}
                className="question-option"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: showSolution && (index + 1 === question.answer.correctOption) 
                    ? '#ecfdf5' // Light green for correct answer when showing solution
                    : '#ffffff'
                }}
              >
                <Text>
                  {index + 1}. <MarkdownRenderer content={option.text} />
                </Text>
              </div>
            ))}
          </Space>
        </div>
      )}

      {/* Solution (if showSolution is true) */}
      {showSolution && (
        <div className="question-solution" style={{ marginTop: '1.5rem' }}>
          <Text strong style={{ display: 'block', marginBottom: '0.5rem' }}>
            פתרון:
          </Text>
          <MarkdownRenderer content={question.solution.text} />
          {question.solution.steps && (
            <div className="solution-steps" style={{ marginTop: '1rem' }}>
              {question.solution.steps.map((step, index) => (
                <div key={index} className="solution-step" style={{ marginBottom: '0.5rem' }}>
                  <Text strong>{index + 1}. </Text>
                  <MarkdownRenderer content={step.text} />
                  {step.key_point && (
                    <Text type="secondary" style={{ display: 'block', marginLeft: '1.5rem' }}>
                      נקודה מרכזית: {step.key_point}
                    </Text>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionViewer; 