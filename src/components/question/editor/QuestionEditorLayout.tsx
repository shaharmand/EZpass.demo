import React from 'react';
import styled from 'styled-components';
import { DatabaseQuestion, SaveQuestion } from '../../../types/question';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: row-reverse;
  gap: 24px;
  height: 100%;
  padding: 24px;
`;

const SidePanel = styled.div`
  width: 280px;
  position: sticky;
  top: 0;
  max-height: calc(100vh - 112px);
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 24px;
`;

const MainPanel = styled.div`
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 24px;
`;

interface QuestionEditorLayoutProps {
  question: DatabaseQuestion;
  isEditing: boolean;
  isModified: boolean;
  onSave: (data: SaveQuestion) => Promise<void>;
  onCancel: () => void;
  onBack: () => void;
  children: React.ReactNode;
  sidebarContent: React.ReactNode;
}

export const QuestionEditorLayout: React.FC<QuestionEditorLayoutProps> = ({
  question,
  isEditing,
  isModified,
  onSave,
  onCancel,
  onBack,
  children,
  sidebarContent,
}) => {
  return (
    <EditorContainer>
      <ContentContainer>
        <MainPanel>
          {children}
        </MainPanel>
        <SidePanel>
          {sidebarContent}
        </SidePanel>
      </ContentContainer>
    </EditorContainer>
  );
}; 