import React from 'react';
import { Typography } from 'antd';
import { UserHeader } from '../layout/UserHeader';
import styled from 'styled-components';
import { BrandLogo } from '../brand/BrandLogo';
import { UserProfile } from '../user/UserProfile';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

interface CourseHeaderProps {
  courseTitle: string;
}

export const CourseHeader: React.FC<CourseHeaderProps> = ({
  courseTitle,
}) => {
  const navigate = useNavigate();

  const topRowContent = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      gap: '32px'
    }}>
      {/* Logo Section */}
      <div style={{ display: 'flex', alignItems: 'center', height: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: '200px' }}>
          <BrandLogo onClick={() => navigate('/')} size="medium" />
        </div>
        <Text style={{
          fontSize: '15px',
          color: '#64748b',
          fontWeight: 500,
          margin: 0,
          padding: '0 24px',
          borderLeft: '1px solid #f0f0f0',
          whiteSpace: 'nowrap',
          height: '40px',
          display: 'flex',
          alignItems: 'center'
        }}>
          צפיה בקורס
        </Text>
      </div>

      {/* Course Title Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        paddingRight: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Title level={4} style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 600,
            color: '#1e293b',
            maxWidth: '400px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {courseTitle}
          </Title>
        </div>
      </div>

      {/* User Profile Section */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        justifyContent: 'flex-end',
        minWidth: 'max-content',
        height: '40px'
      }}>
        <UserProfile variant="base" />
      </div>
    </div>
  );

  return (
    <UserHeader
      pageTitle="צפיה בקורס"
      topRowContent={topRowContent}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}
    />
  );
};

export default CourseHeader; 