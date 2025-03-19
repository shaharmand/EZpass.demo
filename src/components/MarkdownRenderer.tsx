/**
 * Main MarkdownRenderer implementation
 * Used for rendering markdown content with LaTeX and code blocks
 * Handles RTL/LTR properly and provides comprehensive styling
 * 
 * Display Math Formatting:
 * For consistent behavior across all markdown implementations, display math should be:
 * 1. Surrounded by double dollar signs ($$) on their own lines
 * 2. Separated from other content by empty lines
 * 
 * Correct format:
 * ```
 * Some text here.
 * 
 * $$
 * E = mc^2
 * $$
 * 
 * More text here.
 * ```
 * 
 * While inline format `$$E = mc^2$$` might work in some implementations,
 * it's recommended to use the multi-line format for consistent display math rendering.
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
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Custom error handler for KaTeX - suppress all errors silently
const errorHandler = (_msg: string, _err: any) => {
  // Suppress all KaTeX errors silently
  return;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content,
  className = ''
}) => {
  // Pre-process content to ensure display math is on its own line and clean up image attributes
  const processedContent = React.useMemo(() => {
    if (!content) return '';
    
    try {
      // Store image attributes for later use
      const imageAttributes = new Map();
      let lineNumber = 0;
      
      // First pass: collect image attributes and clean up the content
      const cleanedContent = content.split('\n').map(line => {
        lineNumber++;
        const imgMatch = line.match(/^(!\[.*?\]\(.*?\))\{width=(\d+)\s+align=(left|center|right)\}/);
        if (imgMatch) {
          // Store the attributes with the line number as key
          imageAttributes.set(lineNumber, {
            width: parseInt(imgMatch[2]),
            alignment: imgMatch[3]
          });
          // Return only the image markdown without attributes
          return imgMatch[1];
        }
        return line;
      }).join('\n');

      // Only process display math (exactly two $ signs), leave inline math alone
      const withDisplayMath = cleanedContent.replace(/\$\$([^$]+?)\$\$/g, (match, full) => {
        // If it's already properly formatted (has newlines around $$), leave it as is
        if (/\n\s*\$\$[\s\S]*?\$\$\s*\n/.test(match)) {
          return match;
        }
        
        // Extract the math content between $$
        const mathContent = match.trim().replace(/^\$\$|\$\$$/g, '').trim();
        
        // Add newlines only if needed
        return `\n\n$$\n${mathContent}\n$$\n\n`;
      });

      // Store the attributes in a ref so the img component can access them
      (window as any).__imageAttributes = imageAttributes;

      return withDisplayMath;
    } catch (error) {
      console.error('Error processing content:', error);
      return content;
    }
  }, [content]);

  return (
    <div className={`markdown-content ${className}`} dir="rtl">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[
          [rehypeKatex, {
            strict: false,
            output: 'html',
            throwOnError: false,
            displayMode: (node: any) => node.properties?.className?.includes('math-display')
          }]
        ]}
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneLight}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          span({node, className, children, ...props}) {
            if (className?.includes('math')) {
              const isDisplay = className.includes('math-display');
              
              if (isDisplay) {
                return (
                  <div 
                    dir="ltr"
                    style={{
                      direction: 'ltr',
                      unicodeBidi: 'isolate',
                      textAlign: 'center',
                      width: '100%'
                    }}
                  >
                    {children}
                  </div>
                );
              }
              
              return (
                <span 
                  dir="ltr"
                  style={{
                    direction: 'ltr',
                    unicodeBidi: 'isolate',
                    display: 'inline-block'
                  }}
                  {...props}
                >
                  {children}
                </span>
              );
            }
            return <span className={className} {...props}>{children}</span>;
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer; 