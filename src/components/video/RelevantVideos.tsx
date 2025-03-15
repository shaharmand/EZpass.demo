import React from 'react';
import { Card, Typography } from 'antd';
import CourseVideos from './CourseVideos';

const { Title } = Typography;

interface RelevantVideosProps {
  subtopicId: string;
}

const RelevantVideos: React.FC<RelevantVideosProps> = ({ subtopicId }) => {
  return (
    <Card className="mb-4">
      <Title level={3}>Related Course Videos</Title>
      <CourseVideos subtopicId={subtopicId} />
    </Card>
  );
};

export default RelevantVideos; 