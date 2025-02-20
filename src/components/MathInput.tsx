import React, { useState, useEffect } from 'react';
import { Space, Button, Tooltip, Row, Col, Input } from 'antd';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import './MathInput.css';

const { TextArea } = Input;

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// Math symbols and operations to include in the toolbar
const mathTools = [
  { label: 'Fraction', latex: '\\frac{}{}', tooltip: 'שבר' },
  { label: 'Square Root', latex: '\\sqrt{}', tooltip: 'שורש ריבועי' },
  { label: 'Nth Root', latex: '\\sqrt[n]{}', tooltip: 'שורש n' },
  { label: 'Power', latex: '{}^{}', tooltip: 'חזקה' },
  { label: 'Subscript', latex: '{}_{}', tooltip: 'כתב תחתי' },
  { label: 'π', latex: '\\pi', tooltip: 'פאי' },
  { label: '±', latex: '\\pm', tooltip: 'פלוס מינוס' },
  { label: '∞', latex: '\\infty', tooltip: 'אינסוף' },
  { label: '=', latex: '=', tooltip: 'שווה' },
  { label: '≠', latex: '\\neq', tooltip: 'לא שווה' },
  { label: '≈', latex: '\\approx', tooltip: 'בערך שווה' },
  { label: '>', latex: '>', tooltip: 'גדול מ' },
  { label: '<', latex: '<', tooltip: 'קטן מ' },
  { label: '≥', latex: '\\geq', tooltip: 'גדול או שווה' },
  { label: '≤', latex: '\\leq', tooltip: 'קטן או שווה' },
  { label: 'sin', latex: '\\sin', tooltip: 'סינוס' },
  { label: 'cos', latex: '\\cos', tooltip: 'קוסינוס' },
  { label: 'tan', latex: '\\tan', tooltip: 'טנגנס' },
  { label: 'log', latex: '\\log', tooltip: 'לוגריתם' },
  { label: 'ln', latex: '\\ln', tooltip: 'לוגריתם טבעי' },
  { label: '∫', latex: '\\int', tooltip: 'אינטגרל' },
  { label: '∑', latex: '\\sum', tooltip: 'סכום' },
  { label: 'd/dx', latex: '\\frac{d}{dx}', tooltip: 'נגזרת' },
];

export const MathInput: React.FC<MathInputProps> = ({
  value,
  onChange,
  disabled,
  placeholder
}) => {
  const [preview, setPreview] = useState('');
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

  // Update preview when value changes
  useEffect(() => {
    try {
      const rendered = katex.renderToString(value || '', {
        throwOnError: false,
        displayMode: true,
        strict: false
      });
      setPreview(rendered);
    } catch (error) {
      console.error('Error rendering LaTeX:', error);
    }
  }, [value]);

  const insertSymbol = (latex: string) => {
    if (disabled || !textAreaRef.current) return;

    const start = textAreaRef.current.selectionStart;
    const end = textAreaRef.current.selectionEnd;
    const newValue = value.substring(0, start) + latex + value.substring(end);
    
    onChange(newValue);

    // Set cursor position after the inserted symbol
    setTimeout(() => {
      if (textAreaRef.current) {
        const newPosition = start + latex.length;
        textAreaRef.current.selectionStart = newPosition;
        textAreaRef.current.selectionEnd = newPosition;
        textAreaRef.current.focus();
      }
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* Math Toolbar */}
      <div className="math-toolbar">
        <Row gutter={[8, 8]}>
          {mathTools.map((tool, index) => (
            <Col key={index}>
              <Tooltip title={tool.tooltip} placement="top">
                <Button
                  onClick={() => insertSymbol(tool.latex)}
                  disabled={disabled}
                  style={{ minWidth: '40px' }}
                >
                  {tool.label}
                </Button>
              </Tooltip>
            </Col>
          ))}
        </Row>
      </div>

      {/* Input and Preview */}
      <div className="math-input-container">
        {/* LaTeX Input */}
        <TextArea
          ref={textAreaRef}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder || 'הקלד נוסחה מתמטית...'}
          autoSize={{ minRows: 2, maxRows: 6 }}
          className="math-latex-input"
        />
        
        {/* Live Preview */}
        <div 
          className="math-preview"
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      </div>
    </Space>
  );
}; 