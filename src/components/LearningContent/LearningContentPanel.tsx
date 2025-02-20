import React from 'react';
import { Card, List, Button, Tag, Space, Typography, Progress, Avatar, Badge } from 'antd';
import { PlayCircleOutlined, BookOutlined, ExperimentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { Question } from '../../types/question';
import './LearningContent.css';

const { Title, Text } = Typography;

// Mock data
const MOCK_LEARNING_CONTENT = [
  {
    id: 1,
    type: 'video',
    title: 'נגזרת של פונקציה מורכבת',
    description: 'הסבר מקיף על חוקי השרשרת בנגזרות',
    duration: '8:45',
    relevance: 'direct',
    thumbnail: '/thumbnails/derivatives.jpg',
    progress: 0,
    difficulty: 'intermediate'
  },
  {
    id: 2,
    type: 'interactive',
    title: 'תרגול מודרך: חוקי הנגזרת',
    description: '10 שאלות עם הסברים מפורטים',
    duration: '15 דקות',
    relevance: 'related',
    progress: 30,
    difficulty: 'beginner'
  },
  {
    id: 3,
    type: 'article',
    title: 'טיפים לפתרון שאלות בנגזרות',
    description: 'אסטרטגיות ודגשים חשובים',
    duration: '5 דקות',
    relevance: 'supplementary',
    progress: 0,
    difficulty: 'beginner'
  }
];

interface LearningContentPanelProps {
  currentQuestion: Question;
  userProgress?: {
    completedContent: string[];
    currentContent?: string;
  };
}

export const LearningContentPanel: React.FC<LearningContentPanelProps> = ({ 
  currentQuestion,
  userProgress 
}) => {
  return (
    <Card 
      className="learning-content-panel"
      title={
        <div className="learning-header">
          <Title level={4}>תוכן מומלץ</Title>
          <Progress type="circle" percent={75} width={40} />
        </div>
      }
    >
      <List
        itemLayout="horizontal"
        dataSource={MOCK_LEARNING_CONTENT}
        renderItem={item => (
          <List.Item className="learning-item">
            <List.Item.Meta
              avatar={
                <Badge 
                  count={getTypeIcon(item.type)} 
                  offset={[0, 0]}
                >
                  <Avatar 
                    shape="square" 
                    size={64}
                    icon={getTypeDefaultIcon(item.type)}
                    className={'type-' + item.type}
                  />
                </Badge>
              }
              title={
                <Space direction="vertical" size={4}>
                  <Text strong>{item.title}</Text>
                  <Space size={4}>
                    <Tag color={getRelevanceColor(item.relevance)}>
                      {getRelevanceLabel(item.relevance)}
                    </Tag>
                    <Tag color={getDifficultyColor(item.difficulty)}>
                      {getDifficultyLabel(item.difficulty)}
                    </Tag>
                  </Space>
                </Space>
              }
              description={
                <Space direction="vertical" size={2}>
                  <Text type="secondary">{item.description}</Text>
                  <Text type="secondary">
                    <ClockCircleOutlined /> {item.duration}
                  </Text>
                  {item.progress > 0 && (
                    <Progress percent={item.progress} size="small" />
                  )}
                </Space>
              }
            />
            <Button 
              type="primary"
              icon={getActionIcon(item.type)}
              shape="round"
              className="action-button"
            >
              {getActionLabel(item.type)}
            </Button>
          </List.Item>
        )}
      />
    </Card>
  );
};

// Helper functions for UI elements
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'video': return '📹';
    case 'interactive': return '✏️';
    case 'article': return '📚';
    default: return '📖';
  }
};

const getTypeDefaultIcon = (type: string) => {
  switch (type) {
    case 'video': return <PlayCircleOutlined />;
    case 'interactive': return <ExperimentOutlined />;
    case 'article': return <BookOutlined />;
    default: return <BookOutlined />;
  }
};

const getRelevanceColor = (relevance: string) => {
  switch (relevance) {
    case 'direct': return 'blue';
    case 'related': return 'green';
    case 'supplementary': return 'orange';
    default: return 'default';
  }
};

const getRelevanceLabel = (relevance: string) => {
  switch (relevance) {
    case 'direct': return 'רלוונטי לשאלה';
    case 'related': return 'נושא קשור';
    case 'supplementary': return 'העשרה';
    default: return relevance;
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'success';
    case 'intermediate': return 'warning';
    case 'advanced': return 'error';
    default: return 'default';
  }
};

const getDifficultyLabel = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'למתחילים';
    case 'intermediate': return 'בינוני';
    case 'advanced': return 'מתקדם';
    default: return difficulty;
  }
};

const getActionIcon = (type: string) => {
  switch (type) {
    case 'video': return <PlayCircleOutlined />;
    case 'interactive': return <ExperimentOutlined />;
    case 'article': return <BookOutlined />;
    default: return <BookOutlined />;
  }
};

const getActionLabel = (type: string) => {
  switch (type) {
    case 'video': return 'צפה עכשיו';
    case 'interactive': return 'התחל תרגול';
    case 'article': return 'קרא עכשיו';
    default: return 'התחל';
  }
}; 