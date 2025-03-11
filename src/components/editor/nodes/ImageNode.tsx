import { DecoratorNode, SerializedLexicalNode } from 'lexical';
import React, { useCallback, useState } from 'react';
import { Upload, message, Button, Slider, Radio, Space, Popover } from 'antd';
import { supabase } from '../../../utils/supabaseClient';
import styled from 'styled-components';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { SettingOutlined, DeleteOutlined } from '@ant-design/icons';

export type SerializedImageNode = SerializedLexicalNode & {
  type: 'image';
  src: string;
  altText: string;
  width: number;
  alignment: 'left' | 'center' | 'right';
  version: 1;
};

const ImageContainer = styled.div<{ $align: string }>`
  display: block;
  position: relative;
  cursor: pointer;
  text-align: ${props => props.$align};
  
  &:hover .image-toolbar {
    opacity: 1;
  }
`;

const ImageWrapper = styled.div<{ $width: number }>`
  display: inline-block;
  position: relative;
  width: ${props => props.$width}%;
`;

const ImageToolbar = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
  background: white;
  border-radius: 4px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 10;
`;

const EditableContent = styled.div<{ $isEditing: boolean }>`
  background: ${props => props.$isEditing ? '#FFFBE6' : 'transparent'};
  transition: background-color 0.3s ease;
  position: relative;
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  border: ${props => props.$isEditing ? '1px solid #ffe58f' : 'none'};
`;

const PlaceholderText = styled.div`
  border: 2px dashed #d9d9d9;
  border-radius: 4px;
  padding: 16px;
  text-align: center;
  background: #fafafa;
  color: #999;
  cursor: pointer;
  
  &:hover {
    border-color: #40a9ff;
    color: #40a9ff;
  }
`;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: number;
  __alignment: 'left' | 'center' | 'right';

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__alignment,
      node.__key
    );
  }

  constructor(
    src: string,
    altText: string,
    width: number = 100,
    alignment: 'left' | 'center' | 'right' = 'center',
    key?: string
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__alignment = alignment;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'image-node';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  setSrc(src: string): void {
    const self = this.getWritable();
    self.__src = src;
  }

  setAltText(altText: string): void {
    const self = this.getWritable();
    self.__altText = altText;
  }

  setWidth(width: number): void {
    const self = this.getWritable();
    self.__width = width;
  }

  setAlignment(alignment: 'left' | 'center' | 'right'): void {
    const self = this.getWritable();
    self.__alignment = alignment;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const node = $createImageNode(
      serializedNode.src,
      serializedNode.altText,
      serializedNode.width,
      serializedNode.alignment
    );
    return node;
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      alignment: this.__alignment,
      version: 1,
    };
  }

  decorate(): JSX.Element {
    return <ImageComponent node={this} />;
  }
}

function ImageComponent({ node }: { node: ImageNode }) {
  const [editor] = useLexicalComposerContext();
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const src = node.__src;
  const altText = node.__altText;
  const width = node.__width;
  const alignment = node.__alignment;

  const onDelete = useCallback(() => {
    node.remove();
  }, [node]);

  return (
    <ImageContainer $align={alignment}>
      <ImageWrapper $width={width}>
        <img 
          src={src} 
          alt={altText} 
          style={{ width: '100%', height: 'auto', display: 'block' }} 
        />
        <ImageToolbar className="image-toolbar">
          <Space>
            <Popover
              content={
                <div style={{ padding: '12px', minWidth: '200px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ marginBottom: '8px' }}>רוחב התמונה</div>
                    <Slider
                      min={10}
                      max={100}
                      value={width}
                      onChange={(value) => {
                        editor.update(() => {
                          node.setWidth(value);
                        });
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ marginBottom: '8px' }}>יישור</div>
                    <Radio.Group
                      value={alignment}
                      onChange={(e) => {
                        editor.update(() => {
                          node.setAlignment(e.target.value);
                        });
                      }}
                    >
                      <Radio.Button value="left">שמאל</Radio.Button>
                      <Radio.Button value="center">מרכז</Radio.Button>
                      <Radio.Button value="right">ימין</Radio.Button>
                    </Radio.Group>
                  </div>
                </div>
              }
              trigger="click"
              open={showSettings}
              onOpenChange={setShowSettings}
              placement="bottom"
            >
              <Button 
                type="text" 
                icon={<SettingOutlined />} 
                size="small"
              />
            </Popover>
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              size="small"
              onClick={onDelete}
            />
          </Space>
        </ImageToolbar>
      </ImageWrapper>
    </ImageContainer>
  );
}

export function $createImageNode(
  src: string,
  altText: string,
  width: number = 100,
  alignment: 'left' | 'center' | 'right' = 'center'
): ImageNode {
  return new ImageNode(src, altText, width, alignment);
}

export function $isImageNode(node: any): boolean {
  return node instanceof ImageNode;
} 