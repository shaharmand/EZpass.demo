import React from 'react';
import { Space, Button, Tag, Typography, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, HomeOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { Question, PublicationStatusEnum } from '../../../types/question';

const { Text } = Typography;

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  border-bottom: 1px solid #e6e6e6;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  margin-bottom: 24px;
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #fafafa;
  height: 64px;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const MainTitle = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: #262626;
  display: flex;
  align-items: center;
  gap: 12px;

  .question-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: normal;
    font-size: 14px;

    .question-id {
      background: #e6f4ff;
      border: 1px solid #91caff;
      color: #1677ff;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 500;
    }
  }
`;

const NavigationGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid #e6e6e6;
  padding: 4px;
  border-radius: 8px;
  height: 40px;
`;

const NavigationButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  border-left: 1px solid #f0f0f0;
  padding-left: 8px;
  margin-left: 8px;
`;

const PageCounter = styled(Text)`
  min-width: 60px;
  text-align: center;
  font-size: 14px;
  color: #595959;
  padding: 0 8px;
  font-weight: 500;
`;

const CompactTag = styled(Tag)`
  &&& {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    height: 24px;
    .anticon {
      margin-right: 0;
    }
  }
`;

interface QuestionHeaderSectionProps {
  question: Question & { publication_status: PublicationStatusEnum };
  onBack: () => void;
  onSave: () => void;
  isModified?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentPosition?: {
    current: number;
    total: number;
  };
  onQuestionChange?: (updatedQuestion: Question & { publication_status: PublicationStatusEnum }) => void;
}

export const QuestionHeaderSection: React.FC<QuestionHeaderSectionProps> = ({
  question,
  onBack,
  onSave,
  isModified = false,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  currentPosition,
  onQuestionChange,
}) => {
  const isDraft = question.publication_status === PublicationStatusEnum.DRAFT;

  return (
    <HeaderContainer>
      <HeaderTop>
        <LeftSection>
          <MainTitle>
            ממשק מנהל - עריכת שאלה
            <div className="question-meta">
              <span className="question-id">{question.id}</span>
              <CompactTag color={isDraft ? 'default' : 'success'}>
                {isDraft ? 'טיוטה' : 'מפורסם'}
              </CompactTag>
            </div>
          </MainTitle>
          <NavigationGroup>
            <Button 
              type="text"
              icon={<HomeOutlined />} 
              onClick={onBack}
            >
              חזרה לספרייה
            </Button>
            <NavigationButtons>
              <Button
                type="text"
                icon={<RightOutlined />}
                disabled={!hasPrevious}
                onClick={onPrevious}
              />
              {currentPosition && (
                <PageCounter>
                  {currentPosition.current} / {currentPosition.total}
                </PageCounter>
              )}
              <Button
                type="text"
                icon={<LeftOutlined />}
                disabled={!hasNext}
                onClick={onNext}
              />
            </NavigationButtons>
          </NavigationGroup>
        </LeftSection>
        
        <RightSection>
          <Space>
            <Button 
              type="primary"
              onClick={onSave}
              disabled={!isModified}
            >
              שמור שינויים
            </Button>

            <Button 
              type={isDraft ? 'primary' : 'default'}
              onClick={() => onQuestionChange?.({
                ...question,
                publication_status: isDraft ? PublicationStatusEnum.PUBLISHED : PublicationStatusEnum.DRAFT
              })}
              style={{ marginRight: 8 }}
            >
              {isDraft ? 'פרסם שאלה' : 'העבר לטיוטה'}
            </Button>
          </Space>
        </RightSection>
      </HeaderTop>
    </HeaderContainer>
  );
}; 