import React from 'react';
import { Input, Space, Button, Tooltip } from 'antd';
import './SimpleTextMathInput.css';

const { TextArea } = Input;

// Common math symbols that are easy to understand and use
const MATH_SYMBOLS = [
  { symbol: '+', tooltip: 'חיבור' },
  { symbol: '−', tooltip: 'חיסור' },
  { symbol: '×', tooltip: 'כפל' },
  { symbol: '÷', tooltip: 'חילוק' },
  { symbol: '=', tooltip: 'שווה' },
  { symbol: '≠', tooltip: 'לא שווה' },
  { symbol: '>', tooltip: 'גדול מ' },
  { symbol: '<', tooltip: 'קטן מ' },
  { symbol: '≥', tooltip: 'גדול או שווה' },
  { symbol: '≤', tooltip: 'קטן או שווה' },
  { symbol: '²', tooltip: 'בריבוע' },
  { symbol: '³', tooltip: 'בחזקת 3' },
  { symbol: '√', tooltip: 'שורש' },
  { symbol: 'π', tooltip: 'פאי' },
  { symbol: '∞', tooltip: 'אינסוף' },
];

interface SimpleTextMathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const SimpleTextMathInput: React.FC<SimpleTextMathInputProps> = ({
  value,
  onChange,
  placeholder = 'הקלד את תשובתך כאן...',
  disabled = false,
}) => {
  const textAreaRef = React.useRef<any>(null);

  const insertSymbol = (symbol: string) => {
    if (disabled || !textAreaRef.current) return;

    const textarea = textAreaRef.current.resizableTextArea.textArea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = value || '';
    
    const newValue = currentValue.substring(0, start) + symbol + currentValue.substring(end);
    onChange(newValue);

    // Set cursor position after the inserted symbol
    setTimeout(() => {
      const newPosition = start + symbol.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  return (
    <div className="simple-math-input">
      {/* Math Symbols Toolbar */}
      <div className="math-symbols-toolbar">
        <Space wrap>
          {MATH_SYMBOLS.map(({ symbol, tooltip }) => (
            <Tooltip key={symbol} title={tooltip}>
              <Button
                type="text"
                onClick={() => insertSymbol(symbol)}
                disabled={disabled}
              >
                {symbol}
              </Button>
            </Tooltip>
          ))}
        </Space>
      </div>

      {/* Text Input Area */}
      <TextArea
        ref={textAreaRef}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoSize={{ minRows: 3, maxRows: 6 }}
        className="math-text-input"
        dir="auto"
      />
    </div>
  );
}; 