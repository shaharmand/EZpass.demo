import { DecoratorNode, SerializedLexicalNode } from 'lexical';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Modal, Button, Space, Tooltip } from 'antd';
import styled from 'styled-components';
import 'mathlive';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

// Define MathField interface
interface MathfieldElement extends HTMLElement {
  value: string;
  executeCommand: (command: string) => void;
  focus: () => void;
  blur: () => void;
  insert: (text: string) => void;
  selectionStart: number | null;
  selectionEnd: number | null;
  selection: string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': any;
    }
  }
}

export type SerializedMathNode = SerializedLexicalNode & {
  type: 'math';
  latex: string;
  version: 1;
};

const MathDisplay = styled.span`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  padding: 0;  // Removed padding
  margin: 0;   // Removed margin
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #f5f5f5;
  min-width: 20px;
  min-height: 32px;
  vertical-align: middle;
  line-height: 1;  // Reduced line height
  
  &:hover {
    border-color: #40a9ff;
    background: #e6f7ff;
  }

  .katex {
    font-size: 1.2em;
    line-height: 1;
    
    .katex-html {
      // Remove all padding and margins
      .mord, .mbin, .mrel, .mopen, .mclose {
        padding: 0;
        margin: 0;
      }
      
      // Minimal fraction spacing
      .mfrac {
        margin: 0;
        padding: 0;
        
        .frac-line {
          margin: 0;
        }
        
        .vlist-t {
          min-height: 2.6em;  // Minimum required for fractions
          
          .vlist-r:first-child > .vlist {
            margin-bottom: 1px;  // Minimal margin
          }
          
          .vlist-r:last-child > .vlist {
            margin-top: 1px;     // Minimal margin
          }
        }
      }
      
      // Minimal square root spacing
      .sqrt {
        padding: 0;
        
        & > .vlist {
          margin: 0;
        }

        .sqrt-line {
          padding: 0;
        }
      }
      
      // No spacing for superscripts and subscripts
      .msupsub {
        margin: 0;
        padding: 0;
      }

      // No spacing for base elements
      .base {
        margin: 0;
        padding: 0;
      }
    }
  }
`;

const StyledModal = styled(Modal)`
  /* Only keep essential math field styles */
  math-field::part(virtual-keyboard-toggle),
  math-field::part(menu-toggle) {
    display: none !important;
  }
`;

const MathToolbar = styled.div`
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
`;

const MathButton = styled(Button)`
  min-width: 45px;
  height: 45px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .box {
    position: relative;
    border: 1px solid currentColor;
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .fraction {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    font-size: 14px;
    line-height: 1;
    padding: 2px 0;
  }
  
  .fraction-line {
    width: 12px;
    height: 1px;
    background: currentColor;
    margin: 1px 0;
  }

  .subscript {
    position: absolute;
    right: -6px;
    bottom: -6px;
    font-size: 10px;
  }
`;

// Define common math operations
const MATH_OPERATIONS = [
  {
    label: '×',
    insert: '\\times',
    tooltip: 'כפל'
  },
  {
    label: '/',
    insert: '/',
    tooltip: 'חילוק'
  },
  {
    label: '±',
    insert: '\\pm',
    tooltip: 'פלוס מינוס'
  },
  {
    label: 'a²',
    insert: '^2',
    tooltip: 'לחץ כדי להעלות בריבוע את הביטוי האחרון או סמן ביטוי שתרצה להעלות בריבוע'
  },
  {
    label: <div className="fraction">
             <div>a</div>
             <div className="fraction-line"></div>
             <div>b</div>
           </div>,
    insert: '\\frac{}{}',
    tooltip: 'לחץ כדי ליצור שבר עם הביטוי האחרון במונה או סמן ביטוי שתרצה שיהיה במונה'
  },
  {
    label: <span dangerouslySetInnerHTML={{ __html: katex.renderToString('\\sqrt{a}', { throwOnError: false }) }} />,
    insert: '\\sqrt{}',
    tooltip: 'לחץ כדי להכניס לשורש את הביטוי האחרון או סמן ביטוי שתרצה שיכנס מתחת לשורש'
  },
  {
    label: '=',
    insert: '=',
    tooltip: 'שווה'
  },
  {
    label: '≈',
    insert: '\\approx',
    tooltip: 'בקירוב שווה'
  }
];

const MATH_SYMBOLS = ['+', '-', '=', '*', '/', ' '];

const LATEX_OPERATORS = [
  '\\cdot', '\\times', '\\div', 
  '\\pm', '\\mp',
  '\\cap', '\\cup',
  '\\wedge', '\\vee',
  '\\leq', '\\geq',
  '+', '-', '*', '/'
];

const SIMPLE_OPERATORS = ['\\cdot', '+', '-', '*', '/', '\\times'];
const EXPRESSION_MARKERS = [
  { start: '\\sqrt{', end: '}' },
  { start: '^', end: /[0-9]/ }  // for ^2, ^3, etc
];

const COMPLEX_OPERATORS = [
  { start: '^', end: '', type: 'superscript' },
  { start: '\\sqrt{', end: '}', type: 'function' },
  { start: '\\frac{', end: '}', type: 'function' }
];

export class MathNode extends DecoratorNode<JSX.Element> {
  __latex: string;

  static getType(): string {
    return 'math';
  }

  static clone(node: MathNode): MathNode {
    return new MathNode(node.__latex, node.__key);
  }

  constructor(latex: string, key?: string) {
    super(key);
    this.__latex = latex;
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'math-node';
    span.style.display = 'inline';
    return span;
  }

  updateDOM(): false {
    return false;
  }

  setLatex(latex: string): void {
    const self = this.getWritable();
    self.__latex = latex;
  }

  static importJSON(serializedNode: SerializedMathNode): MathNode {
    const node = $createMathNode(serializedNode.latex);
    return node;
  }

  exportJSON(): SerializedMathNode {
    return {
      type: 'math',
      latex: this.__latex,
      version: 1,
    };
  }

  decorate(): JSX.Element {
    return <MathComponent node={this} />;
  }
}

// Utility function to find and wrap the last expression
function findAndWrapExpression(currentValue: string, wrapper: (expr: string) => string): string {
  console.log('DEBUG - findAndWrapExpression input:', currentValue);
  
  // If the last non-space character is a closing brace, find its matching opening brace
  const trimmedValue = currentValue.trimEnd();
  if (trimmedValue.endsWith('}')) {
    let bracketCount = 0;
    let i = trimmedValue.length - 1;
    
    // Find matching opening bracket
    while (i >= 0) {
      if (trimmedValue[i] === '}') {
        bracketCount++;
      } else if (trimmedValue[i] === '{') {
        bracketCount--;
        if (bracketCount === 0) {
          // Found matching pair, now look for the start of the command
          let j = i - 1;
          while (j >= 0) {
            // Skip over \left and \right commands
            if (trimmedValue[j] === 't' && j >= 4 && trimmedValue.substring(j-4, j+1) === '\\left') {
              j -= 5;
              continue;
            }
            if (trimmedValue[j] === 't' && j >= 5 && trimmedValue.substring(j-5, j+1) === '\\right') {
              j -= 6;
              continue;
            }
            // Stop at actual command or operator
            if (trimmedValue[j] === '\\' || trimmedValue[j] === '+' || 
                trimmedValue[j] === '-' || trimmedValue[j] === '=' || trimmedValue[j] === ' ') {
              break;
            }
            j--;
          }
          const beforePart = currentValue.substring(0, j + 1);
          const expressionToWrap = currentValue.substring(j + 1);
          console.log('DEBUG - Found bracketed expression:');
          console.log('1. Expression:', expressionToWrap);
          console.log('2. Text before:', beforePart);
          return beforePart + wrapper(expressionToWrap);
        }
      }
      i--;
    }
  }
  
  // If no bracketed expression at the end, check for operators
  let lastOperatorIndex = -1;
  for (const op of ['+', '-', '=', '\\times', '\\div']) {
    const index = currentValue.lastIndexOf(op);
    if (index > lastOperatorIndex) {
      lastOperatorIndex = index;
    }
  }
  
  if (lastOperatorIndex >= 0) {
    // Take everything after the operator
    let startIndex = lastOperatorIndex + 1;
    while (startIndex < currentValue.length && currentValue[startIndex] === ' ') {
      startIndex++;
    }
    const beforePart = currentValue.substring(0, startIndex);
    const expressionToWrap = currentValue.substring(startIndex).trim();
    console.log('DEBUG - Found operator:');
    console.log('1. Operator:', currentValue.substring(lastOperatorIndex, startIndex));
    console.log('2. Expression after:', expressionToWrap);
    return expressionToWrap ? beforePart + wrapper(expressionToWrap) : currentValue + wrapper(' ');
  }
  
  // If no operators found, wrap the entire text if not empty
  console.log('DEBUG - No operators or brackets found, using entire text:', currentValue);
  return currentValue.trim() ? wrapper(currentValue) : wrapper(' ');
}

function MathComponent({ node }: { node: MathNode }) {
  const [editor] = useLexicalComposerContext();
  const [isModalVisible, setIsModalVisible] = useState(!node.__latex);  // Open immediately if no latex
  const [currentLatex, setCurrentLatex] = useState(node.__latex || '');
  const [renderedMath, setRenderedMath] = useState<string>('');
  const mathFieldRef = useRef<MathfieldElement | null>(null);

  useEffect(() => {
    if (node.__latex) {
      try {
        const html = katex.renderToString(node.__latex, {
          throwOnError: false,
          displayMode: false,
          output: 'html'
        });
        setRenderedMath(html);
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        setRenderedMath('Invalid math expression');
      }
    } else {
      setRenderedMath('');
    }
  }, [node.__latex]);

  const handleClick = useCallback(() => {
    setIsModalVisible(true);
    // If it's an existing node, use its latex content
    setCurrentLatex(node.__latex || '');
  }, [node.__latex]);

  const handleOk = useCallback(() => {
    if (mathFieldRef.current) {
      const latex = mathFieldRef.current.value;
      if (latex.trim()) {
        editor.update(() => {
          node.setLatex(latex);
        });
      } else {
        // Remove empty node
        editor.update(() => {
          node.remove();
        });
      }
    }
    setIsModalVisible(false);
  }, [editor, node]);

  const handleCancel = useCallback(() => {
    // If it's a new node (no latex), remove it
    if (!node.__latex) {
      editor.update(() => {
        node.remove();
      });
    } else {
      // Restore previous value
      if (mathFieldRef.current) {
        mathFieldRef.current.value = node.__latex;
      }
      setCurrentLatex(node.__latex);
    }
    setIsModalVisible(false);
  }, [editor, node, node.__latex]);

  const handleChange = useCallback((evt: any) => {
    const newValue = evt.target.value;
    setCurrentLatex(newValue);
    // Also update the ref's value
    if (mathFieldRef.current) {
      mathFieldRef.current.value = newValue;
    }
  }, []);

  const handleInsert = (latex: string) => {
    if (mathFieldRef.current) {
      const mathField = mathFieldRef.current;
      const currentValue = mathField.value;
      
      console.log('DEBUG - Initial latex string:', currentValue);
      
      // Get selection from mathfield directly
      console.log('DEBUG - Selection info:');
      console.log('mathfield.selection:', mathField.selection);
      console.log('mathfield.selectionStart:', mathField.selectionStart);
      console.log('mathfield.selectionEnd:', mathField.selectionEnd);
      
      // Try using mathfield's insert with selection
      if (latex === '\\sqrt{}') {
        mathField.insert('\\sqrt{#@}');  // #@ is MathLive's placeholder for selection
      } else if (latex === '\\frac{}{}') {
        mathField.insert('\\frac{#@}{}');
        mathField.executeCommand('moveToPreviousChar');  // Move cursor back into denominator
      } else if (latex === '^2') {
        mathField.insert('#@^2');
      } else {
        mathField.insert(latex);
      }
      
      console.log('DEBUG - Final latex string:', mathField.value);
      mathField.focus();
      setCurrentLatex(mathField.value);
    }
  };

  const handleSquareSelected = useCallback(() => {
    if (mathFieldRef.current) {
      const mathField = mathFieldRef.current;
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const selectedText = selection.toString().trim();
        // Replace the selection with the squared version
        mathField.executeCommand('deleteBackward');  // Clear selection
        mathField.insert(`${selectedText}^2`);
        mathField.focus();
      }
    }
  }, []);

  useEffect(() => {
    if (isModalVisible) {
      // Add a small delay to ensure the math field is properly mounted
      setTimeout(() => {
        const mathField = document.querySelector('math-field') as MathfieldElement;
        if (mathField) {
          mathFieldRef.current = mathField;
          
          // Set initial value based on whether it's a new or existing node
          const initialValue = node.__latex || '';
          mathField.value = initialValue;
          setCurrentLatex(initialValue);
          mathField.focus();

          const handleKeyDown = (evt: Event) => {
            const keyEvent = evt as KeyboardEvent;
            if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
              evt.preventDefault();
              handleOk();
            } else if (keyEvent.key === 'Escape') {
              evt.preventDefault();
              handleCancel();
            }
          };

          mathField.addEventListener('keydown', handleKeyDown);
          
          return () => {
            mathField.removeEventListener('keydown', handleKeyDown);
          };
        }
      }, 100);
    }
  }, [isModalVisible, handleOk, handleCancel, node.__latex]);  // Add node.__latex back to deps

  return (
    <>
      {renderedMath ? (
        <MathDisplay 
          onClick={handleClick}
          dangerouslySetInnerHTML={{ __html: renderedMath }}
          style={{ display: 'inline-flex' }}
        />
      ) : (
        <MathDisplay 
          onClick={() => setIsModalVisible(true)}
          style={{ display: 'inline-flex' }}
        >
          {/* Empty span for click target when no expression */}
        </MathDisplay>
      )}
      
      <StyledModal
        title="עריכת נוסחה מתמטית"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="אישור"
        cancelText="ביטול"
        width={600}
        destroyOnClose
        maskClosable={false}
      >
        <MathToolbar>
          <Space wrap>
            {MATH_OPERATIONS.map((op) => (
              <Tooltip key={typeof op.label === 'string' ? op.label : op.insert} title={op.tooltip}>
                <MathButton 
                  onClick={() => handleInsert(op.insert)}
                >
                  {op.label}
                </MathButton>
              </Tooltip>
            ))}
          </Space>
        </MathToolbar>
        <math-field
          ref={mathFieldRef}
          style={{ width: '100%', minHeight: '100px', fontSize: '20px', padding: '8px' }}
          value={currentLatex}
          onChange={handleChange}
          virtual-keyboard-mode="off"
          virtual-keyboards="off"
          keyboard-mode="manual"
          menu-editor="none"
        />
      </StyledModal>
    </>
  );
}

export function $createMathNode(latex: string): MathNode {
  return new MathNode(latex);
}

export function $isMathNode(node: any): boolean {
  return node instanceof MathNode;
} 