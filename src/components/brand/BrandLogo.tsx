import React from 'react';
import { Typography } from 'antd';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const { Text } = Typography;

const LogoContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 12px;
  transition: all 0.3s ease;
`;

const Separator = styled(motion.div)`
  height: 32px;
  border-right: 2px solid #e5e7eb;
`;

const Slogan = styled(motion.div)`
  font-size: 16px;
  color: #ff9800;
  font-weight: 500;
  letter-spacing: 0.5px;
  white-space: nowrap;
  margin-right: 8px;
`;

interface BrandLogoProps {
  collapsed?: boolean;
  onClick?: () => void;
  showSlogan?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  collapsed = false,
  onClick,
  showSlogan = true,
  size = 'medium'
}) => {
  const logoSizes = {
    small: '28px',
    medium: '36px',
    large: '42px'
  };

  return (
    <LogoContainer
      onClick={onClick}
      whileHover={{ 
        scale: 1.02,
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
      }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.img
        src="/EZpass_A6_cut.png"
        alt="איזיפס - פשוט להצליח"
        style={{
          height: collapsed ? '28px' : logoSizes[size],
          width: 'auto',
          objectFit: 'contain'
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      />
      {!collapsed && showSlogan && (
        <>
          <Separator
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Text style={{ 
              fontSize: '16px',
              color: '#ff9800',
              fontWeight: 500,
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
              marginRight: '8px'
            }}>
              פשוט להצליח
            </Text>
          </motion.div>
        </>
      )}
    </LogoContainer>
  );
};

export default BrandLogo; 