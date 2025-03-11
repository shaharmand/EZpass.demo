import React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Button, Space } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  UndoOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND } from 'lexical';
import { ListNode } from '@lexical/list';
import { $isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { $getSelection, $isRangeSelection } from 'lexical';
import styled from 'styled-components';

const ToolbarContainer = styled.div`
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
`;

const ToolbarButton = styled(Button)`
  &.active {
    color: #1890ff;
    background: #e6f7ff;
    border-color: #1890ff;
  }
`;

export function EditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isUnderline, setIsUnderline] = React.useState(false);
  const [isOrderedList, setIsOrderedList] = React.useState(false);
  const [isUnorderedList, setIsUnorderedList] = React.useState(false);

  React.useEffect(() => {
    editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          setIsBold(selection.hasFormat('bold'));
          setIsItalic(selection.hasFormat('italic'));
          setIsUnderline(selection.hasFormat('underline'));

          const anchorNode = selection.anchor.getNode();
          const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElement();
          
          if (element !== null) {
            const elementList = $isListNode(element);
            const parentElement = element.getParent();
            const parentList = parentElement !== null && $isListNode(parentElement);

            if (elementList && element instanceof ListNode) {
              setIsOrderedList(element.getListType() === 'number');
              setIsUnorderedList(element.getListType() === 'bullet');
            } else if (parentList && parentElement instanceof ListNode) {
              setIsOrderedList(parentElement.getListType() === 'number');
              setIsUnorderedList(parentElement.getListType() === 'bullet');
            } else {
              setIsOrderedList(false);
              setIsUnorderedList(false);
            }
          }
        }
      });
    });
  }, [editor]);

  return (
    <ToolbarContainer>
      <Space>
        <ToolbarButton
          icon={<BoldOutlined />}
          className={isBold ? 'active' : ''}
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
          }}
        />
        <ToolbarButton
          icon={<ItalicOutlined />}
          className={isItalic ? 'active' : ''}
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
          }}
        />
        <ToolbarButton
          icon={<UnderlineOutlined />}
          className={isUnderline ? 'active' : ''}
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
          }}
        />
        <ToolbarButton
          icon={<OrderedListOutlined />}
          className={isOrderedList ? 'active' : ''}
          onClick={() => {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          }}
        />
        <ToolbarButton
          icon={<UnorderedListOutlined />}
          className={isUnorderedList ? 'active' : ''}
          onClick={() => {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          }}
        />
        <ToolbarButton
          icon={<UndoOutlined />}
          onClick={() => {
            editor.dispatchCommand(UNDO_COMMAND, undefined);
          }}
        />
        <ToolbarButton
          icon={<RedoOutlined />}
          onClick={() => {
            editor.dispatchCommand(REDO_COMMAND, undefined);
          }}
        />
      </Space>
    </ToolbarContainer>
  );
} 