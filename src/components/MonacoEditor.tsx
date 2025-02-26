import React, { useRef, useEffect, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { Space, Button, Spin, Tabs, Card, Typography, Divider } from 'antd';
import { PlayCircleOutlined, CodeOutlined, BugOutlined, ThunderboltOutlined } from '@ant-design/icons/lib/icons';

const { Text } = Typography;


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
  disabled = false,
  testCases = []
}) => {
  const monaco = useMonaco();
  const [activeTab, setActiveTab] = useState('code');
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  // Configure Monaco editor when it's loaded
  React.useEffect(() => {
    if (monaco) {
      // Set editor options globally
      monaco.editor.defineTheme('ezpassTheme', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#ffffff',
        }
      });
    }
  }, [monaco]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  const handleRunTests = async () => {
    if (!testCases || !value) return;
    
    setIsRunning(true);
    setOutput('');
    
    try {
      // TODO: Implement actual code execution
      // Phase 1: Add Pyodide for Python support
      // Phase 2: Add server-side execution for Java/C#
      // Phase 3: Add additional languages and features
      
      let testOutput = '';
      testCases.forEach((test, index) => {
        testOutput += `=== Test Case ${index + 1} ===\n`;
        testOutput += `Input: ${test.input}\n`;
        testOutput += `Expected Output: ${test.expectedOutput}\n`;
        testOutput += `Your Output: [Running...]\n\n`;
      });
      
      setOutput(testOutput);
      setActiveTab('output');
      
      // Simulate test execution (replace with actual test runner)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      testOutput = '';
      testCases.forEach((test, index) => {
        testOutput += `=== Test Case ${index + 1} ===\n`;
        testOutput += `Input: ${test.input}\n`;
        testOutput += `Expected Output: ${test.expectedOutput}\n`;
        testOutput += `Your Output: [Not implemented yet]\n`;
        testOutput += `Status: Pending\n\n`;
      });
      
      setOutput(testOutput);
    } catch (error) {
      setOutput(`Error running tests: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const items = [
    {
      key: 'code',
      label: (
        <span>
          <PlayCircleOutlined /> קוד
        </span>
      ),
      children: (
        <div style={{ 
          height: '300px',
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <Editor
            defaultValue={template}
            value={value}
            language={language}
            theme="ezpassTheme"
            loading={<div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              backgroundColor: '#ffffff'
            }}>
              <Spin size="large" tip="טוען עורך קוד..." />
            </div>}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              lineNumbers: 'on',
              readOnly: disabled,
              renderWhitespace: 'selection',
              tabSize: 2,
              wordWrap: 'on',
              automaticLayout: true,
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible'
              },
              fixedOverflowWidgets: true,
              lineHeight: 20,
              padding: { top: 10, bottom: 10 },
              suggest: {
                showWords: true,
                showSnippets: true,
                showClasses: true,
                showFunctions: true,
                showVariables: true
              }
            }}
            onChange={handleEditorChange}
            onMount={(editor) => {
              // Focus the editor when it's mounted
              if (!disabled) {
                editor.focus();
              }
            }}
          />
        </div>
      )
    },
    {
      key: 'tests',
      label: (
        <span>
          <BugOutlined /> בדיקות
        </span>
      ),
      children: (
        <div style={{ padding: '16px' }}>
          {testCases?.map((test, index) => (
            <Card 
              key={index}
              size="small"
              title={`Test Case ${index + 1}`}
              style={{ marginBottom: '8px' }}
            >
              <Text strong>Input:</Text>
              <pre style={{ 
                background: '#f6f8fa',
                padding: '8px',
                borderRadius: '4px',
                marginBottom: '8px'
              }}>
                {test.input}
              </pre>
              <Text strong>Expected Output:</Text>
              <pre style={{ 
                background: '#f6f8fa',
                padding: '8px',
                borderRadius: '4px'
              }}>
                {test.expectedOutput}
              </pre>
            </Card>
          ))}
          {(!testCases || testCases.length === 0) && (
            <Text type="secondary">אין בדיקות זמינות לשאלה זו</Text>
          )}
        </div>
      )
    },
    {
      key: 'output',
      label: (
        <span>
          <ThunderboltOutlined /> פלט
        </span>
      ),
      children: (
        <div style={{ 
          padding: '16px',
          height: '300px',
          overflowY: 'auto',
          background: '#f6f8fa',
          borderRadius: '4px',
          fontFamily: 'monospace'
        }}>
          {output ? (
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
          ) : (
            <Text type="secondary">הרץ את הקוד כדי לראות את הפלט</Text>
          )}
        </div>
      )
    }
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Button 
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleRunTests}
            loading={isRunning}
            disabled={disabled || !testCases || testCases.length === 0}
          >
            הרץ בדיקות
          </Button>
          <Button 
            icon={<CodeOutlined />}
            onClick={() => {}}
          >
            סדר קוד
          </Button>
          <Button 
            icon={<BugOutlined />}
            onClick={() => {}}
          >
            דבג
          </Button>
          <Button 
            icon={<ThunderboltOutlined />}
            onClick={() => {}}
          >
            בדוק
          </Button>
        </Space>
        <Tabs
          defaultActiveKey="code"
          items={items}
          tabPosition="left"
          style={{ height: '100%' }}
        />
      </Space>
    </Card>
  );
}; 