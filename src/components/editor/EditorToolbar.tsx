import React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Button, Space, Tooltip } from 'antd';
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
  position: relative;
`;

const ToolbarButton = styled(Button)`
  &.active {
    color: #1890ff;
    background: #e6f7ff;
    border-color: #1890ff;
  }

  .anticon {
    font-size: 14px !important;
    line-height: 1 !important;
    display: block !important;
    width: auto !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    outline: none !important;
    background: none !important;
  }

  .ant-btn-icon {
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Explicitly hide any unwanted content */
  &::before,
  &::after {
    display: none !important;
  }

  /* Ensure only the icon is visible */
  span:not(.anticon) {
    display: none !important;
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
        <Tooltip title="הדגשה" mouseEnterDelay={0.5}>
          <ToolbarButton
            icon={<BoldOutlined />}
            className={isBold ? 'active' : ''}
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
            }}
          />
        </Tooltip>
        <Tooltip title="כתב נטוי" mouseEnterDelay={0.5}>
          <ToolbarButton
            icon={<ItalicOutlined />}
            className={isItalic ? 'active' : ''}
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
            }}
          />
        </Tooltip>
        <Tooltip title="קו תחתון" mouseEnterDelay={0.5}>
          <ToolbarButton
            icon={<UnderlineOutlined />}
            className={isUnderline ? 'active' : ''}
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
            }}
          />
        </Tooltip>
        <Tooltip title="רשימה ממוספרת" mouseEnterDelay={0.5}>
          <ToolbarButton
            icon={<OrderedListOutlined />}
            className={isOrderedList ? 'active' : ''}
            onClick={() => {
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
            }}
          />
        </Tooltip>
        <Tooltip title="רשימת נקודות" mouseEnterDelay={0.5}>
          <ToolbarButton
            icon={<UnorderedListOutlined />}
            className={isUnorderedList ? 'active' : ''}
            onClick={() => {
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
            }}
          />
        </Tooltip>
        <Tooltip title="בטל" mouseEnterDelay={0.5}>
          <ToolbarButton
            icon={<UndoOutlined />}
            onClick={() => {
              editor.dispatchCommand(UNDO_COMMAND, undefined);
            }}
          />
        </Tooltip>
        <Tooltip title="בצע שוב" mouseEnterDelay={0.5}>
          <ToolbarButton
            icon={<RedoOutlined />}
            onClick={() => {
              editor.dispatchCommand(REDO_COMMAND, undefined);
            }}
          />
        </Tooltip>
      </Space>
    </ToolbarContainer>
  );
} 