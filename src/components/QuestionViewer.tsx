import React from 'react';
import { Typography, Space, Spin } from 'antd';
import { Question, QuestionType } from '../types/question';
import { MarkdownRenderer } from './MarkdownRenderer';

const { Title, Text } = Typography;

interface QuestionViewerProps {
  question: Question;
  showOptions?: boolean;
  showSolution?: boolean;
  loading?: boolean;
  selectedOption?: number;
  onOptionSelect?: (optionId: number) => void;
}

const QuestionViewer: React.FC<QuestionViewerProps> = ({
  question,
  showOptions = true,
  showSolution = false,
  loading = false,
  selectedOption,
  onOptionSelect
}) => {
  const getCorrectAnswer = () => {
    if (question.schoolAnswer.finalAnswer?.type === 'multiple_choice') {
      return question.schoolAnswer.finalAnswer.value;
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <Spin size="large" />
        </div>
        <div style={{ 
          color: '#6b7280',
          fontSize: '1.1rem'
        }}>
          טוען שאלה...
        </div>
      </div>
    );
  }

  return (
    <div className="question-viewer" style={{ direction: 'rtl', textAlign: 'right' }}>
      {/* Question Content */}
      <div className="question-content">
        <MarkdownRenderer content={question.content.text} />
      </div>

      {/* Options (if multiple choice and showOptions is true) */}
      {showOptions && question.metadata.type === QuestionType.MULTIPLE_CHOICE && question.content.options && (
        <div className="question-options" style={{ marginTop: '1rem' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {question.content.options.map((option, index) => {
              const correctAnswer = getCorrectAnswer();
              return (
                <div
                  key={index}
                  className={`question-option ${selectedOption === index + 1 ? 'selected' : ''}`}
                  style={{
                    padding: '0.75rem',
                    border: `1px solid ${selectedOption === index + 1 ? '#1677ff' : '#d9d9d9'}`,
                    borderRadius: '4px',
                    cursor: onOptionSelect ? 'pointer' : 'default',
                    backgroundColor: showSolution && correctAnswer && (index + 1 === correctAnswer)
                      ? '#ecfdf5' // Light green for correct answer when showing solution
                      : selectedOption === index + 1
                      ? '#e6f4ff'
                      : 'white'
                  }}
                  onClick={() => onOptionSelect?.(index + 1)}
                >
                  <Text style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    alignItems: 'center'
                  }}>
                    <span style={{ lineHeight: '1.5' }}>{index + 1}.</span>
                    <div style={{ flex: 1 }}>
                      <MarkdownRenderer content={option.text} />
                    </div>
                  </Text>
                </div>
              );
            })}
          </Space>
        </div>
      )}

      {/* Solution (if showSolution is true) */}
      {showSolution && question.schoolAnswer.solution && (
        <div className="question-solution" style={{ marginTop: '1.5rem' }}>
          <Text strong style={{ display: 'block', marginBottom: '0.5rem' }}>
            פתרון:
          </Text>
          <MarkdownRenderer content={question.schoolAnswer.solution.text} />
        </div>
      )}
    </div>
  );
};

export default QuestionViewer; 