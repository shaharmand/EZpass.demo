import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import styled from 'styled-components';
import { EditorToolbar } from './EditorToolbar';
import { markdownToLexical, lexicalToMarkdown } from '../../utils/markdownConversion';

const EditorContainer = styled.div`
  position: relative;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-family: system-ui, -apple-system;
  direction: rtl;
  
  &:hover {
    border-color: #40a9ff;
  }
  
  &:focus-within {
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

  &.has-changes {
    background: #fffbe6;
    border-color: #faad14;
    
    &:hover, &:focus-within {
      border-color: #d48806;
      box-shadow: 0 0 0 2px rgba(250, 173, 20, 0.2);
    }
  }
`;

const EditorContent = styled.div`
  position: relative;
  text-align: right;
`;

const ContentEditableStyled = styled(ContentEditable)`
  min-height: 150px;
  padding: 12px;
  outline: none;
  
  p {
    margin: 0;
    margin-bottom: 8px;
  }
  
  .editor-paragraph {
    margin: 0;
    margin-bottom: 8px;
  }

  ul, ol {
    margin: 0;
    margin-bottom: 8px;
    padding-right: 24px;
    padding-left: 0;
  }

  li {
    margin: 0;
    margin-bottom: 4px;
  }
`;

const Placeholder = styled.div`
  color: #999;
  overflow: hidden;
  position: absolute;
  text-overflow: ellipsis;
  top: 12px;
  right: 12px;
  left: 12px;
  user-select: none;
  white-space: nowrap;
  display: inline-block;
  pointer-events: none;
`;

// Define the editor theme
const theme = {
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
  paragraph: 'editor-paragraph',
};

// Define the nodes we want to use
const nodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  AutoLinkNode,
  LinkNode,
];

interface LexicalEditorProps {
  onChange?: (editorState: string) => void;
  initialContent?: string;
  placeholder?: string;
  hasChanges?: boolean;
}

function OnChangePlugin({ onChange }: { onChange?: (editorState: string) => void }) {
  const [editor] = useLexicalComposerContext();
  
  React.useEffect(() => {
    if (onChange) {
      return editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const markdown = lexicalToMarkdown(JSON.stringify(editorState.toJSON()));
          onChange(markdown);
        });
      });
    }
  }, [editor, onChange]);
  
  return null;
}

function LexicalErrorBoundary({ children }: { children: React.ReactNode }) {
  return <React.Fragment>{children}</React.Fragment>;
}

export function LexicalEditor({ onChange, initialContent, placeholder, hasChanges }: LexicalEditorProps) {
  const initialConfig = {
    namespace: 'QuestionEditor',
    theme,
    nodes,
    onError: (error: Error) => {
      console.error('Lexical Editor Error:', error);
    },
    editorState: initialContent ? markdownToLexical(initialContent) : undefined,
  };

  return (
    <EditorContainer className={hasChanges ? 'has-changes' : ''}>
      <LexicalComposer initialConfig={initialConfig}>
        <EditorToolbar />
        <EditorContent>
          <RichTextPlugin
            contentEditable={<ContentEditableStyled />}
            placeholder={
              <Placeholder>{placeholder || 'הזן את תוכן השאלה...'}</Placeholder>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <LinkPlugin />
          <OnChangePlugin onChange={onChange} />
        </EditorContent>
      </LexicalComposer>
    </EditorContainer>
  );
} 