import styled from 'styled-components';

export const FirstPanel = styled.div`
  width: 300px;
  height: 100%;
  padding: 24px;
  border-left: 1px solid #e5e7eb;
  overflow-y: auto;
`;

export const MainContent = styled.div`
  flex: 1;
  height: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const ThirdPanel = styled.div`
  width: 300px;
  height: 100%;
  padding: 24px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
`;

export const PropertiesSection = styled.div`
  flex-shrink: 0;
`;

export const AssistanceSection = styled.div`
  flex: 1;
  
  h4.ant-typography {
    font-size: 15px;
    margin: 0;
    color: #374151;
    font-weight: 500;
  }
`; 