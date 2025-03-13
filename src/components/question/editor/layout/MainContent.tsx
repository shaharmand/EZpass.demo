import React from 'react';
import styled from 'styled-components';
import { Space } from 'antd';
import { Question, QuestionType } from '../../../../types/question';

const ContentSection = styled.div`
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

interface MainContentProps {
  question: Question;
  isEditing: boolean;
  onContentChange: (field: string, value: any) => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  question,
  isEditing,
  onContentChange
}) => {
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <ContentSection>
        {/* QuestionTitle will go here */}
      </ContentSection>

      <ContentSection>
        {/* QuestionText will go here */}
      </ContentSection>

      {question.metadata.type === QuestionType.MULTIPLE_CHOICE && (
        <ContentSection>
          {/* MultipleChoiceOptions will go here */}
        </ContentSection>
      )}

      <ContentSection>
        {/* QuestionSolution will go here */}
      </ContentSection>
    </Space>
  );
}; 