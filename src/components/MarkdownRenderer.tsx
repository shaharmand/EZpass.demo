/**
 * Main MarkdownRenderer implementation
 * Used for rendering markdown content with LaTeX and code blocks
 * Handles RTL/LTR properly and provides comprehensive styling
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { CSSProperties } from 'react';
import 'katex/dist/katex.min.css';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content,
  className = ''
}) => {
  // Pre-process code blocks to preserve newlines and indentation
  const processedContent = React.useMemo(() => {
    if (!content) return '';
    
    // Convert literal \n strings to actual newlines
    const contentWithNewlines = content.replace(/\\n/g, '\n');
    
    // Fix code block formatting
    return contentWithNewlines.replace(/```(\w+)?\n([\s\S]*?)```/g, (match: string, language: string | undefined, code: string) => {
      // Clean up the code block while preserving meaningful whitespace
      const cleanCode = code
        .replace(/^\n+/, '') // Remove leading newlines
        .replace(/\n+$/, '') // Remove trailing newlines
        .split('\n')
        .map((line: string) => {
          // Preserve indentation but remove any common leading whitespace
          return line.replace(/^[ \t]+/, (indent) => {
            // Keep indentation but normalize it
            return ' '.repeat(indent.length);
          });
        })
        .join('\n');
      
      return `\`\`\`${language || ''}\n${cleanCode}\n\`\`\``;
    });
  }, [content]);

  return (
    <div className={`markdown-content ${className}`} dir="rtl">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({node, inline, className, children, ...props}: CodeProps) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (inline) {
              return (
                <code 
                  className={className} 
                  dir="ltr"
                  style={{
                    direction: 'ltr',
                    unicodeBidi: 'isolate',
                    fontFamily: "'Fira Code', Consolas, Monaco, 'Andale Mono', monospace",
                    backgroundColor: '#f8fafc',
                    padding: '0.15em 0.3em',
                    borderRadius: '3px',
                    fontSize: '0.9em',
                    color: '#1f2937',
                    border: '1px solid #e5e7eb',
                    display: 'inline-block',
                    margin: '0 0.2em'
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Ensure code content is properly formatted
            const codeContent = Array.isArray(children) 
              ? children.join('\n') 
              : String(children);

            return (
              <div dir="ltr" style={{ 
                direction: 'ltr', 
                unicodeBidi: 'isolate', 
                margin: '1em 0',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '0.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <SyntaxHighlighter
                  language={language || 'text'}
                  style={oneLight as any}
                  PreTag="div"
                  showLineNumbers={true}
                  wrapLongLines={false}
                  customStyle={{
                    margin: 0,
                    padding: '1em',
                    backgroundColor: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '0.9em',
                    lineHeight: 1.5,
                    border: '1px solid #e5e7eb',
                    direction: 'ltr',
                    textAlign: 'left',
                    whiteSpace: 'pre'
                  }}
                  codeTagProps={{
                    style: {
                      fontFamily: "'Fira Code', Consolas, Monaco, 'Andale Mono', monospace",
                      fontSize: 'inherit',
                      lineHeight: 'inherit',
                      whiteSpace: 'pre'
                    }
                  }}
                  lineNumberStyle={{
                    minWidth: '2.5em',
                    paddingRight: '1em',
                    paddingLeft: '0.5em',
                    textAlign: 'right',
                    color: '#94a3b8',
                    backgroundColor: '#f8fafc',
                    borderRight: '1px solid #e5e7eb',
                    marginRight: '1em'
                  }}
                  {...props}
                >
                  {codeContent.replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            );
          },
          // Ensure math expressions are properly isolated
          span({node, className, children, ...props}) {
            if (className?.includes('math-inline')) {
              return (
                <span dir="ltr" style={{ display: 'inline-block', direction: 'ltr' }} {...props}>
                  {children}
                </span>
              );
            }
            return <span className={className} {...props}>{children}</span>;
          },
          // Ensure proper RTL for paragraphs
          p({children, ...props}) {
            return (
              <p dir="auto" {...props}>
                {children}
              </p>
            );
          },
          // Ensure proper RTL for lists
          ol({children, ...props}) {
            return (
              <ol dir="rtl" style={{ listStyleType: 'decimal', margin: '1em 0', paddingRight: '1.5em' }} {...props}>
                {children}
              </ol>
            );
          },
          li({children, ...props}) {
            return (
              <li dir="rtl" style={{ margin: '0.5em 0' }} {...props}>
                {children}
              </li>
            );
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer; 