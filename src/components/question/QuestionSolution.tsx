import React from 'react';
import { Card, Space, Typography } from 'antd';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { FileTextOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface QuestionSolutionProps {
  solution: {
    text: string;
    format: 'markdown';
    answer?: string;
  };
  className?: string;
  showCard?: boolean;
}

const contentStyles = {
  padding: '1rem',
  borderRadius: '4px',
  border: '1px solid #e5e7eb',
  backgroundColor: '#ffffff',
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-word' as const,
  '& p': {
    margin: '1em 0',
    whiteSpace: 'pre-wrap'
  }
};

const finalAnswerStyles = {
  marginTop: '24px',
  padding: '12px 16px',
  backgroundColor: '#f6ffed',
  borderRadius: '8px',
  borderRight: '4px solid #52c41a'
};

export const QuestionSolution: React.FC<QuestionSolutionProps> = ({
  solution,
  className = '',
  showCard = true
}) => {
  if (!solution?.text) {
    return (
      <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
        תוכן הפתרון חסר
      </Text>
    );
  }

  // Ensure content has proper paragraph breaks
  const formattedContent = React.useMemo(() => {
    return solution.text
      // Ensure paragraphs are properly separated
      .split('\n\n')
      .map(para => para.trim())
      .join('\n\n')
      // Preserve single newlines within paragraphs
      .replace(/([^\n])\n([^\n])/g, '$1  \n$2');
  }, [solution.text]);

  const SolutionContent = () => (
    <div className={`solution-content ${className}`} style={{ direction: 'rtl', textAlign: 'right' }}>
      <div style={contentStyles}>
        <MarkdownRenderer content={formattedContent} />
        
        {/* Show final answer if it exists */}
        {solution.answer && (
          <div style={finalAnswerStyles}>
            <Text strong>תשובה סופית:</Text>
            <div style={{ marginTop: '8px' }}>
              <MarkdownRenderer content={solution.answer} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!showCard) {
    return <SolutionContent />;
  }

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <span>פתרון</span>
        </Space>
      }
    >
      <SolutionContent />
    </Card>
  );
}; 