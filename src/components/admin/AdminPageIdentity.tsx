/**
 * AdminPageIdentity Component
 * 
 * Displays the current page's identity information within the admin header.
 * This component is part of the header and shows the page title, question ID,
 * and metadata like subject and domain.
 * 
 * Features:
 * - Displays page title and question ID
 * - Shows subject and domain metadata
 * - RTL support
 * - Responsive layout with overflow handling
 * - Integrates with AdminPageContext for dynamic content
 * 
 * Usage:
 * ```tsx
 * <AdminPageIdentity />
 * ```
 * 
 * Note: This component should be used within an AdminPageContext provider,
 * typically through the AdminLayout component.
 */

import React from 'react';
import { Typography, Button, Space } from 'antd';
import styled from 'styled-components';
import { useAdminPage } from '../../contexts/AdminPageContext';
import { HomeOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSearchResults } from '../../contexts/SearchResultsContext';
import { DatabaseQuestion } from '../../types/question';

const { Title, Text } = Typography;

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  direction: rtl;
  min-width: 0;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #ffffff;
`;

const MainSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PageTitle = styled(Title)`
  &.ant-typography {
    margin: 0;
    font-size: 20px;
    line-height: 28px;
    color: #262626;
  }
`;

const IdContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: #e6f4ff;
  border: 1px solid #91caff;
  border-radius: 4px;
  padding: 2px 8px;
  height: 28px;
`;

const IdLabel = styled(Text)`
  font-size: 12px;
  color: #0958d9;
  font-weight: 400;
`;

const QuestionId = styled(Text)`
  font-size: 14px;
  color: #0958d9;
  font-weight: 500;
`;

const NavigationSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const NavigationGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: white;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid #e6e6e6;
`;

const NavigationButton = styled(Button)`
  &.ant-btn {
    color: #1677ff;
    border: none;
    background: transparent;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    
    &:hover:not(:disabled) {
      color: #4096ff;
      background: #e6f4ff;
    }

    &:active:not(:disabled) {
      color: #0958d9;
      background: #bae0ff;
    }

    &:disabled {
      color: #d9d9d9;
      background: transparent;
    }
  }
`;

const BackToResults = styled(Button)`
  &.ant-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #e6e6e6;
    padding: 4px 16px;
    color: #262626;
    background: white;
    height: 36px;
    border-radius: 8px;
    transition: all 0.2s ease;
    
    &:hover {
      background: #e6f4ff;
      color: #1677ff;
      border-color: #1677ff;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }

    .anticon {
      font-size: 16px;
    }
  }
`;

const PositionText = styled(Text)`
  color: #262626;
  font-size: 14px;
  direction: ltr;
  display: inline-block;
  min-width: 80px;
  text-align: center;
  font-weight: 500;
`;

export const AdminPageIdentity: React.FC = () => {
  const { pageIdentity } = useAdminPage();
  const navigate = useNavigate();
  const { searchResults } = useSearchResults();

  if (!pageIdentity) return null;

  const [mainTitle, questionId] = pageIdentity.title.split(/(?=CIV-)/);
  const isQuestionEdit = !!questionId;

  // Get current position from search results
  const currentIndex = searchResults ? searchResults.findIndex((q: DatabaseQuestion) => q.id === questionId) : -1;
  const position = currentIndex !== -1 ? {
    current: currentIndex + 1,
    total: searchResults?.length || 0
  } : null;

  const handlePrevious = () => {
    if (position && position.current > 1 && searchResults) {
      navigate(`/admin/questions/${searchResults[currentIndex - 1].id}`);
    }
  };

  const handleNext = () => {
    if (position && position.current < position.total && searchResults) {
      navigate(`/admin/questions/${searchResults[currentIndex + 1].id}`);
    }
  };

  return (
    <Container>
      <MainSection>
        <TitleSection>
          <PageTitle level={4}>עריכת שאלה</PageTitle>
          {questionId && (
            <IdContainer>
              <IdLabel>מזהה</IdLabel>
              <QuestionId>{questionId}</QuestionId>
            </IdContainer>
          )}
        </TitleSection>
      </MainSection>

      {isQuestionEdit && position && (
        <NavigationSection>
          <NavigationGroup>
            <NavigationButton 
              icon={<RightOutlined />}
              onClick={handlePrevious}
              disabled={position.current <= 1}
            />
            <PositionText>
              {position.total} / {position.current}
            </PositionText>
            <NavigationButton 
              icon={<LeftOutlined />}
              onClick={handleNext}
              disabled={position.current >= position.total}
            />
          </NavigationGroup>
          <BackToResults
            icon={<HomeOutlined />}
            onClick={() => navigate('/admin/questions/search')}
          >
            חזרה לתוצאות
          </BackToResults>
        </NavigationSection>
      )}
    </Container>
  );
};

export default AdminPageIdentity; 