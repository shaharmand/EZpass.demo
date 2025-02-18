import React from 'react';
import { Typography, Space, Spin } from 'antd';
import type { Question } from '../types/question';
import { MarkdownRenderer } from './MarkdownRenderer';

const { Text } = Typography;

interface QuestionViewerProps {
  question: Question;
  showOptions?: boolean;
  showSolution?: boolean;
  loading?: boolean;
}

const QuestionViewer: React.FC<QuestionViewerProps> = ({
  question,
  showOptions = true,
  showSolution = false,
  loading = false
}) => {
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
      {showOptions && question.type === 'multiple_choice' && question.options && (
        <div className="question-options" style={{ marginTop: '1rem' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {question.options.map((option, index) => (
              <div 
                key={index}
                className="question-option"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: showSolution && (index + 1 === question.correctOption) 
                    ? '#ecfdf5' // Light green for correct answer when showing solution
                    : '#ffffff',
                  textAlign: 'right',
                  direction: 'rtl'
                }}
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
        </div>
      )}
    </div>
  );
};

export default QuestionViewer; 