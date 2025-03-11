import React, { useCallback } from 'react';
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
import { Button, Space } from 'antd';
import { FunctionOutlined, PictureOutlined } from '@ant-design/icons';
import { $createParagraphNode, $getRoot } from 'lexical';
import type { LexicalEditor as LexicalEditorType } from 'lexical';
import { MathNode, $createMathNode } from './nodes/MathNode';
import { ImageNode } from './nodes/ImageNode';
import { markdownToLexical, lexicalToMarkdown } from '../../utils/markdownConversion';
import { EditorToolbar } from './EditorToolbar';

const Container = styled.div`
  position: relative;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-family: system-ui, -apple-system, sans-serif;
`;

const Content = styled.div`
  position: relative;
  min-height: 150px;
  padding: 16px;
`;

const StyledContentEditable = styled(ContentEditable)`
  outline: none;
  min-height: 150px;
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

// Toolbar component with math and image buttons
function Toolbar() {
  const [editor] = useLexicalComposerContext();

  const insertMath = useCallback(() => {
    editor.update(() => {
      const paragraph = $createParagraphNode();
      const mathNode = $createMathNode('');
      paragraph.append(mathNode);
      $getRoot().append(paragraph);
    });
  }, [editor]);

  const insertImage = useCallback(() => {
    editor.update(() => {
      const paragraph = $createParagraphNode();
      const imageNode = new ImageNode('', 'Click to upload image');
      paragraph.append(imageNode);
      $getRoot().append(paragraph);
    });
  }, [editor]);

  return (
    <div className="editor-toolbar" style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}>
      <EditorToolbar />
      <Space style={{ marginTop: '8px' }}>
        <Button onClick={insertMath} icon={<FunctionOutlined />}>
          Math
        </Button>
        <Button onClick={insertImage} icon={<PictureOutlined />}>
          Image
        </Button>
      </Space>
    </div>
  );
}

interface LexicalEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export default function LexicalEditor({ initialValue = '', onChange, placeholder = 'Enter some text...' }: LexicalEditorProps) {
  const initialConfig = {
    namespace: 'MyEditor',
    theme: {},
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
    nodes: [
      MathNode,
      ImageNode,
      LinkNode,
      ListItemNode,
      ListNode,
      HeadingNode,
      QuoteNode,
      CodeNode
    ]
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <Container>
        <Toolbar />
        <Content>
          <RichTextPlugin
            contentEditable={<StyledContentEditable />}
            placeholder={<PlaceholderText>{placeholder}</PlaceholderText>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <LinkPlugin />
          <ListPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </Content>
      </Container>
    </LexicalComposer>
  );
} 