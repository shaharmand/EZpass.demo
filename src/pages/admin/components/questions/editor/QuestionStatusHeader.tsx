import React from 'react';
import styled from 'styled-components';
import { Button } from 'antd';

const NavigationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  height: 48px;
`;

const NavigationButton = styled(Button)`
  height: 32px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  
  &.home-button {
    color: #595959;
    border: none;
    background: transparent;
    
    &:hover {
      color: #262626;
      background: #f5f5f5;
    }
  }
  
  .anticon {
    font-size: 14px;
  }
`;

const NavigationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  .nav-group {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px;
    background: #f5f5f5;
    border-radius: 6px;
  }
  
  .counter {
    font-size: 13px;
    color: #595959;
    min-width: 60px;
    text-align: center;
  }
`;

interface StatusBarProps {
  $hasValidationIssues: boolean;
  $isDraft: boolean;
}

const StatusBar = styled.div<StatusBarProps>`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: ${(props: StatusBarProps) => {
    if (props.$hasValidationIssues) return '#fff2e8';
    if (props.$isDraft) return '#fffbe6';
    return '#f6ffed';
  }};
  border-bottom: 1px solid ${(props: StatusBarProps) => {
    if (props.$hasValidationIssues) return '#ffbb96';
    if (props.$isDraft) return '#ffe58f';
    return '#b7eb8f';
  }};
  min-height: 40px;
  transition: all 0.3s ease;
`; 