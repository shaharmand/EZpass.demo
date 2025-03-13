import React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Button, Space, Tooltip } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
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

export function LexicalEditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isOrderedList, setIsOrderedList] = React.useState(false);
  const [isUnorderedList, setIsUnorderedList] = React.useState(false);

  React.useEffect(() => {
    editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          setIsBold(selection.hasFormat('bold'));
          setIsItalic(selection.hasFormat('italic'));

          const anchorNode = selection.anchor.getNode();
          const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElement();
          
          if (element) {
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
        <Space.Compact>
          <Tooltip title="מודגש">
            <ToolbarButton
              icon={<BoldOutlined />}
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
              }}
              className={isBold ? 'active' : ''}
            />
          </Tooltip>
          <Tooltip title="נטוי">
            <ToolbarButton
              icon={<ItalicOutlined />}
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
              }}
              className={isItalic ? 'active' : ''}
            />
          </Tooltip>
        </Space.Compact>

        <Space.Compact>
          <Tooltip title="רשימה ממוספרת">
            <ToolbarButton
              icon={<OrderedListOutlined />}
              onClick={() => {
                editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
              }}
              className={isOrderedList ? 'active' : ''}
            />
          </Tooltip>
          <Tooltip title="רשימת תבליטים">
            <ToolbarButton
              icon={<UnorderedListOutlined />}
              onClick={() => {
                editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
              }}
              className={isUnorderedList ? 'active' : ''}
            />
          </Tooltip>
        </Space.Compact>

        <Space.Compact>
          <Tooltip title="בטל">
            <ToolbarButton
              icon={<UndoOutlined />}
              onClick={() => {
                editor.dispatchCommand(UNDO_COMMAND, undefined);
              }}
            />
          </Tooltip>
          <Tooltip title="בצע שוב">
            <ToolbarButton
              icon={<RedoOutlined />}
              onClick={() => {
                editor.dispatchCommand(REDO_COMMAND, undefined);
              }}
            />
          </Tooltip>
        </Space.Compact>
      </Space>
    </ToolbarContainer>
  );
} 