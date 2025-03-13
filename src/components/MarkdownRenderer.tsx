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
import { logger } from '../utils/logger';
import { CRITICAL_SECTIONS } from '../utils/logger';
import 'katex/dist/katex.min.css';
import './MarkdownRenderer.css';

// Enable debug logging for KaTeX
const DEBUG_KATEX = true;

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
  // Pre-process content to ensure display math is on its own line and clean up image attributes
  const processedContent = React.useMemo(() => {
    if (!content) return '';

    // Direct console logging for initial content
    console.log('🔍 Initial content:', {
      contentLength: content.length,
      hasLatex: content.includes('$'),
      hasDisplayMath: content.includes('$$'),
      displayMathMatches: content.match(/\$\$(.*?)\$\$/g)?.length || 0,
      preview: content.slice(0, 100)
    });
    
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

  // Log component renders
  React.useEffect(() => {
    console.log('🔄 MarkdownRenderer rendered:', {
      originalLength: content?.length,
      processedLength: processedContent?.length,
      className
    });
  }, [content, processedContent, className]);

  return (
    <div className={`markdown-content ${className}`} dir="rtl">
      <ReactMarkdown
        remarkPlugins={[
          // Debug plugin to see what remark-math receives
          () => (tree: any) => {
            const getNodeInfo = (node: any) => ({
              type: node.type,
              value: node.value,
              children: node.children?.map((c: any) => getNodeInfo(c))
            });
            
            console.log('🔄 Before remark-math AST:', {
              tree: getNodeInfo(tree),
              content: processedContent,
              paragraphs: processedContent.split('\n\n').filter(Boolean)
            });
            return tree;
          },
          // Use remark-math with no config (use defaults)
          remarkMath,
          // Debug what remark-math produced
          () => (tree: any) => {
            const getNodeInfo = (node: any) => ({
              type: node.type,
              value: node.value,
              data: node.data,
              children: node.children?.map((c: any) => getNodeInfo(c))
            });
            
            console.log('🔄 After remark-math AST:', {
              tree: getNodeInfo(tree),
              mathNodes: tree.children?.filter((n: any) => n.type === 'math' || n.type === 'inlineMath').map((n: any) => ({
                type: n.type,
                value: n.value,
                data: n.data
              }))
            });
            return tree;
          }
        ]}
        rehypePlugins={[
          // Plugin to inspect before rehype-katex
          () => (tree: any) => {
            const getNodeInfo = (node: any) => ({
              type: node.type,
              tagName: node.tagName,
              properties: node.properties,
              value: node.value,
              children: node.children?.map((c: any) => getNodeInfo(c))
            });
            
            console.log('📝 Before rehype-katex AST:', getNodeInfo(tree));
            
            const visit = (node: any, parent: any = null) => {
              if (node.tagName === 'span' && node.properties?.className?.includes('math')) {
                console.log('📐 Math span:', {
                  className: node.properties.className,
                  value: node.children?.[0]?.value,
                  parentTagName: parent?.tagName,
                  parentChildrenCount: parent?.children?.length,
                  isDisplay: node.properties.className.includes('math-display')
                });
              }
              if (node.children) {
                node.children.forEach((child: any) => visit(child, node));
              }
            };
            visit(tree);
            return tree;
          },
          [rehypeKatex, {
            strict: false,
            output: 'html',
            throwOnError: false,
            displayMode: (node: any) => {
              const isDisplay = node.properties?.className?.includes('math-display');
              console.log('📐 rehype-katex display check:', {
                className: node.properties?.className,
                value: node.children?.[0]?.value,
                parentTagName: node.parent?.tagName,
                isDisplay
              });
              return isDisplay;
            }
          }]
        ]}
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeContent = String(children).replace(/\n$/, '');

            if (!inline && language) {
              return (
                <div className="code-block-wrapper" dir="ltr">
                  <SyntaxHighlighter
                    language={language}
                    style={oneLight}
                    showLineNumbers={true}
                    customStyle={{
                      margin: 0,
                      padding: '1em',
                      backgroundColor: '#1f2937',
                      borderRadius: '0.375rem',
                      fontFamily: "'Fira Code', Consolas, Monaco, 'Andale Mono', monospace",
                      fontSize: 'inherit',
                      lineHeight: 'inherit',
                      whiteSpace: 'pre'
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
                    {codeContent}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return <code className={className} {...props}>{children}</code>;
          },
          img({node, src, alt, ...props}) {
            // Get the line number from the node position
            const lineNumber = (node as any)?.position?.start?.line;
            
            // Get the stored attributes for this image
            const attributes = (window as any).__imageAttributes?.get(lineNumber) || {
              width: 100,
              alignment: 'center'
            };

            // Don't show alt text if it looks like a filename
            const isFilename = /\.(jpg|jpeg|png|gif|webp)$/i.test(alt || '');
            const shouldShowAlt = !isFilename && alt;

            return (
              <div style={{ textAlign: attributes.alignment, margin: '1em 0' }}>
                <div style={{ 
                  display: 'inline-block',
                  width: `${attributes.width}%`,
                }}>
                  <img 
                    src={src} 
                    alt={shouldShowAlt ? alt : ''} 
                    style={{ 
                      width: '100%', 
                      height: 'auto',
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }} 
                    {...props} 
                  />
                  {shouldShowAlt && (
                    <div style={{ 
                      marginTop: '0.5em', 
                      color: '#666',
                      fontSize: '0.9em'
                    }}>
                      {alt}
                    </div>
                  )}
                </div>
              </div>
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
          },
          p({children, ...props}) {
            return (
              <p dir="auto" {...props}>
                {children}
              </p>
            );
          },
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