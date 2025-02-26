import React from 'react';
import { Space, Button, Card, Tabs } from 'antd';
import MDEditor, { commands } from '@uiw/react-md-editor';
import { MarkdownRenderer } from './MarkdownRenderer';
import { 
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  CheckSquareOutlined,
  LinkOutlined,
  PictureOutlined,
  CodeOutlined,
  MinusOutlined
} from '@ant-design/icons';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
}

// Custom commands with Hebrew tooltips
const hebrewCommands = {
  bold: {
    ...commands.bold,
    icon: <BoldOutlined style={{ fontSize: '16px' }} />,
    title: 'מודגש (Ctrl+B)'
  },
  italic: {
    ...commands.italic,
    icon: <ItalicOutlined style={{ fontSize: '16px' }} />,
    title: 'נטוי (Ctrl+I)'
  },
  strikethrough: {
    ...commands.strikethrough,
    icon: <StrikethroughOutlined style={{ fontSize: '16px' }} />,
    title: 'קו חוצה'
  },
  hr: {
    ...commands.hr,
    icon: <MinusOutlined style={{ fontSize: '16px' }} />,
    title: 'קו מפריד'
  },
  orderedList: {
    ...commands.orderedListCommand,
    icon: <OrderedListOutlined style={{ fontSize: '16px' }} />,
    title: 'רשימה ממוספרת'
  },
  unorderedList: {
    ...commands.unorderedListCommand,
    icon: <UnorderedListOutlined style={{ fontSize: '16px' }} />,
    title: 'רשימת תבליטים'
  },
  checkedList: {
    ...commands.checkedListCommand,
    icon: <CheckSquareOutlined style={{ fontSize: '16px' }} />,
    title: 'רשימת סימון'
  },
  link: {
    ...commands.link,
    icon: <LinkOutlined style={{ fontSize: '16px' }} />,
    title: 'הוסף קישור'
  },
  image: {
    ...commands.image,
    icon: <PictureOutlined style={{ fontSize: '16px' }} />,
    title: 'הוסף תמונה'
  },
  code: {
    ...commands.code,
    icon: <CodeOutlined style={{ fontSize: '16px' }} />,
    title: 'קוד'
  }
};

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel
}) => {
  const handleChange = (val: string | undefined) => {
    onChange(val || '');
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Tabs
          defaultActiveKey="edit"
          items={[
            {
              key: 'edit',
              label: 'עריכה',
              children: (
                <div style={{ border: '1px solid #d9d9d9', padding: '8px', minHeight: '400px' }}>
                  <MDEditor
                    value={value}
                    onChange={handleChange}
                    preview="edit"
                    height={400}
                    textareaProps={{
                      dir: 'rtl',
                      style: {
                        direction: 'rtl',
                        textAlign: 'right',
                        unicodeBidi: 'plaintext'
                      }
                    }}
                    previewOptions={{
                      direction: 'rtl'
                    }}
                    style={{}}
                    commands={[
                      hebrewCommands.bold,
                      hebrewCommands.italic,
                      hebrewCommands.strikethrough,
                      hebrewCommands.hr,
                      commands.divider,
                      hebrewCommands.link,
                      hebrewCommands.image,
                      hebrewCommands.code,
                      commands.divider,
                      hebrewCommands.orderedList,
                      hebrewCommands.unorderedList,
                      hebrewCommands.checkedList
                    ]}
                  />
                </div>
              )
            },
            {
              key: 'preview',
              label: 'תצוגה מקדימה',
              children: (
                <div style={{ minHeight: '400px', padding: '16px' }}>
                  <MarkdownRenderer content={value} />
                </div>
              )
            }
          ]}
        />
        {(onSave || onCancel) && (
          <Space>
            {onCancel && (
              <Button onClick={onCancel}>
                ביטול
              </Button>
            )}
            {onSave && (
              <Button type="primary" onClick={onSave}>
                שמירה
              </Button>
            )}
          </Space>
        )}
      </Space>

      <style>{`
        .w-md-editor {
          direction: rtl !important;
          text-align: right !important;
          background: #ffffff !important;
        }
        
        .w-md-editor-text {
          direction: rtl !important;
          text-align: right !important;
        }
        
        .w-md-editor-text-pre > code,
        .w-md-editor-text-input {
          direction: rtl !important;
          text-align: right !important;
          unicode-bidi: plaintext !important;
          font-size: 16px !important;
          line-height: 1.6 !important;
        }
        
        .w-md-editor-toolbar {
          direction: rtl !important;
          border-bottom: 1px solid #e5e7eb;
          background: #fafafa !important;
          padding: 8px !important;
        }

        .w-md-editor-toolbar ul {
          display: flex !important;
          flex-direction: row-reverse !important;
          gap: 4px !important;
        }

        .w-md-editor-toolbar li > button {
          height: 32px !important;
          width: 32px !important;
          padding: 4px !important;
          color: #1f2937 !important;
          border-radius: 4px !important;
          transition: all 0.2s !important;
        }

        .w-md-editor-toolbar li > button:hover {
          background: #e5e7eb !important;
          color: #000000 !important;
        }

        .w-md-editor-toolbar li > button svg {
          width: 16px !important;
          height: 16px !important;
        }
        
        .w-md-editor-input {
          direction: rtl !important;
          text-align: right !important;
          unicode-bidi: plaintext !important;
          padding: 16px !important;
        }
        
        .w-md-editor textarea {
          direction: rtl !important;
          text-align: right !important;
          unicode-bidi: plaintext !important;
          caret-color: #000 !important;
          font-size: 16px !important;
          line-height: 1.6 !important;
          padding: 16px !important;
        }
        
        .wmde-markdown {
          direction: rtl !important;
          text-align: right !important;
          font-size: 16px !important;
          line-height: 1.6 !important;
        }

        /* Bullet and list styling */
        .wmde-markdown ul {
          list-style-type: disc !important;
          padding-right: 24px !important;
          padding-left: 0 !important;
        }

        .wmde-markdown ol {
          padding-right: 24px !important;
          padding-left: 0 !important;
        }

        .wmde-markdown ul li::marker {
          color: #3b82f6 !important;
        }

        .wmde-markdown ol li::marker {
          color: #3b82f6 !important;
        }

        /* Code block styling */
        .wmde-markdown code {
          direction: ltr !important;
          text-align: left !important;
          background: #f3f4f6 !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
          color: #dc2626 !important;
        }

        .wmde-markdown pre code {
          background: #1f2937 !important;
          color: #e5e7eb !important;
          padding: 16px !important;
          border-radius: 8px !important;
        }

        /* Blockquote styling */
        .wmde-markdown blockquote {
          border-right: 4px solid #3b82f6 !important;
          border-left: none !important;
          padding-right: 16px !important;
          padding-left: 0 !important;
          color: #4b5563 !important;
          background: #f3f4f6 !important;
          border-radius: 4px !important;
        }

        /* Table styling */
        .wmde-markdown table {
          direction: rtl !important;
          text-align: right !important;
          border-collapse: collapse !important;
        }

        .wmde-markdown th,
        .wmde-markdown td {
          border: 1px solid #e5e7eb !important;
          padding: 8px 12px !important;
        }

        .wmde-markdown th {
          background: #f3f4f6 !important;
        }

        /* Checkbox styling */
        .wmde-markdown input[type="checkbox"] {
          margin-left: 8px !important;
          margin-right: 0 !important;
        }

        /* Link styling */
        .wmde-markdown a {
          color: #3b82f6 !important;
          text-decoration: none !important;
        }

        .wmde-markdown a:hover {
          text-decoration: underline !important;
        }

        /* Heading styling */
        .wmde-markdown h1,
        .wmde-markdown h2,
        .wmde-markdown h3,
        .wmde-markdown h4,
        .wmde-markdown h5,
        .wmde-markdown h6 {
          border-bottom: 1px solid #e5e7eb !important;
          padding-bottom: 8px !important;
          margin-top: 24px !important;
          margin-bottom: 16px !important;
          color: #1f2937 !important;
        }
      `}</style>
    </Card>
  );
};