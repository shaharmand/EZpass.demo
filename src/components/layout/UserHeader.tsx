import React from 'react';
import { Typography } from 'antd';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../brand/BrandLogo';
import { UserProfile } from '../user/UserProfile';

const { Text } = Typography;

// Consistent color scheme
const colors = {
  background: {
    header: '#ffffff',
    metrics: '#f8fafc',
    highlight: '#f0f7ff'
  },
  border: {
    light: '#e5e7eb',
    separator: '#f0f0f0'
  },
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    brand: '#3b82f6'
  },
  icon: {
    left: '#ff9800',
    right: '#3b82f6'
  }
};

interface UserHeaderProps {
  children?: React.ReactNode;
  showMetricsRow?: boolean;
  metricsContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  pageTitle?: string;
  leftContent?: React.ReactNode;
  variant?: 'practice' | 'default';
  topRowContent?: React.ReactNode;
  style?: React.CSSProperties;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  children,
  showMetricsRow = false,
  metricsContent,
  centerContent,
  rightContent,
  pageTitle,
  leftContent,
  variant = 'default',
  topRowContent,
  style
}) => {
  const navigate = useNavigate();

  const headerStyle = {
    container: {
      width: '100%',
      background: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      zIndex: 100,
    },
    content: {
      maxWidth: '1920px',
      margin: '0 auto',
      padding: '0 24px',
    },
    topRow: {
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    metricsRow: {
      minHeight: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTop: '1px solid #e5e7eb',
    },
    pageContent: {
      backgroundColor: colors.background.header,
      borderBottom: `1px solid ${colors.border.light}`,
      padding: '12px 40px',
      minHeight: '64px',
    },
    practiceContent: {
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      gap: '24px',
      alignItems: 'center',
    },
    practiceMetrics: {
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      gap: '24px',
      alignItems: 'center',
    },
    metricsGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      justifyContent: 'center'
    },
    metricItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      backgroundColor: colors.background.header,
      borderRadius: '8px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      minWidth: '200px'
    },
    pageTitle: {
      fontSize: '15px',
      color: colors.text.secondary,
      fontWeight: 500,
      margin: 0,
      padding: '0 24px',
      borderLeft: `1px solid ${colors.border.separator}`,
      whiteSpace: 'nowrap' as const,
      height: '40px',
      display: 'flex',
      alignItems: 'center'
    }
  };

  const getContentStyle = () => {
    const baseStyle = headerStyle.pageContent;
    switch (variant) {
      case 'practice':
        return { ...baseStyle, ...headerStyle.practiceContent };
      default:
        return baseStyle;
    }
  };

  const getMetricsStyle = () => {
    const baseStyle = headerStyle.metricsRow;
    switch (variant) {
      case 'practice':
        return { ...baseStyle, ...headerStyle.practiceMetrics };
      default:
        return baseStyle;
    }
  };

  return (
    <div style={{ ...headerStyle.container, ...style }}>
      <div style={headerStyle.content}>
        <div style={headerStyle.topRow}>
          {topRowContent}
        </div>
        {metricsContent && (
          <div style={headerStyle.metricsRow}>
            {metricsContent}
          </div>
        )}
      </div>
    </div>
  );
}; 