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
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const updateWidth = useCallback((width: number) => {
    editor.update(() => {
      node.setWidth(width);
    });
  }, [editor, node]);

  const updateAlignment = useCallback((alignment: 'left' | 'center' | 'right') => {
    editor.update(() => {
      node.setAlignment(alignment);
    });
  }, [editor, node]);

  const deleteImage = useCallback(() => {
    editor.update(() => {
      node.remove();
    });
  }, [editor, node]);

  const settingsContent = (
    <Space direction="vertical" style={{ width: 200 }}>
      <div>
        <div>Width</div>
        <Slider
          min={10}
          max={100}
          value={node.__width}
          onChange={updateWidth}
        />
      </div>
      <div>
        <div>Alignment</div>
        <Radio.Group value={node.__alignment} onChange={e => updateAlignment(e.target.value)}>
          <Radio.Button value="left">Left</Radio.Button>
          <Radio.Button value="center">Center</Radio.Button>
          <Radio.Button value="right">Right</Radio.Button>
        </Radio.Group>
      </div>
      <Button danger icon={<DeleteOutlined />} onClick={deleteImage}>
        Delete Image
      </Button>
    </Space>
  );

  const beforeUpload = useCallback(async (file: File) => {
    try {
      setLoading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `42yurj_1/${crypto.randomUUID()}.${fileExt}`;
      
      console.log('Attempting to upload to:', fileName);
      const { data, error } = await supabase.storage
        .from('question-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (error) {
        console.error('Upload error:', error);
        if (error.message.includes('policy')) {
          message.error('Policy violation: Make sure the file is being uploaded to the correct folder');
          console.log('Policy requires folder: 42yurj_1');
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          message.error('Permission denied for upload to INSERT folder');
        } else {
          message.error(`Upload failed: ${error.message}`);
        }
        return false;
      }

      if (data) {
        const { data: { publicUrl } } = supabase.storage
          .from('question-images')
          .getPublicUrl(fileName);

        editor.update(() => {
          node.setSrc(publicUrl);
        });
        
        message.success('Upload successful');
      }

    } catch (error) {
      console.error('Upload error:', error);
      message.error('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
    
    return false;
  }, [editor, node]);

  return (
    <ImageContainer $align={node.__alignment}>
      <ImageWrapper $width={node.__width}>
        <Upload
          showUploadList={false}
          beforeUpload={beforeUpload}
          accept="image/*"
        >
          {node.__src ? (
            <>
              <img 
                src={node.__src} 
                alt={node.__altText} 
                style={{ width: '100%' }}
              />
              <ImageToolbar className="image-toolbar">
                <Popover
                  content={settingsContent}
                  title="Image Settings"
                  trigger="click"
                  open={showSettings}
                  onOpenChange={setShowSettings}
                >
                  <Button 
                    icon={<SettingOutlined />}
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      setShowSettings(!showSettings);
                    }}
                  />
                </Popover>
              </ImageToolbar>
            </>
          ) : (
            <PlaceholderText>
              {loading ? 'Uploading...' : node.__altText}
            </PlaceholderText>
          )}
        </Upload>
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