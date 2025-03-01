/**
 * Validates and formats markdown text
 * @param text The markdown text to validate and format
 * @returns The formatted markdown text
 */
export const validateMarkdownFormat = (text: string): string => {
  // Remove extra whitespace
  let formatted = text.trim();
  
  // Ensure proper line endings
  formatted = formatted.replace(/\r\n/g, '\n');
  
  // Ensure single newline between paragraphs
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Ensure proper list formatting
  formatted = formatted.replace(/^\s*[-*]\s*/gm, '- ');
  
  return formatted;
};
