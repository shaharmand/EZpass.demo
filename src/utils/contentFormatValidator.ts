export interface FormatWarning {
  type: 'math' | 'code' | 'text';
  message: string;
}

export function validateMathFormat(text: string): FormatWarning[] {
  const warnings: FormatWarning[] = [];
  
  // Check for unmatched delimiters
  const dollarCount = (text.match(/\$\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    warnings.push({ type: 'math', message: 'חסר סוגר $$ למשוואה' });
  }

  const bracketCount = (text.match(/\\\[|\\\]/g) || []).length;
  if (bracketCount % 2 !== 0) {
    warnings.push({ type: 'math', message: 'חסר סוגר \\[ או \\] למשוואה' });
  }

  // Check for mixed delimiters
  if (text.includes('$$') && (text.includes('\\[') || text.includes('\\]'))) {
    warnings.push({ type: 'math', message: 'אין לערבב סוגי סוגריים למשוואות ($$  עם \\[)' });
  }

  // Check for code blocks inside math
  const mathBlocks = text.match(/\$\$(.*?)\$\$/g) || [];
  mathBlocks.forEach(block => {
    if (block.includes('```')) {
      warnings.push({ type: 'math', message: 'בלוק קוד בתוך משוואה' });
    }
  });

  return warnings;
}

export function validateCodeBlocks(text: string): FormatWarning[] {
  const warnings: FormatWarning[] = [];

  // Find all code blocks
  const codeBlocks = text.match(/```[\s\S]*?```/g) || [];

  codeBlocks.forEach(block => {
    // Must specify language
    if (block.match(/```\s*\n/)) {
      warnings.push({ type: 'code', message: 'חסרה שפת תכנות בבלוק קוד' });
    }

    // Check for math inside code blocks
    if (block.includes('$$') || block.includes('\\[')) {
      warnings.push({ type: 'code', message: 'משוואה בתוך בלוק קוד' });
    }

    // Check for proper closing
    if (!block.endsWith('```')) {
      warnings.push({ type: 'code', message: 'בלוק קוד לא נסגר כראוי' });
    }
  });

  // Check for nested code blocks
  const openings = (text.match(/```/g) || []).length;
  if (openings % 2 !== 0) {
    warnings.push({ type: 'code', message: 'מספר לא זוגי של סימוני קוד ```' });
  }

  // Check for math blocks immediately adjacent to code blocks
  if (text.match(/```.*?\$\$|\$\$.*?```/)) {
    warnings.push({ type: 'code', message: 'משוואה צמודה לבלוק קוד - יש להוסיף שורה ריקה' });
  }

  return warnings;
}

export function validateTextFormat(text: string): FormatWarning[] {
  const warnings: FormatWarning[] = [];
  
  // Check if text ends with a period, question mark, exclamation mark, colon, or hyphen
  if (!text.trim().match(/[.?!:\-]$/)) {
    warnings.push({ 
      type: 'text', 
      message: 'חסר סימן פיסוק בסוף השאלה (נקודה, סימן שאלה, סימן קריאה, נקודתיים או מקף)'
    });
  }

  return warnings;
}

export function validateContent(text: string): FormatWarning[] {
  if (!text) return [];
  
  return [
    ...validateMathFormat(text),
    ...validateCodeBlocks(text),
    ...validateTextFormat(text)
  ];
} 