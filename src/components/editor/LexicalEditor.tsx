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
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeNode } from '@lexical/code';
import styled from 'styled-components';
import { Button, Space, Tooltip, Modal, Upload, message } from 'antd';
import { FunctionOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import type { LexicalEditor as LexicalEditorType } from 'lexical';
import { MathNode, $createMathNode } from './nodes/MathNode';
import { ImageNode } from './nodes/ImageNode';
import { EditorToolbar } from './EditorToolbar';
import { supabase } from '../../lib/supabase';
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';

interface ContainerProps {
  $hasChanges?: boolean;
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
      border-color: ${props.$hasChanges ? '#FFD666' : '#1890ff'};
    }

    &:focus-within {
      border-color: ${props.$hasChanges ? '#FFD666' : '#1890ff'};
      box-shadow: 0 0 0 2px ${props.$hasChanges ? 'rgba(255, 214, 102, 0.2)' : 'rgba(24, 144, 255, 0.2)'};
    }
  ` : ``}

  ${props => props.editable && props.$hasChanges ? `
    border-color: #FFD666;
    background: #FFFBE6;
  ` : ''}
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  z-index: 1;
  border-radius: 4px;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: rgba(0, 0, 0, 0.85);
  }
`;

interface ContentProps {
  $hasChanges?: boolean;
  editable?: boolean;
}

const Content = styled.div<ContentProps>`
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

interface ToolbarProps {
  hasChanges?: boolean;
}

// Toolbar component with math and image buttons
function Toolbar({ hasChanges }: ToolbarProps) {
  const [editor] = useLexicalComposerContext();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const insertMath = useCallback(() => {
    editor.update(() => {
      const paragraph = $createParagraphNode();
      const mathNode = $createMathNode('');
      paragraph.append(mathNode);
      $getRoot().append(paragraph);
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
      <EditorToolbar />
      <Space style={{ marginTop: '8px' }}>
        <Tooltip 
          title="הוספת נוסחה מתמטית - לחץ כדי להוסיף נוסחה חדשה" 
          mouseEnterDelay={0.3}
          placement="bottom"
        >
          <Button onClick={insertMath} icon={<FunctionOutlined />}>
            נוסחה
          </Button>
        </Tooltip>
        <Tooltip 
          title="הוספת תמונה - לחץ כדי להעלות תמונה חדשה" 
          mouseEnterDelay={0.3}
          placement="bottom"
        >
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
  hasChanges?: boolean;
  editable?: boolean;
}

interface LexicalEditorHandle {
  reset: (text: string) => void;
}

// Debug helper
const debugLog = (section: string, data: any) => {
  console.log(`=== ${section} ===`);
  console.log(JSON.stringify(data, null, 2));
};

const LexicalEditor = React.forwardRef<LexicalEditorHandle, LexicalEditorProps>(({ 
  initialValue = '', 
  onChange, 
  placeholder = 'Enter some text...', 
  hasChanges: externalHasChanges = false,
  editable = true 
}, ref) => {
  const [internalHasChanges, setInternalHasChanges] = useState(false);
  const originalText = React.useRef(initialValue); // Store the very first initial value
  const currentText = React.useRef(initialValue);
  const isFirstMount = React.useRef(true);
  const wasExternalChange = React.useRef(false);
  const editorRef = React.useRef<LexicalEditorType | null>(null);
  
  // Shared cancel logic
  const handleCancel = useCallback((newText: string, isLocalCancel: boolean = false) => {
    console.log('=== LexicalEditor - Cancel Chain ===');
    console.log('LexicalEditor - handleCancel called with:', { 
      newText, 
      isLocalCancel,
      currentText: currentText.current,
      originalText: originalText.current,
      wasExternalChange: wasExternalChange.current
    });
    
    if (!editorRef.current) {
      console.log('LexicalEditor - ERROR: editorRef.current is null');
      console.log('=== LexicalEditor - Cancel Chain End ===');
      return;
    }
    
    // For local cancels, use the original text. For external cancels, use the new text
    const textToRestore = isLocalCancel ? originalText.current : newText;
    console.log('LexicalEditor - Will restore text:', textToRestore);
    
    // Prevent external change handling during reset
    wasExternalChange.current = true;
    
    // Reset the editor state
    console.log('LexicalEditor - About to update editor state');
    editorRef.current.update(() => {
      console.log('LexicalEditor - Inside update callback');
      const root = $getRoot();
      root.clear();
      $convertFromMarkdownString(textToRestore, TRANSFORMERS);
      console.log('LexicalEditor - Editor state updated');
    });
    
    // Update refs and state
    if (!isLocalCancel) {
      console.log('LexicalEditor - Updating originalText ref:', textToRestore);
      originalText.current = textToRestore;
    }
    currentText.current = textToRestore;
    setInternalHasChanges(false);
    console.log('LexicalEditor - Updated refs and state');
    
    // Reset external change flag after everything is done
    setTimeout(() => {
      wasExternalChange.current = false;
      console.log('LexicalEditor - Reset external change flag');
      console.log('=== LexicalEditor - Cancel Chain End ===');
    }, 0);
  }, []);

  // Expose reset method through ref
  useImperativeHandle(ref, () => ({
    reset: (text: string) => {
      console.log('LexicalEditor - reset() called with text:', text);
      handleCancel(text);
    }
  }), [handleCancel]);

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
      
      // Initial setup - only happens once
      if (isFirstMount.current) {
        const root = $getRoot();
        root.clear();
        $convertFromMarkdownString(initialValue, TRANSFORMERS);
        wasExternalChange.current = false;
        isFirstMount.current = false;
        originalText.current = initialValue;
        currentText.current = initialValue;
        
        debugLog('EDITOR INITIALIZED', {
          content: initialValue,
          initialText: originalText.current,
          currentText: currentText.current,
          wasExternalChange: false
        });
      }
    }
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <Container $hasChanges={internalHasChanges} editable={editable}>
        {editable && <Toolbar hasChanges={internalHasChanges} />}
        <Content $hasChanges={internalHasChanges} editable={editable}>
          <RichTextPlugin
            contentEditable={<StyledContentEditable editable={editable} />}
            placeholder={editable ? <PlaceholderText>{placeholder}</PlaceholderText> : null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <LinkPlugin />
          <ListPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <OnChangePlugin 
            onChange={(text) => {
              // Only update state if this wasn't triggered by an external change
              if (!wasExternalChange.current) {
                currentText.current = text;
                const hasChanged = text.trim() !== originalText.current.trim();
                
                debugLog('CONTENT CHANGED', {
                  currentText: text.trim(),
                  initialText: originalText.current.trim(),
                  hasChanged,
                  wasExternalChange: false
                });

                setInternalHasChanges(hasChanged);
              }
              
              onChange?.(text);
            }} 
          />
        </Content>
      </Container>
    </LexicalComposer>
  );
});

export default LexicalEditor;

// OnChangePlugin with debug
function OnChangePlugin({ onChange }: { onChange: (text: string) => void }) {
  const [editor] = useLexicalComposerContext();
  const updateCount = React.useRef(0);
  
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      updateCount.current++;
      
      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        debugLog('MARKDOWN CONVERSION', {
          updateCount: updateCount.current,
          content: markdown,
          stats: {
            length: markdown.length,
            newlines: (markdown.match(/\n/g) || []).length,
            paragraphs: markdown.split('\n\n').length
          }
        });
        onChange(markdown);
      });
    });
  }, [editor, onChange]);

  return null;
} 