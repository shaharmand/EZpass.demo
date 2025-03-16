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

  return (
    <UserHeader
      variant="course"
      pageType="צפיה בקורס"
      pageContent={courseTitle}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}
    />
  );
};

export default CourseHeader; 