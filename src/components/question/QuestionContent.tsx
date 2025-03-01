import React from 'react';
import { MarkdownRenderer } from '../MarkdownRenderer';

interface QuestionContentProps {
  content: string;
  className?: string;
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

export const QuestionContent: React.FC<QuestionContentProps> = ({
  content,
  className = ''
}) => {
  // Ensure content has proper paragraph breaks
  const formattedContent = React.useMemo(() => {
    return content
      // Ensure paragraphs are properly separated
      .split('\n\n')
      .map(para => para.trim())
      .join('\n\n')
      // Preserve single newlines within paragraphs
      .replace(/([^\n])\n([^\n])/g, '$1  \n$2');
  }, [content]);

  return (
    <div className={`question-content ${className}`} style={{ direction: 'rtl', textAlign: 'right' }}>
      <div style={contentStyles}>
        <MarkdownRenderer content={formattedContent} />
      </div>
    </div>
  );
}; 