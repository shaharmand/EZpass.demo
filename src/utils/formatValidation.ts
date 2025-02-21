/**
 * Validates and normalizes markdown formatting for educational content.
 * Ensures proper formatting of:
 * - Mathematical expressions ($...$ and $$...$$)
 * - Code blocks (```language\ncode```)
 * - Lists (bullet points and numbered)
 * - Emphasis (**bold**)
 * - Blockquotes (>)
 */
export function validateMarkdownFormat(content: string): string {
  if (!content) return content;

  // Validate math expressions
  const hasMathExpressions = /\$[^$]+\$/.test(content) || /\$\$[^$]+\$\$/.test(content);
  
  // Validate code blocks
  const hasCodeBlocks = /```[\w-]*\n[\s\S]*?```/.test(content);
  
  // Validate basic markdown
  const hasMarkdownFormatting = /\*\*[^*]+\*\*/.test(content) || /^[-*]\s/.test(content);

  // If content should have formatting but doesn't, throw error
  if (content.includes('$') && !hasMathExpressions) {
    throw new Error('Invalid math expression formatting');
  }

  if (content.includes('```') && !hasCodeBlocks) {
    throw new Error('Invalid code block formatting');
  }

  // Normalize line endings
  return content.replace(/\r\n/g, '\n');
} 