import React from 'react';
import Editor from '@monaco-editor/react';
import { Space, Button } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  template?: string;
  disabled?: boolean;
  testCases?: {
    input: string;
    expectedOutput: string;
  }[];
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language,
  template,
  disabled,
  testCases
}) => {
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  const handleRunTests = () => {
    if (!testCases || !value) return;
    
    // Here you would implement test running logic
    console.log('Running tests with current code:', value);
    testCases.forEach((test, index) => {
      console.log(`Test ${index + 1}:`, { input: test.input, expected: test.expectedOutput });
    });
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <div style={{ 
        height: '300px',
        border: '1px solid #e2e8f0',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <Editor
          value={template || value}
          language={language}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            readOnly: disabled,
            renderWhitespace: 'selection',
            tabSize: 2,
            wordWrap: 'on'
          }}
          onChange={handleEditorChange}
        />
      </div>
      {testCases && testCases.length > 0 && (
        <Button
          icon={<PlayCircleOutlined />}
          onClick={handleRunTests}
          disabled={disabled}
        >
          הרץ בדיקות
        </Button>
      )}
    </Space>
  );
}; 