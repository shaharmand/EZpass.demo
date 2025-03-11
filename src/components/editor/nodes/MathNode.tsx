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

const MathDisplay = styled.div`
  display: inline-block;
  cursor: pointer;
  padding: 4px;
  margin: 0 2px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #f5f5f5;
  min-width: 50px;
  min-height: 30px;
  
  &:hover {
    border-color: #40a9ff;
    background: #e6f7ff;
  }
`;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    position: relative;
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
    gap: 3px;
  }
  
  .fraction-line {
    width: 14px;
    height: 1px;
    background: currentColor;
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
    label: '√',
    insert: '\\sqrt{}'  // Has special handling for selection
  },
  {
    label: <div className="fraction">
             <div>a</div>
             <div className="fraction-line"></div>
             <div>b</div>
           </div>,
    insert: '\\frac{}{}'  // Has special handling for expressions
  },
  {
    label: 'x²',
    insert: '^2'  // Has special handling for selection
  },
  {
    label: '×',
    insert: '\\times'
  },
  {
    label: '÷',
    insert: '\\div'
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
    const div = document.createElement('div');
    div.className = 'math-node';
    return div;
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

function findLastCompleteExpression(text: string): { beforeIndex: number, afterIndex: number } | null {
  // First check for expressions like sqrt{} and ^2
  for (const marker of EXPRESSION_MARKERS) {
    const startIndex = text.lastIndexOf(marker.start);
    if (startIndex >= 0) {
      if (marker.start === '^') {
        // For superscripts, take the character before ^ and the number after
        const beforeStart = startIndex > 0 ? startIndex - 1 : startIndex;
        const afterIndex = startIndex + 1;
        if (afterIndex < text.length && /[0-9]/.test(text[afterIndex])) {
          return {
            beforeIndex: beforeStart,
            afterIndex: afterIndex + 1
          };
        }
      } else if (marker.start === '\\sqrt{') {
        // For sqrt, find matching closing brace
        let depth = 1;
        let i = startIndex + marker.start.length;
        while (i < text.length && depth > 0) {
          if (text[i] === '{') depth++;
          if (text[i] === '}') depth--;
          i++;
        }
        if (depth === 0) {
          return {
            beforeIndex: startIndex,
            afterIndex: i
          };
        }
      }
    }
  }

  // Then check for simple operators
  let lastIndex = -1;
  let foundOp = '';
  for (const op of SIMPLE_OPERATORS) {
    const index = text.lastIndexOf(op);
    if (index > lastIndex) {
      lastIndex = index;
      foundOp = op;
    }
  }
  
  if (lastIndex >= 0) {
    return {
      beforeIndex: lastIndex + foundOp.length,  // After the operator (include it in first part)
      afterIndex: text.length  // Take everything after
    };
  }
  
  return null;
}

function MathComponent({ node }: { node: MathNode }) {
  const [editor] = useLexicalComposerContext();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentLatex, setCurrentLatex] = useState(node.__latex);
  const [renderedMath, setRenderedMath] = useState<string>('');
  const mathFieldRef = useRef<MathfieldElement | null>(null);

  useEffect(() => {
    if (node.__latex) {
      try {
        const html = katex.renderToString(node.__latex, {
          throwOnError: false,
          displayMode: true
        });
        setRenderedMath(html);
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        setRenderedMath('Invalid math expression');
      }
    } else {
      setRenderedMath('Click to edit math');
    }
  }, [node.__latex]);

  const handleClick = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const handleOk = useCallback(() => {
    if (mathFieldRef.current) {
      // Get the latest value directly from the math field
      const latex = mathFieldRef.current.value;
      editor.update(() => {
        node.setLatex(latex);
      });
    }
    setIsModalVisible(false);
  }, [editor, node]);

  const handleCancel = useCallback(() => {
    setCurrentLatex(node.__latex);
    setIsModalVisible(false);
  }, [node.__latex]);

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
      const selection = window.getSelection();
      let textToUse = selection ? selection.toString().trim() : '';
      
      if (latex === '\\frac{}{}') {
        const currentValue = mathField.value;
        const lastExpression = findLastCompleteExpression(currentValue);
        
        if (lastExpression) {
          const beforeOp = currentValue.substring(0, lastExpression.beforeIndex);
          const afterOp = currentValue.substring(lastExpression.beforeIndex);
          const newValue = beforeOp + '\\frac{' + afterOp + '}{}';
          mathField.value = newValue;
        } else {
          mathField.value = '\\frac{' + currentValue + '}{}';
        }
        mathField.focus();
        mathField.executeCommand('moveToPreviousChar');
      } else if (latex === '\\sqrt{}') {
        if (textToUse) {
          mathField.executeCommand('deleteBackward');
          mathField.insert('\\sqrt{' + textToUse + '}');
        } else {
          mathField.insert('\\sqrt{\\phantom{\\quad}}');
          mathField.executeCommand('moveToPreviousChar');
          mathField.executeCommand('moveToPreviousChar');
        }
      } else if (latex === '^2' || latex === '^3') {
        if (textToUse) {
          mathField.executeCommand('deleteBackward');
          mathField.insert(textToUse + latex);
        } else {
          mathField.insert(latex);
        }
      } else {
        mathField.insert(latex);
      }
      
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
          mathField.value = currentLatex;
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
  }, [isModalVisible, handleOk, handleCancel, currentLatex]);

  return (
    <>
      <MathDisplay 
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: renderedMath }}
      />
      
      <StyledModal
        title="Edit Math Equation"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={600}
        destroyOnClose
        maskClosable={false}
      >
        <MathToolbar>
          <Space wrap>
            {MATH_OPERATIONS.map((op) => (
              <MathButton 
                key={typeof op.label === 'string' ? op.label : op.insert}
                onClick={() => handleInsert(op.insert)}
              >
                {op.label}
              </MathButton>
            ))}
          </Space>
        </MathToolbar>
        <math-field
          ref={mathFieldRef}
          style={{ width: '100%', minHeight: '100px', fontSize: '20px', padding: '8px' }}
          value={currentLatex}
          onChange={handleChange}
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