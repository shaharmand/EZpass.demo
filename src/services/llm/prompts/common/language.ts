export const LANGUAGE_REQUIREMENTS = `
Language Requirements

Generate ALL content in Hebrew (עברית).

Keep mathematical symbols and LaTeX in English.

Maintain right-to-left (RTL) formatting for all Hebrew text.
`;

export const MARKDOWN_FORMATTING = `
Markdown Formatting Requirements:

1. Content Formatting:
   - All text fields must use proper markdown formatting
   - Use proper RTL formatting for Hebrew text
   - Maintain clear paragraph structure and readability
   - Use appropriate line breaks for clarity

2. Mathematical Expressions:
   - Use $...$ for inline math (e.g., $F=mg$)
   - Use $$...$$ for block math (e.g., $$F = mg$$)
   - Keep mathematical terms in English
   - Format equations with proper spacing
   - Use single backslashes for LaTeX commands
   - Do not double escape LaTeX commands

3. Text Formatting:
   - Bold: **bold text** for emphasis
   - Lists: Use - for unordered lists
   - Lists: Use 1. for ordered lists
   - Code: Use \`\`\`language for code blocks
   - New Lines: Use proper line breaks
   - RTL: Ensure proper RTL formatting for Hebrew

4. Hebrew RTL Handling:
   - If markdown formatting breaks RTL flow:
     - Wrap Hebrew text in <div dir="rtl">...</div> inside markdown
     - Keep all code blocks left-aligned
     - Keep all LaTeX math expressions inline or inside $$...$$
`; 