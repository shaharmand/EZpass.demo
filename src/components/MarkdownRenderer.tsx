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
import { logger } from '../utils/logger';
import { CRITICAL_SECTIONS } from '../utils/logger';
import 'katex/dist/katex.min.css';
import './MarkdownRenderer.css';

// Debug flag - set to true when debugging KaTeX/Hebrew issues
const DEBUG_KATEX = false;

// Custom error handler for KaTeX - suppress all errors silently
const errorHandler = (_msg: string, _err: any) => {
  // Suppress all KaTeX errors silently
  return;
};

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

    if (DEBUG_KATEX) {
      logger.debug('Starting markdown content processing', {
        contentLength: content.length,
        hasLatex: content.includes('$'),
        hasCodeBlocks: content.includes('```'),
        hebrewChars: content.match(/[\u0590-\u05FF]/g)?.join(''),
        dollarSignCount: (content.match(/\$/g) || []).length,
        contentPreview: content.slice(0, 100)
      }, CRITICAL_SECTIONS.LATEX);
    }
    
    try {
      // Process code blocks
      const processedWithCode = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        if (DEBUG_KATEX) {
          logger.debug('Processing code block', {
            language: language || 'none',
            codeLength: code.length,
            hasLatex: code.includes('$'),
            hasHebrewInCode: /[\u0590-\u05FF]/.test(code)
          }, CRITICAL_SECTIONS.CODE_BLOCKS);
        }

        const cleanCode = code
          .replace(/^\n+/, '')
          .replace(/\n+$/, '')
          .split('\n')
          .map((line: string) => line.replace(/^[ \t]+/, (indent) => ' '.repeat(indent.length)))
          .join('\n');
        
        return `\`\`\`${language || ''}\n${cleanCode}\n\`\`\``;
      });

      // Log potential math expressions
      const mathExpressions = processedWithCode.match(/\$([^$]+)\$/g) || [];
      if (DEBUG_KATEX) {
        mathExpressions.forEach((expr, index) => {
          const hebrewChars = expr.match(/[\u0590-\u05FF]/g) || [];
          const specialChars = expr.match(/[^\w\s$]/g) || [];
          
          logger.debug(`Math expression ${index + 1} analysis`, {
            expression: expr,
            hasHebrew: hebrewChars.length > 0,
            hebrewCharacters: hebrewChars,
            length: expr.length,
            position: {
              start: processedWithCode.indexOf(expr),
              end: processedWithCode.indexOf(expr) + expr.length
            },
            surroundingContext: {
              before: processedWithCode.slice(Math.max(0, processedWithCode.indexOf(expr) - 20), processedWithCode.indexOf(expr)),
              after: processedWithCode.slice(processedWithCode.indexOf(expr) + expr.length, processedWithCode.indexOf(expr) + expr.length + 20)
            },
            specialCharacters: specialChars,
            characterBreakdown: Array.from(expr).map(char => ({
              char,
              code: char.charCodeAt(0),
              isHebrew: /[\u0590-\u05FF]/.test(char)
            })),
            hasDollarSign: expr.includes('$')
          }, CRITICAL_SECTIONS.LATEX);
        });
      }

      return processedWithCode;
    } catch (error: any) {
      if (DEBUG_KATEX) {
        logger.error('Error processing markdown content', {
          error,
          contentPreview: content.slice(0, 100),
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack
        }, CRITICAL_SECTIONS.LATEX);
      }
      return content; // Return original content on error
    }
  }, [content]);

  // Log when component renders
  React.useEffect(() => {
    if (DEBUG_KATEX) {
      logger.debug('MarkdownRenderer rendered', {
        originalLength: content?.length,
        processedLength: processedContent?.length,
        className,
        hasProcessedContent: !!processedContent
      }, CRITICAL_SECTIONS.LATEX);
    }
  }, [content, processedContent, className]);

  return (
    <div className={`markdown-content ${className}`} dir="rtl">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[
          [rehypeKatex, { 
            strict: false,
            trust: true,
            throwOnError: false,
            errorColor: '#FF0000',
            globalGroup: true,
            output: 'html',  // Prevent console logging
            maxSize: 100,
            maxExpand: 1000,
            minRuleThickness: 0.04,
            errorHandler: (msg: string, err: any) => {
              // Completely suppress all KaTeX errors
              return;
            },
            macros: {},
          }]
        ]}
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
          // Enhanced math handling
          span({node, className, children, ...props}) {
            if (className?.includes('math-inline')) {
              return (
                <span 
                  dir="ltr" 
                  style={{ 
                    display: 'inline-block', 
                    direction: 'ltr',
                    verticalAlign: 'middle',
                    padding: '0 0.2em'
                  }} 
                  {...props}
                >
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