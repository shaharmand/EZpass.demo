import React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Button, Space, Tooltip, Select } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  UndoOutlined,
  RedoOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
} from '@ant-design/icons';
import { FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND, ElementFormatType } from 'lexical';
import { ListNode } from '@lexical/list';
import { $isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { $getSelection, $isRangeSelection, $createParagraphNode, $isRootNode } from 'lexical';
import { $createHeadingNode, $isHeadingNode, HeadingTagType } from '@lexical/rich-text';
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

const { Option } = Select;

export function EditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isUnderline, setIsUnderline] = React.useState(false);
  const [isOrderedList, setIsOrderedList] = React.useState(false);
  const [isUnorderedList, setIsUnorderedList] = React.useState(false);
  const [currentHeading, setCurrentHeading] = React.useState<HeadingTagType | 'paragraph'>('paragraph');
  const [alignment, setAlignment] = React.useState<ElementFormatType>('right');

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

            // Check heading
            if ($isHeadingNode(element)) {
              setCurrentHeading(element.getTag());
            } else {
              setCurrentHeading('paragraph');
            }

            // Check alignment
            const format = element.getFormat();
            if (format === 1) setAlignment('left');
            else if (format === 2) setAlignment('center');
            else setAlignment('right');
          }
        }
      });
    });
  }, [editor]);

  const formatHeading = (tag: HeadingTagType | 'paragraph') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          const parent = node.getParent();
          if (parent && !$isRootNode(parent)) {
            if (tag === 'paragraph') {
              const paragraph = $createParagraphNode();
              parent.replace(paragraph);
            } else {
              const heading = $createHeadingNode(tag);
              parent.replace(heading);
            }
          }
        });
      }
    });
  };

  const formatAlignment = (align: ElementFormatType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          const parent = node.getParent();
          if (parent) {
            parent.setFormat(align);
          }
        });
      }
    });
  };

  return (
    <ToolbarContainer>
      <Space>
        {/* Heading selector */}
        <Select 
          value={currentHeading} 
          style={{ width: 120 }}
          onChange={formatHeading}
        >
          <Option value="paragraph">פסקה רגילה</Option>
          <Option value="h1">כותרת 1</Option>
          <Option value="h2">כותרת 2</Option>
          <Option value="h3">כותרת 3</Option>
        </Select>

        <Space.Compact>
          {/* Text alignment */}
          <Tooltip title="יישור לשמאל">
            <ToolbarButton
              icon={<AlignLeftOutlined />}
              onClick={() => formatAlignment('left')}
              className={alignment === 'left' ? 'active' : ''}
            />
          </Tooltip>
          <Tooltip title="מרכוז">
            <ToolbarButton
              icon={<AlignCenterOutlined />}
              onClick={() => formatAlignment('center')}
              className={alignment === 'center' ? 'active' : ''}
            />
          </Tooltip>
          <Tooltip title="יישור לימין">
            <ToolbarButton
              icon={<AlignRightOutlined />}
              onClick={() => formatAlignment('right')}
              className={alignment === 'right' ? 'active' : ''}
            />
          </Tooltip>
        </Space.Compact>

        {/* Existing formatting buttons */}
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
          <Tooltip title="קו תחתון">
            <ToolbarButton
              icon={<UnderlineOutlined />}
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
              }}
              className={isUnderline ? 'active' : ''}
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