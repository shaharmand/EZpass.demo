import React, { useState, useEffect } from 'react';
import { Button, Typography, Tooltip } from 'antd';
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
import { HistoryOutlined, BookOutlined, ReadOutlined, FormOutlined, EditOutlined } from '@ant-design/icons';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import { PrepStateManager } from '../../services/PrepStateManager';

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
  padding: 8px 12px;
  height: var(--user-header-height, 56px);
  border-bottom: 1px solid ${uiColors.border.light};
  direction: rtl;
  background: ${uiColors.background.header};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  
  @media (max-width: 1600px) {
    padding: 8px 8px;
  }

  @media (max-width: 1366px) {
    padding: 8px 4px;
  }
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
  padding: 0 12px;
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

// Navigation buttons container with better spacing
const NavigationButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 8px;
`;

// Shared base ActionButton styled component with smaller size
const ActionButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 15px;
  transition: all 0.2s ease;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
`;

// Primary blue button (for Practice) with gradient matching the brand
const PracticeButton = styled(ActionButton)`
  color: #3182f6; // EZpass blue color from the header
  
  &:hover {
    color: #ffffff;
    background: linear-gradient(135deg, #3182f6 0%, #2563eb 100%);
    border-color: #2563eb;
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
  }
  
  &:active {
    color: #ffffff;
    background: #1d4ed8;
    box-shadow: 0 1px 2px rgba(37, 99, 235, 0.1);
  }
`;

// Orange button (for Courses, matching the upgrade button)
const CoursesButton = styled(ActionButton)`
  color: #ff9800;
  
  &:hover {
    color: #ffffff;
    background: linear-gradient(135deg, #ff9800 0%, #ed6c02 100%);
    border-color: #ed6c02;
    box-shadow: 0 4px 6px -1px rgba(255, 152, 0, 0.2);
  }
  
  &:active {
    color: #ffffff;
    background: #f57c00;
    box-shadow: 0 1px 2px rgba(255, 152, 0, 0.1);
  }
`;

// Secondary blue button (for History)
const HistoryButton = styled(ActionButton)`
  color: #60a5fa; // Lighter blue that contrasts well with the primary blue
  
  &:hover {
    color: #ffffff;
    background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
    border-color: #3b82f6;
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
  }
  
  &:active {
    color: #ffffff;
    background: #2563eb;
    box-shadow: 0 1px 2px rgba(59, 130, 246, 0.1);
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
  
  // Get the student prep context to access the current active prep
  const { prep } = useStudentPrep();
  
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
      <Tooltip title="שדרג והגדל את הגישה שלך למשובים מפורטים">
        <UpgradeButton 
          type="text"
          onClick={() => setShowJoinDialog(true)}
        >
          שדרג
        </UpgradeButton>
      </Tooltip>
    );
  };

  // Handle practice button click - navigate to user's active prep or practice page
  const handlePracticeClick = () => {
    // If we're already on the home page, don't navigate anywhere
    if (window.location.pathname === '/' || window.location.pathname === '/practice') {
      console.log('Already on home/exams page, not navigating');
      return;
    }

    // If the user has an active prep, go to that prep's practice page
    if (prep && prep.id) {
      // Ensure prep.id is not a Promise
      const prepId = prep.id;
      if (typeof prepId !== 'string' || String(prepId).includes('[object')) {
        console.error('Invalid prep ID in active prep, navigating to main practice page:', prepId);
        navigate('/practice');
        return;
      }
      navigate(`/practice/${prepId}`);
    } else {
      // If there's no active prep, try to load preps from storage
      try {
        const storedPrepsJson = localStorage.getItem('active_preps');
        if (storedPrepsJson) {
          const storedPreps = JSON.parse(storedPrepsJson);
          if (storedPreps && Object.keys(storedPreps).length > 0) {
            // Sort preps by last updated and take the most recent one
            const sortedPrepIds = Object.keys(storedPreps).sort((a, b) => {
              const prepA = storedPreps[a];
              const prepB = storedPreps[b];
              // Sort by last updated timestamp if available
              const timestampA = prepA.state?.lastTick || 0;
              const timestampB = prepB.state?.lastTick || 0;
              return timestampB - timestampA;
            });
            
            // Validate the prep ID before navigating
            const prepId = sortedPrepIds[0];
            if (typeof prepId !== 'string' || String(prepId).includes('[object')) {
              console.error('Invalid prep ID in stored preps, navigating to main practice page:', prepId);
              navigate('/practice');
              return;
            }
            
            // Navigate to the most recently used prep
            navigate(`/practice/${prepId}`);
            return;
          }
        }
        
        // If no preps found in storage, go to practice page to choose an exam
        console.log('No active preps found, navigating to exam selection');
        navigate('/practice');
      } catch (error) {
        console.error('Error accessing stored preps:', error);
        navigate('/practice');
      }
    }
  };

  // Handle courses button click - navigate to safety courses
  const handleCoursesClick = () => {
    navigate('/courses/safety');
  };

  // Handle history button click - navigate to submission history
  const handleHistoryClick = () => {
    // We don't need to wait for prep ID here since the history page
    // will handle its own state and filtering
    navigate('/user/submissions');
  };

  return (
    <>
      <TopRow style={style}>
        <BrandLogo
          onClick={() => navigate('/')}
          size="small"
          showSlogan={false}
        />
        <PageIdentityContainer>
          <PageType>{pageType}</PageType>
          <PageContent>{pageContent}</PageContent>
        </PageIdentityContainer>
        <Spacer />
        <UserInfoSection>
          {profile && (
            <NavigationButtonsContainer>
              <Tooltip title="תרגול שאלות" placement="bottom">
                <PracticeButton 
                  type="text"
                  icon={<FormOutlined />} 
                  onClick={handlePracticeClick}
                />
              </Tooltip>
              
              <Tooltip title="קורסים" placement="bottom">
                <CoursesButton 
                  type="text"
                  icon={<ReadOutlined />} 
                  onClick={handleCoursesClick}
                />
              </Tooltip>
              
              <Tooltip title="היסטוריית תשובות" placement="bottom">
                <HistoryButton 
                  type="text"
                  icon={<HistoryOutlined />} 
                  onClick={handleHistoryClick}
                />
              </Tooltip>
            </NavigationButtonsContainer>
          )}
          
          {/* Daily limit indicator for practice variant */}
          {variant === 'practice' && practiceAttempts && (
            <DailyLimitContainer onClick={() => setShowJoinDialog(true)} style={{ cursor: 'pointer' }}>
              <DailyLimitIndicator 
                current={getCurrentAttempts()} 
                max={getMaxAttempts()}
              />
            </DailyLimitContainer>
          )}
          
          {/* Subscription tier tag */}
          {profile && profile.subscription_tier && (
            <UserMetaContainer>
              <Tooltip title={`מנוי ${getSubscriptionLabel(profile.subscription_tier as SubscriptionTier)} פעיל`}>
                <StyledTag 
                  $type="subscription"
                  color={getSubscriptionColor(profile.subscription_tier as SubscriptionTier)}
                >
                  {getSubscriptionLabel(profile.subscription_tier as SubscriptionTier)}
                </StyledTag>
              </Tooltip>
              {getUpgradeButton(profile.subscription_tier as SubscriptionTier)}
            </UserMetaContainer>
          )}
          
          <UserProfile />
        </UserInfoSection>
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