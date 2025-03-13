import React from 'react';
import { Typography } from 'antd';
import styled from 'styled-components';
import { useAdminPage } from '../../contexts/AdminPageContext';

const { Title, Text } = Typography;

const Container = styled.div`
  display: flex;
  align-items: center;
  direction: rtl;
  min-width: 0;
  height: 40px;
`;

const MainContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  flex: 1;
  min-width: 0;
`;

const PageTitle = styled(Title)`
  margin: 0 !important;
  font-size: 20px !important;
  line-height: 1 !important;
  color: #262626 !important;
  font-weight: 600 !important;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  &.ant-typography {
    margin: 0;
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
  height: 24px;
  flex-shrink: 0;
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
  white-space: nowrap;
`;

const MetadataSidebar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
  padding: 0 16px;
  border-right: 1px solid #f0f0f0;
`;

const MetadataGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
`;

const MetadataItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MetadataLabel = styled(Text)`
  color: #8c8c8c;
  font-size: 13px;
  font-weight: 400;
`;

const DomainItem = styled(Text)`
  color: #262626;
  font-weight: 500;
  padding: 2px 8px;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  white-space: nowrap;
  height: 24px;
  line-height: 18px;
`;

const SubjectText = styled(DomainItem)`
  color: #595959;
  font-weight: 400;
  background: #fafafa;
  border-color: #f0f0f0;
`;

const TypeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:before {
    content: '|';
    color: #d9d9d9;
    margin: 0 8px;
    font-weight: normal;
  }
`;

const TypeLabel = styled(Text)`
  color: #595959;
  font-size: 13px;
  font-weight: 400;
  white-space: nowrap;
`;

const TypeItem = styled(DomainItem)``;

export const AdminPageHeader: React.FC = () => {
  const { pageIdentity } = useAdminPage();

  if (!pageIdentity) return null;

  // Split the title into main text and ID
  const [mainTitle, questionId] = pageIdentity.title.split(/(?=CIV-)/);

  // Split subtitle into parts
  const subtitleParts = pageIdentity.subtitle?.split(' › ') || [];
  const [subject, domain, type] = subtitleParts;

  return (
    <Container>
      <MainContent>
        <PageTitle level={4}>{mainTitle}</PageTitle>
        {questionId && (
          <IdContainer>
            <IdLabel>מזהה</IdLabel>
            <QuestionId>{questionId}</QuestionId>
          </IdContainer>
        )}
      </MainContent>
      <MetadataSidebar>
        <MetadataGroup>
          {subject && <SubjectText>{subject}</SubjectText>}
          {domain && <DomainItem>{domain}</DomainItem>}
        </MetadataGroup>
      </MetadataSidebar>
    </Container>
  );
}; 