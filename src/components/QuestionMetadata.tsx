import React from 'react';
import { Space, Tag, Typography, Tooltip, Divider, Card, Row, Col } from 'antd';
import { 
  BookOutlined, 
  ClockCircleOutlined, 
  FileTextOutlined, 
  StarFilled,
  StarOutlined,
  SafetyCertificateOutlined,
  ExperimentOutlined,
  AppstoreOutlined,
  ApartmentOutlined,
  FolderOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { getQuestionTypeLabel } from '../utils/questionUtils';
import { universalTopics } from '../services/universalTopics';

const { Text, Title } = Typography;

interface QuestionMetadataProps {
  metadata: {
    topicId: string;
    subtopicId?: string;
    type: string;
    difficulty: string;
    estimatedTime?: number;
    source?: {
      examTemplateId?: string;
      year?: number;
      season?: string;
      moed?: string;
    };
  };
  layout?: 'vertical' | 'horizontal';
  compact?: boolean;
}

const difficultyColors = {
  1: '#10b981', // Green
  2: '#34d399', // Light green
  3: '#3b82f6', // Blue
  4: '#f59e0b', // Amber/Orange
  5: '#ef4444'  // Red
};

export const getDifficultyIcons = (level: string) => {
  const numLevel = parseInt(level);
  const totalStars = 5;
  const filledStars = numLevel;
  
  return (
    <span className="difficulty-stars">
      {[...Array(totalStars)].map((_, index) => (
        <span key={index} className={index < filledStars ? 'filled' : 'empty'}>
          {index < filledStars ? (
            <StarFilled style={{ color: '#f59e0b' }} />
          ) : (
            <StarOutlined style={{ color: '#d1d5db' }} />
          )}
        </span>
      ))}
    </span>
  );
};

const getDifficultyLabel = (level: string) => {
  const numLevel = parseInt(level);
  switch(numLevel) {
    case 1: return 'קל מאוד';
    case 2: return 'קל';
    case 3: return 'בינוני';
    case 4: return 'קשה';
    case 5: return 'קשה מאוד';
    default: return `רמה ${level}`;
  }
};

const QuestionMetadata: React.FC<QuestionMetadataProps> = ({ 
  metadata, 
  layout = 'vertical',
  compact = false
}) => {
  // Get topic information using universalTopics service
  const subject = metadata.topicId ? universalTopics.getSubjectForTopic(metadata.topicId) : undefined;
  const domain = subject?.domains.find(d => 
    d.topics.some(t => t.id === metadata.topicId)
  );
  const topic = domain?.topics.find(t => t.id === metadata.topicId);
  const subtopic = metadata.subtopicId ? universalTopics.getSubtopicInfo(metadata.topicId, metadata.subtopicId) : undefined;

  // Format the difficulty for display
  const displayDifficulty = getDifficultyLabel(metadata.difficulty);

  const renderMetadataItem = (icon: React.ReactNode, label: string, content: React.ReactNode) => (
    <div className="metadata-item">
      <Space>
        {icon}
        <Text type="secondary">{label}:</Text>
        {content}
      </Space>
    </div>
  );

  const renderContent = () => (
    <div className={compact ? 'metadata-compact' : 'metadata-full'}>
      {/* Topic Information */}
      <Card size="small" className="metadata-card" title={
        <Space>
          <AppstoreOutlined />
          <span>מידע נושא</span>
        </Space>
      }>
        <Row gutter={[16, 8]}>
          <Col span={compact ? 24 : 12}>
            {renderMetadataItem(
              <BookOutlined />,
              "נושא",
              <Text>{subject?.name || 'N/A'}</Text>
            )}
          </Col>
          <Col span={compact ? 24 : 12}>
            {renderMetadataItem(
              <ApartmentOutlined />,
              "תחום",
              <Text>{domain?.name || 'N/A'}</Text>
            )}
          </Col>
          <Col span={compact ? 24 : 12}>
            {renderMetadataItem(
              <FolderOutlined />,
              "נושא בריכוז",
              <Text>{topic?.name || 'N/A'}</Text>
            )}
          </Col>
          {metadata.subtopicId && (
            <Col span={compact ? 24 : 12}>
              {renderMetadataItem(
                <FolderOutlined />,
                "תת נושא",
                <Text>{subtopic?.name || 'N/A'}</Text>
              )}
            </Col>
          )}
        </Row>
      </Card>

      {/* Question Properties */}
      <Card size="small" className="metadata-card" title={
        <Space>
          <FileTextOutlined />
          <span>מאפייני שאלה</span>
        </Space>
      }>
        <Row gutter={[16, 8]}>
          <Col span={compact ? 24 : 12}>
            {renderMetadataItem(
              <FileTextOutlined />,
              "סוג",
              <Tag>{getQuestionTypeLabel(metadata.type)}</Tag>
            )}
          </Col>
          <Col span={compact ? 24 : 12}>
            {renderMetadataItem(
              <SafetyCertificateOutlined />,
              "רמת קושי",
              <Space>
                {getDifficultyIcons(metadata.difficulty)}
                <Text>{displayDifficulty}</Text>
              </Space>
            )}
          </Col>
          <Col span={compact ? 24 : 12}>
            {renderMetadataItem(
              <ClockCircleOutlined />,
              "זמן מוערך",
              <Text>{metadata.estimatedTime ? `${metadata.estimatedTime} דקות` : 'N/A'}</Text>
            )}
          </Col>
        </Row>
      </Card>

      {/* Source Information */}
      <Card size="small" className="metadata-card" title={
        <Space>
          <CalendarOutlined />
          <span>מידע מקור</span>
        </Space>
      }>
        <Row gutter={[16, 8]}>
          <Col span={compact ? 24 : 12}>
            {renderMetadataItem(
              <BookOutlined />,
              "תבנית",
              <Text>{metadata.source?.examTemplateId || 'N/A'}</Text>
            )}
          </Col>
          <Col span={compact ? 24 : 12}>
            {renderMetadataItem(
              <CalendarOutlined />,
              "שנה",
              <Text>{metadata.source?.year || 'N/A'}</Text>
            )}
          </Col>
          <Col span={compact ? 24 : 12}>
            {renderMetadataItem(
              <CalendarOutlined />,
              "עונה",
              <Text>{metadata.source?.season || 'N/A'}</Text>
            )}
          </Col>
          <Col span={compact ? 24 : 12}>
            {renderMetadataItem(
              <CalendarOutlined />,
              "מועד",
              <Text>{metadata.source?.moed || 'N/A'}</Text>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );

  return (
    <div className={layout === 'horizontal' ? 'metadata-horizontal' : 'metadata-vertical'}>
      {renderContent()}
      
      <style>
        {`
          .metadata-compact .metadata-card {
            margin-bottom: 8px;
          }

          .metadata-full .metadata-card {
            margin-bottom: 12px;
          }

          .metadata-item {
            display: flex;
            align-items: center;
            margin-bottom: 4px;
          }

          .metadata-item .anticon {
            color: #6b7280;
            margin-right: 8px;
          }

          .metadata-card {
            background: #fafafa;
          }

          .metadata-card .ant-card-head {
            min-height: 40px;
            padding: 0 12px;
            background: #f0f0f0;
          }

          .metadata-card .ant-card-head-title {
            padding: 8px 0;
          }

          .metadata-card .ant-card-body {
            padding: 12px;
          }

          .difficulty-stars {
            display: flex;
            gap: 2px;
          }

          .difficulty-stars .filled,
          .difficulty-stars .empty {
            font-size: 14px;
          }

          .metadata-vertical {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .metadata-horizontal {
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }

          .metadata-horizontal .metadata-card {
            flex: 1;
          }
        `}
      </style>
    </div>
  );
};

export default QuestionMetadata; 