import React, { useEffect, useRef } from 'react';
import { Modal } from 'antd';
import 'mathlive';
import { MathfieldElement } from 'mathlive';

interface MathLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latex: string) => void;
  initialLatex?: string;
}

export const MathLiveModal: React.FC<MathLiveModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialLatex = ''
}) => {
  const mathfieldRef = useRef<MathfieldElement | null>(null);

  useEffect(() => {
    if (isOpen && !mathfieldRef.current) {
      const mathfield = new MathfieldElement();
      mathfield.value = initialLatex;
      
      // Set styles
      mathfield.style.width = '100%';
      mathfield.style.height = '150px';
      mathfield.style.fontSize = '20px';
      
      // Configure MathLive using attributes
      mathfield.setAttribute('virtual-keyboard-mode', 'manual');
      mathfield.setAttribute('virtual-keyboards', 'all');
      mathfield.setAttribute('smart-mode', 'true');
      mathfield.setAttribute('smart-fence', 'true');
      mathfield.setAttribute('remove-extraneous-parentheses', 'true');
      mathfield.setAttribute('math-mode-space', '\\;');

      const container = document.getElementById('mathlive-container');
      if (container) {
        container.innerHTML = '';
        container.appendChild(mathfield);
        mathfieldRef.current = mathfield;
      }
    }
  }, [isOpen, initialLatex]);

  const handleInsert = () => {
    if (mathfieldRef.current) {
      const latex = mathfieldRef.current.value;
      onInsert(latex);
      onClose();
    }
  };

  return (
    <Modal
      title="Insert Math Equation"
      open={isOpen}
      onCancel={onClose}
      onOk={handleInsert}
      width={600}
      okText="Insert"
      cancelText="Cancel"
    >
      <div id="mathlive-container" style={{ minHeight: '150px', marginBottom: '16px' }} />
    </Modal>
  );
}; 