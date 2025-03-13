import React, { useCallback, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { MATH_TRANSFORMERS } from '../../utils/mathTransformers';
import { IMAGE_TRANSFORMERS } from '../../utils/imageTransformers';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeNode } from '@lexical/code';
import styled from 'styled-components';
import { Button, Space, Tooltip, Modal, Upload, message } from 'antd';
import { FunctionOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons';
import { $getRoot, $createParagraphNode, $createTextNode, $getSelection } from 'lexical';
import type { LexicalEditor as LexicalEditorType } from 'lexical';
import { MathNode, $createMathNode } from './nodes/MathNode';
import { ImageNode } from './nodes/ImageNode';
import { LexicalEditorToolbar } from './LexicalEditorToolbar';
import { supabase } from '../../lib/supabase';
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';
import { MarkdownRenderer } from '../MarkdownRenderer';

interface ContainerProps {
  editable?: boolean;
}

const Container = styled.div<ContainerProps>`
  position: relative;
  background: #fff;
  border-radius: 8px;
  font-family: system-ui, -apple-system, sans-serif;
  transition: all 0.2s ease;

  ${props => props.editable ? `
    border: 1px solid #d9d9d9;
    
    &:hover {
      border-color: #1890ff;
    }

    &:focus-within {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  ` : ``}
`;

const Content = styled.div<{ editable?: boolean }>`
  position: relative;
  min-height: 150px;
  padding: 16px;
  transition: all 0.3s ease;
  border-radius: 4px;
  color: inherit;
`;

const StyledContentEditable = styled(ContentEditable)<{ editable: boolean }>`
  outline: none;
  min-height: 150px;
  cursor: ${props => props.editable ? 'text' : 'pointer'};
  padding: ${props => props.editable ? '0' : '4px 11px'};
  color: ${props => props.editable ? 'inherit' : 'rgba(0, 0, 0, 0.45)'};
  transition: color 0.3s ease;

  ${props => !props.editable && `
    &:hover {
      color: rgba(0, 0, 0, 0.85);
    }
  `}
`;

const PlaceholderText = styled.div`
  color: #999;
  overflow: hidden;
  position: absolute;
  text-overflow: ellipsis;
  top: 16px;
  left: 16px;
  right: 16px;
  user-select: none;
  white-space: nowrap;
  display: inline-block;
  pointer-events: none;
`;

function LexicalErrorBoundary({ children }: { children: React.ReactNode }) {
  return <React.Fragment>{children}</React.Fragment>;
}

const EditorToolbarContainer = styled.div`
  padding: 8px;
  border-bottom: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 8px 8px 0 0;
  transition: all 0.2s ease;

  .ant-btn {
    background: #fff;
    border-color: #d9d9d9;
    
    &:hover {
      color: #1890ff;
      border-color: #1890ff;
    }
    
    &:active {
      color: #096dd9;
      border-color: #096dd9;
    }
  }
`;

// Toolbar component with math and image buttons
function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const insertMath = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection) {
        const mathNode = $createMathNode('');
        selection.insertNodes([mathNode]);
        setIsModalVisible(true);
      }
    });
  }, [editor]);

  const handleUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `42yurj_1/${crypto.randomUUID()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('question-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (error) {
        console.error('Upload error:', error);
        message.error('העלאת התמונה נכשלה. אנא נסה שוב.');
        return;
      }

      if (data) {
        const { data: { publicUrl } } = supabase.storage
          .from('question-images')
          .getPublicUrl(fileName);

        editor.update(() => {
          const paragraph = $createParagraphNode();
          const imageNode = new ImageNode(publicUrl, file.name);
          paragraph.append(imageNode);
          $getRoot().append(paragraph);
        });
        
        setShowUploadModal(false);
        message.success('התמונה הועלתה בהצלחה');
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error('העלאת התמונה נכשלה. אנא נסה שוב.');
    }
  };

  const insertImage = useCallback(() => {
    setShowUploadModal(true);
  }, []);

  return (
    <EditorToolbarContainer className="editor-toolbar">
      <LexicalEditorToolbar />
      <Space style={{ marginTop: '8px' }}>
        <Tooltip title="הוספת נוסחה מתמטית" mouseEnterDelay={0.3} placement="bottom">
          <Button onClick={insertMath} icon={<FunctionOutlined />}>
            נוסחה
          </Button>
        </Tooltip>
        <Tooltip title="הוספת תמונה" mouseEnterDelay={0.3} placement="bottom">
          <Button onClick={insertImage} icon={<PictureOutlined />}>
            תמונה
          </Button>
        </Tooltip>
      </Space>

      <Modal
        title="העלאת תמונה"
        open={showUploadModal}
        onCancel={() => setShowUploadModal(false)}
        footer={null}
      >
        <Upload.Dragger
          accept="image/*"
          showUploadList={false}
          beforeUpload={async (file) => {
            await handleUpload(file);
            return false;
          }}
          style={{ padding: '20px' }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">לחץ או גרור תמונה לכאן</p>
          <p className="ant-upload-hint">ניתן להעלות תמונות מסוג PNG, JPG, GIF</p>
        </Upload.Dragger>
      </Modal>
    </EditorToolbarContainer>
  );
}

interface LexicalEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
}

interface LexicalEditorHandle {
  reset: (text: string) => void;
}

const LexicalEditor = React.forwardRef<LexicalEditorHandle, LexicalEditorProps>(({ 
  initialValue = '', 
  onChange, 
  placeholder = 'Enter some text...', 
  editable = true 
}, ref) => {
  const editorRef = React.useRef<LexicalEditorType | null>(null);
  const currentValueRef = React.useRef(initialValue);
  
  console.log('[LexicalEditor] Component props:', { initialValue, currentValueRef: currentValueRef.current });
  
  useEffect(() => {
    console.log('[LexicalEditor] Mount effect:', { initialValue, currentValue: currentValueRef.current });
  }, [initialValue]);

  // Reset method
  const handleReset = useCallback((newText: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.update(() => {
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();
      const text = $createTextNode(newText);
      paragraph.append(text);
      root.append(paragraph);
    });
    currentValueRef.current = newText;
  }, []);

  // Expose reset method through ref
  useImperativeHandle(ref, () => ({
    reset: handleReset
  }), [handleReset]);

  // If not editable, render markdown directly
  if (!editable) {
    return (
      <div style={{ padding: '16px' }}>
        <MarkdownRenderer content={initialValue} />
      </div>
    );
  }

  const initialConfig = {
    namespace: 'MyEditor',
    theme: {},
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
    editable,
    nodes: [
      MathNode,
      ImageNode,
      LinkNode,
      ListItemNode,
      ListNode,
      HeadingNode,
      QuoteNode,
      CodeNode
    ],
    editorState: (editor: LexicalEditorType) => {
      editorRef.current = editor;
      console.log('[LexicalEditor] Initializing with value:', initialValue);
      const root = $getRoot();
      root.clear();
      if (initialValue) {
        $convertFromMarkdownString(initialValue, [...TRANSFORMERS, ...MATH_TRANSFORMERS, ...IMAGE_TRANSFORMERS]);
      } else {
        const paragraph = $createParagraphNode();
        const text = $createTextNode('');
        paragraph.append(text);
        root.append(paragraph);
      }
      console.log('[LexicalEditor] Root content after init:', root.getTextContent());
    }
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <Container editable={editable}>
        <Toolbar />
        <Content editable={editable}>
          <RichTextPlugin
            contentEditable={<StyledContentEditable editable={editable} />}
            placeholder={<PlaceholderText>{placeholder}</PlaceholderText>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <LinkPlugin />
          <ListPlugin />
          <MarkdownShortcutPlugin transformers={[...TRANSFORMERS, ...MATH_TRANSFORMERS, ...IMAGE_TRANSFORMERS]} />
          <OnChangePlugin 
            onChange={(value) => {
              currentValueRef.current = value;
              onChange?.(value);
            }} 
            onRef={(editor: LexicalEditorType | null) => editorRef.current = editor} 
            originalValue={currentValueRef.current} 
          />
        </Content>
        <div style={{ 
          marginTop: '20px', 
          padding: '16px',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ 
            borderBottom: '1px solid #f0f0f0',
            marginBottom: '16px',
            paddingBottom: '8px',
            fontWeight: 500,
            color: '#666'
          }}>
            תצוגה מקדימה
          </div>
          <MarkdownRenderer content={currentValueRef.current || ''} />
        </div>
      </Container>
    </LexicalComposer>
  );
});

export default LexicalEditor;

// Simple OnChangePlugin that just reports changes
function OnChangePlugin({ 
  onChange, 
  onRef,
  originalValue
}: { 
  onChange?: (text: string) => void, 
  onRef?: (editor: LexicalEditorType | null) => void,
  originalValue: string
}) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    onRef?.(editor);
    return () => onRef?.(null);
  }, [editor, onRef]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const markdown = $convertToMarkdownString([...TRANSFORMERS, ...MATH_TRANSFORMERS, ...IMAGE_TRANSFORMERS]);
        console.log('[LexicalEditor] Content changed:', markdown);
        // Only emit changes if they differ from the original value
        if (markdown !== originalValue) {
          onChange?.(markdown);
        }
      });
    });
  }, [editor, onChange, originalValue]);

  return null;
} 