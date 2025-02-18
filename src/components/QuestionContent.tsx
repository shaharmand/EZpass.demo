import React, { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import { configureMathJax } from '../utils/mathJax';

// Add MathJax type declarations
declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements: HTMLElement[]) => Promise<void>;
    };
  }
}

interface QuestionContentProps {
  content: string;
  isLoading?: boolean;
}

const QuestionContent: React.FC<QuestionContentProps> = ({ 
  content,
  isLoading = false
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isMathRendered, setIsMathRendered] = React.useState(false);

  useEffect(() => {
    const renderMathContent = async () => {
      if (!content || !contentRef.current) {
        return;
      }

      try {
        setIsMathRendered(false);
        
        // Ensure MathJax is configured
        await configureMathJax();
        
        // Process content
        const processedContent = processContent(content);
        
        // Set content first
        contentRef.current.innerHTML = processedContent;
        
        // Render MathJax after content is set
        if (window.MathJax?.typesetPromise) {
          await window.MathJax.typesetPromise([contentRef.current]);
          setIsMathRendered(true);
        }
      } catch (error) {
        console.error('Error rendering math content:', error);
        setIsMathRendered(false);
      }
    };

    renderMathContent();
    
    return () => {
      if (contentRef.current) {
        contentRef.current.innerHTML = '';
      }
    };
  }, [content]);

  const processContent = (text: string): string => {
    // Clean up newlines inside LaTeX expressions
    const cleanLatex = text.replace(/\\[\(\[]([\s\S]*?)\\[\)\]]/g, (match) => 
      match.replace(/\n/g, ' ')
    );
    
    // Handle regular newlines and section markers
    return cleanLatex
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/(\. [א-ת]\.)/g, '<br/><br/>$1')
      // Format LaTeX delimiters
      .replace(/\\\(/g, '\\(')
      .replace(/\\\)/g, '\\)')
      .replace(/\\\[/g, '\\[')
      .replace(/\\\]/g, '\\]')
      // Add proper spacing around LaTeX
      .replace(/(\\\(.*?\\\))/g, ' $1 ')
      .replace(/(\\\[.*?\\\])/g, '\n$1\n');
  };

  if (isLoading) {
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
        <Spin size="large" />
        <div style={{ 
          marginTop: '16px',
          color: '#475569',
          fontSize: '1.1rem'
        }}>
          מייצר שאלה...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        border: '1px solid #60a5fa',
        padding: '16px',
        direction: 'rtl',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        minHeight: '120px',
      }}>
        <div 
          ref={contentRef}
          className="math-content"
          style={{
            fontSize: '1.1rem',
            lineHeight: '1.6',
            direction: 'rtl',
            color: '#1f2937',
            backgroundColor: 'transparent',
            opacity: isMathRendered ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            whiteSpace: 'pre-wrap'
          }}
        />
      </div>
    </div>
  );
};

export default QuestionContent; 