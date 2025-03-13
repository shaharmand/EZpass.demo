import React from 'react';
import { Form, Input } from 'antd';
import { DatabaseQuestion } from '../../../types/question';
import styled from 'styled-components';
import LexicalEditor from '../../../components/editor/LexicalEditor';
import MarkdownRenderer from '../../../components/MarkdownRenderer';

const EditorContainer = styled.div`
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const TitleInput = styled(Input)`
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:not(:disabled) {
    &:hover, &:focus {
      border-color: #40a9ff;
    }
  }

  &:disabled {
    background: #fafafa;
    cursor: pointer;
    
    &:hover {
      border-color: #40a9ff;
    }
  }
`;

interface BasicQuestionEditorProps {
  question: DatabaseQuestion;
  isEditing: boolean;
  onContentChange: (field: string, value: any) => void;
}

export const BasicQuestionEditor: React.FC<BasicQuestionEditorProps> = ({
  question,
  isEditing,
  onContentChange,
}) => {
  const handleTitleClick = () => {
    if (!isEditing) {
      onContentChange('isEditing', true);
    }
  };

  const handleContentClick = () => {
    if (!isEditing) {
      onContentChange('isEditing', true);
    }
  };

  return (
    <EditorContainer>
      <Form layout="vertical">
        <Form.Item 
          label="כותרת השאלה"
          required
        >
          <TitleInput
            value={question.data.name}
            onChange={(e) => onContentChange('name', e.target.value)}
            placeholder="הזן כותרת לשאלה"
            disabled={!isEditing}
            onClick={handleTitleClick}
          />
        </Form.Item>

        <Form.Item 
          label="תוכן השאלה"
          required
        >
          <div onClick={handleContentClick}>
            {isEditing ? (
              <LexicalEditor
                initialValue={question.data.content.text}
                onChange={(value) => onContentChange('content.text', value)}
                editable={true}
              />
            ) : (
              <div className="markdown-content" style={{ 
                padding: '16px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}>
                <MarkdownRenderer content={question.data.content.text || ''} />
              </div>
            )}
          </div>
        </Form.Item>
      </Form>
    </EditorContainer>
  );
}; 