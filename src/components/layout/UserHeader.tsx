import React, { useState } from 'react';
import { Button, Typography } from 'antd';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../utils/feedbackStyles';
import { SubscriptionTier } from '../../types/userTypes';
import UserProfile from '../user/UserProfile';
import { BrandLogo } from '../brand/BrandLogo';
import { DailyLimitIndicator } from '../feedback/DailyLimitIndicator';
import { usePracticeAttempts } from '../../contexts/PracticeAttemptsContext';
import { useAuth } from '../../contexts/AuthContext';
import { getSubscriptionColor, getSubscriptionLabel } from '../../utils/subscriptionUtils';
import { StyledTag } from '../styled/StyledTag';
import { JoinEZpassPlusDialog } from '../dialogs/JoinEZpassPlusDialog';

const { Text } = Typography;

// Define UI colors since feedbackStyles doesn't have these
const uiColors = {
  background: {
    header: '#ffffff',
    metrics: '#f8fafc'
  },
  border: {
    light: '#e5e7eb',
    separator: '#f0f0f0'
  },
  text: {
    primary: '#1e293b',
    secondary: '#64748b'
  }
};

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 8px 24px;
  height: var(--user-header-height, 56px);
  border-bottom: 1px solid ${uiColors.border.light};
  direction: rtl;
  background: ${uiColors.background.header};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
`;

const PageIdentityContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  border-right: 1px solid ${uiColors.border.separator};
  height: 40px;
`;

const PageType = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${uiColors.text.secondary};
`;

const PageContent = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: ${uiColors.text.primary};
`;

const Spacer = styled.div`
  flex: 1;
`;

const UserInfoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserMetaContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  border-right: 1px solid ${uiColors.border.separator};
  height: 40px;
`;

const DailyLimitContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-right: 1px solid ${uiColors.border.separator};
  height: 40px;
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UpgradeButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 16px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
  background: linear-gradient(135deg, #ff9800 0%, #ed6c02 100%);
  color: white;
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(237, 108, 2, 0.2);

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%) !important;
    color: white !important;
    border: none !important;
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(237, 108, 2, 0.3);
  }
`;

export interface UserHeaderProps {
  children?: React.ReactNode;
  pageType: string;
  pageContent: string;
  variant?: 'default' | 'practice' | 'course';
  style?: React.CSSProperties;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  pageType,
  pageContent,
  variant = 'default',
  style,
  children
}) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  
  // Only use practice attempts if we're in practice variant
  const practiceAttempts = variant === 'practice' ? usePracticeAttempts() : null;
  const getCurrentAttempts = React.useCallback(() => {
    return practiceAttempts?.getCurrentAttempts() ?? 0;
  }, [practiceAttempts]);
  
  const getMaxAttempts = React.useCallback(() => {
    return practiceAttempts?.getMaxAttempts() ?? 0;
  }, [practiceAttempts]);

  const getUpgradeButton = (currentTier: SubscriptionTier) => {
    if (currentTier === SubscriptionTier.PRO) return null;
    
    return (
      <UpgradeButton 
        type="text"
        onClick={() => setShowJoinDialog(true)}
      >
        שדרג
      </UpgradeButton>
    );
  };

  return (
    <>
      <TopRow style={style}>
        <BrandLogo />
        <PageIdentityContainer>
          <PageContent>{pageContent}</PageContent>
          <PageType>{pageType}</PageType>
        </PageIdentityContainer>
        <Spacer />
        {profile && (
          <UserInfoSection>
            <UserProfile />
            <UserMetaContainer>
              <StyledTag 
                $type="subscription" 
                color={getSubscriptionColor(profile.subscription_tier)}
              >
                {getSubscriptionLabel(profile.subscription_tier)}
              </StyledTag>
            </UserMetaContainer>
            {variant === 'practice' && (
              <DailyLimitContainer>
                <DailyLimitIndicator
                  current={getCurrentAttempts()}
                  max={getMaxAttempts()}
                />
              </DailyLimitContainer>
            )}
            <ActionsContainer>
              {getUpgradeButton(profile.subscription_tier)}
            </ActionsContainer>
          </UserInfoSection>
        )}
        {children}
      </TopRow>
      
      {/* Join EZpass+ Dialog */}
      <JoinEZpassPlusDialog 
        open={showJoinDialog} 
        onClose={() => setShowJoinDialog(false)} 
      />
    </>
  );
}; 