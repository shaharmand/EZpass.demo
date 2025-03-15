import React from 'react';
import styled from 'styled-components';

const LayoutContainer = styled.div`
  display: flex;
  width: 100%;
  height: calc(100vh - 128px);
  background: #ffffff;
  direction: rtl;
  margin-top: 128px;
`;

const MainContent = styled.div<{ $isAdmin?: boolean }>`
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f1f5f9 0%, #f8fafc 100%);
  align-items: center;
  justify-content: center;
  padding: ${props => props.$isAdmin ? '48px' : '32px'};
  direction: ltr;
  overflow-y: auto;

  > div {
    width: 100%;
    max-width: 1200px;
    aspect-ratio: 16 / 9;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
  }
`;

const NavigationWrapper = styled.div<{ $isOpen: boolean }>`
  width: 400px;
  height: 100%;
  position: relative;
  flex-shrink: 0;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  direction: rtl;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  
  .nav-content {
    flex: 1;
    padding: 24px 0;
    
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #d1d5db;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-track {
      background-color: #f3f4f6;
    }
  }
  
  @media (max-width: 1200px) {
    width: 360px;
  }

  @media (max-width: 768px) {
    position: fixed;
    right: 0;
    top: 128px;
    height: calc(100vh - 128px);
    width: 100%;
    max-width: 400px;
    z-index: 1000;
    transform: translateX(${props => props.$isOpen ? '0' : '100%'});
    transition: transform 0.3s ease;
    box-shadow: ${props => props.$isOpen ? '4px 0 16px rgba(0, 0, 0, 0.1)' : 'none'};
  }
`;

interface CourseLayoutProps {
  navigation: React.ReactNode;
  children: React.ReactNode;
  isAdmin?: boolean;
}

const CourseLayout: React.FC<CourseLayoutProps> = ({
  navigation,
  children,
  isAdmin = false
}) => {
  const [isNavigationOpen, setIsNavigationOpen] = React.useState(false);

  return (
    <LayoutContainer>
      <NavigationWrapper $isOpen={isNavigationOpen}>
        <div className="nav-content">
          {navigation}
        </div>
      </NavigationWrapper>
      <MainContent $isAdmin={isAdmin}>
        {children}
      </MainContent>
    </LayoutContainer>
  );
};

export default CourseLayout; 