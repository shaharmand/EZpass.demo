import React from 'react';
import { Space, Typography, Tag, Row, Col, Button, Tooltip } from 'antd';
import { 
  StarFilled, 
  StarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  AppstoreOutlined,
  ApartmentOutlined,
  BookOutlined,
  FolderOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { Question } from '../../../types/question';
import { universalTopics } from '../../../services/universalTopics';
import { getQuestionTypeLabel } from '../../../utils/questionUtils';

const { Text, Title } = Typography;

interface QuestionMetadataViewerProps {
  question: Question;
  createdAt?: string;
  updatedAt?: string;
  onEditSection?: (section: 'subject' | 'properties' | 'source' | 'content' | 'solution' | 'evaluation') => void;
}

const getSourceTypeLabel = (sourceType: string) => {
  const labels: Record<string, string> = {
    exam: 'מבחן',
    book: 'ספר',
    author: 'מחבר',
    ezpass: 'EZpass'
  };
  return labels[sourceType] || sourceType;
};

const QuestionMetadataViewer: React.FC<QuestionMetadataViewerProps> = ({ 
  question,
  createdAt,
  updatedAt,
  onEditSection
}) => {
  // Get subject and domain info
  const subject = universalTopics.getSubjectForTopic(question.metadata.topicId);
  const domain = subject?.domains.find(d => 
    d.topics.some(t => t.id === question.metadata.topicId)
  );
  const topic = domain?.topics.find(t => t.id === question.metadata.topicId);
  const subtopic = topic?.subTopics.find(st => st.id === question.metadata.subtopicId);

  const renderDifficultyStars = (level: number) => (
    <Space>
      {[...Array(5)].map((_, index) => (
        index < level ? 
          <StarFilled key={index} style={{ color: '#f59e0b' }} /> :
          <StarOutlined key={index} style={{ color: '#d1d5db' }} />
      ))}
    </Space>
  );

  const renderMetadataItem = (icon: React.ReactNode, label: string, content: React.ReactNode) => (
    <div className="metadata-item" style={{ marginBottom: '12px' }}>
      <Space size="middle">
        {icon}
        <Text type="secondary" style={{ fontSize: '14px' }}>{label}:</Text>
        <div style={{ fontSize: '14px' }}>{content}</div>
      </Space>
    </div>
  );

  const renderSectionHeader = (icon: React.ReactNode, title: string, onEdit?: () => void) => (
    <div style={{ 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px',
      borderBottom: '1px solid #f0f0f0',
      paddingBottom: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        <Text strong style={{ fontSize: '16px' }}>{title}</Text>
      </div>
      {onEdit && (
        <Button 
          type="text" 
          icon={<EditOutlined />} 
          onClick={onEdit}
        />
      )}
    </div>
  );

  const renderSection = (content: React.ReactNode) => (
    <div style={{ 
      background: '#fafafa', 
      padding: '24px', 
      borderRadius: '8px',
      border: '1px solid #f0f0f0'
    }}>
      {content}
    </div>
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }} dir="rtl">
      {/* Header with Title, ID and Timestamps */}
      <div style={{ marginBottom: '24px' }}>
        {/* Title and ID */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          marginBottom: '8px'
        }}>
          <Title level={4} style={{ margin: 0 }}>{question.name || 'שאלה ללא כותרת'}</Title>
          <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
            ID: {question.id}
          </Tag>
        </div>
        {/* Subtitle */}
        <Text type="secondary" style={{ fontSize: '14px' }}>דף שאלה</Text>
      </div>

      {/* Timestamps */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        marginBottom: '24px'
      }}>
        <Space size="large">
          {createdAt && (
            <Space>
              <UserOutlined style={{ color: '#1890ff' }} />
              <Text type="secondary">נוצר:</Text>
              <Text strong>{new Date(createdAt).toLocaleDateString('he-IL')}</Text>
            </Space>
          )}
          {updatedAt && (
            <Space>
              <HistoryOutlined style={{ color: '#1890ff' }} />
              <Text type="secondary">עודכן:</Text>
              <Text strong>{new Date(updatedAt).toLocaleDateString('he-IL')}</Text>
            </Space>
          )}
        </Space>
      </div>

      {/* Metadata Sections */}
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {/* Question Properties */}
        <div className="metadata-section">
          {renderSectionHeader(
            <FileTextOutlined style={{ fontSize: '18px', color: '#52c41a' }} />, 
            "מאפייני שאלה",
            () => onEditSection?.('properties')
          )}
          {renderSection(
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '32px',
              padding: '8px 16px',
              background: '#fafafa',
              borderRadius: '8px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px 16px',
                background: '#fff',
                borderRadius: '6px',
                border: '1px solid #f0f0f0'
              }}>
                <FileTextOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                <Text type="secondary">סוג:</Text>
                <Tag color="success" style={{ fontSize: '14px', margin: 0 }}>
                  {getQuestionTypeLabel(question.type)}
                </Tag>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px 16px',
                background: '#fff',
                borderRadius: '6px',
                border: '1px solid #f0f0f0'
              }}>
                <StarOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                <Text type="secondary">רמת קושי:</Text>
                {renderDifficultyStars(question.metadata.difficulty)}
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px 16px',
                background: '#fff',
                borderRadius: '6px',
                border: '1px solid #f0f0f0'
              }}>
                <ClockCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                <Text type="secondary">זמן מוערך:</Text>
                <Text strong>{question.metadata.estimatedTime || 'N/A'} דקות</Text>
              </div>
            </div>
          )}
        </div>

        {/* Subject Info */}
        <div className="metadata-section">
          {renderSectionHeader(
            <AppstoreOutlined style={{ fontSize: '18px', color: '#1890ff' }} />, 
            "מידע נושא",
            () => onEditSection?.('subject')
          )}
          {renderSection(
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Subject Level */}
              <div className="hierarchy-level">
                {renderMetadataItem(
                  <BookOutlined style={{ fontSize: '16px', color: '#1890ff' }} />,
                  "נושא על",
                  <Text strong>{subject?.name || 'N/A'}</Text>
                )}
              </div>

              {/* Domain Level */}
              <div className="hierarchy-level" style={{ marginRight: '24px', position: 'relative' }}>
                <div style={{ 
                  position: 'absolute',
                  left: 'calc(100% - 24px)',
                  top: '-8px',
                  bottom: '50%',
                  width: '2px',
                  background: '#e6f4ff'
                }} />
                <div style={{ 
                  position: 'absolute',
                  right: '-24px',
                  top: '50%',
                  width: '24px',
                  height: '2px',
                  background: '#e6f4ff'
                }} />
                {renderMetadataItem(
                  <ApartmentOutlined style={{ fontSize: '16px', color: '#1890ff' }} />,
                  "תחום",
                  <Text strong>{domain?.name || 'N/A'}</Text>
                )}
              </div>

              {/* Topic Level */}
              <div className="hierarchy-level" style={{ marginRight: '48px', position: 'relative' }}>
                <div style={{ 
                  position: 'absolute',
                  left: 'calc(100% - 48px)',
                  top: '-8px',
                  bottom: '50%',
                  width: '2px',
                  background: '#e6f4ff'
                }} />
                <div style={{ 
                  position: 'absolute',
                  right: '-48px',
                  top: '50%',
                  width: '48px',
                  height: '2px',
                  background: '#e6f4ff'
                }} />
                {renderMetadataItem(
                  <FolderOutlined style={{ fontSize: '16px', color: '#1890ff' }} />,
                  "נושא",
                  <Text strong>{topic?.name || 'N/A'}</Text>
                )}
              </div>

              {/* Subtopic Level */}
              {question.metadata.subtopicId && (
                <div className="hierarchy-level" style={{ marginRight: '72px', position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute',
                    left: 'calc(100% - 72px)',
                    top: '-8px',
                    bottom: '50%',
                    width: '2px',
                    background: '#e6f4ff'
                  }} />
                  <div style={{ 
                    position: 'absolute',
                    right: '-72px',
                    top: '50%',
                    width: '72px',
                    height: '2px',
                    background: '#e6f4ff'
                  }} />
                  {renderMetadataItem(
                    <FolderOutlined style={{ fontSize: '16px', color: '#1890ff' }} />,
                    "תת-נושא",
                    <Text strong>{subtopic?.name || 'N/A'}</Text>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Source Information */}
        <div className="metadata-section">
          {renderSectionHeader(
            <CalendarOutlined style={{ fontSize: '18px', color: '#fa8c16' }} />, 
            "מידע מקור",
            () => onEditSection?.('source')
          )}
          {renderSection(
            question.metadata.source ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Source Type */}
                {renderMetadataItem(
                  <BookOutlined style={{ fontSize: '16px', color: '#fa8c16' }} />,
                  "סוג מקור",
                  <Tag color="orange" style={{ fontSize: '14px' }}>
                    {getSourceTypeLabel(question.metadata.source.sourceType)}
                  </Tag>
                )}

                {/* Exam-specific fields */}
                {question.metadata.source.sourceType === 'exam' && (
                  <div style={{ display: 'flex', gap: '32px' }}>
                    <div>
                      {renderMetadataItem(
                        <BookOutlined style={{ fontSize: '16px', color: '#fa8c16' }} />,
                        "תבנית",
                        <Text strong>{question.metadata.source.examTemplateId || 'N/A'}</Text>
                      )}
                      {renderMetadataItem(
                        <CalendarOutlined style={{ fontSize: '16px', color: '#fa8c16' }} />,
                        "שנה",
                        <Text strong>{question.metadata.source.year || 'N/A'}</Text>
                      )}
                    </div>
                    <div>
                      {renderMetadataItem(
                        <CalendarOutlined style={{ fontSize: '16px', color: '#fa8c16' }} />,
                        "סמסטר",
                        <Text strong>{question.metadata.source.season || 'N/A'}</Text>
                      )}
                      {question.metadata.source.moed && renderMetadataItem(
                        <CalendarOutlined style={{ fontSize: '16px', color: '#fa8c16' }} />,
                        "מועד",
                        <Text strong>{question.metadata.source.moed}</Text>
                      )}
                    </div>
                  </div>
                )}

                {/* Book-specific fields */}
                {question.metadata.source.sourceType === 'book' && (
                  <div>
                    {renderMetadataItem(
                      <BookOutlined style={{ fontSize: '16px', color: '#fa8c16' }} />,
                      "שם הספר",
                      <Text strong>{question.metadata.source.bookName || 'N/A'}</Text>
                    )}
                    {renderMetadataItem(
                      <BookOutlined style={{ fontSize: '16px', color: '#fa8c16' }} />,
                      "מיקום",
                      <Text strong>{question.metadata.source.bookLocation || 'N/A'}</Text>
                    )}
                  </div>
                )}

                {/* Author-specific fields */}
                {question.metadata.source.sourceType === 'author' && (
                  <div>
                    {renderMetadataItem(
                      <UserOutlined style={{ fontSize: '16px', color: '#fa8c16' }} />,
                      "שם המחבר",
                      <Text strong>{question.metadata.source.authorName || 'N/A'}</Text>
                    )}
                  </div>
                )}

                {/* Common fields for all types except EZpass */}
                {question.metadata.source.sourceType !== 'ezpass' && (
                  <div>
                    {renderMetadataItem(
                      <CalendarOutlined style={{ fontSize: '16px', color: '#fa8c16' }} />,
                      "שנה",
                      <Text strong>{question.metadata.source.year || 'N/A'}</Text>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: '14px' }}>No source information available</Text>
            )
          )}
        </div>

        {/* Question Content */}
        <div className="metadata-section">
          {renderSectionHeader(
            <FileTextOutlined style={{ fontSize: '18px', color: '#1890ff' }} />, 
            "תוכן השאלה",
            () => onEditSection?.('content')
          )}
          {renderSection(
            <div>
              <div className="question-text" style={{ marginBottom: '16px' }}>
                <Text>{question.content.text}</Text>
              </div>
              {question.options && (
                <div className="question-options">
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>אפשרויות:</Text>
                  {question.options.map((option, index) => (
                    <div 
                      key={index}
                      style={{ 
                        marginBottom: '8px',
                        padding: '8px',
                        background: question.correctOption === index + 1 ? '#f6ffed' : 'white',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px'
                      }}
                    >
                      <Text>{`${index + 1}. ${option.text}`}</Text>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Solution and Evaluation */}
        <div className="metadata-section">
          {renderSectionHeader(
            <FileTextOutlined style={{ fontSize: '18px', color: '#722ed1' }} />, 
            "פתרון מלא ומחוון",
            () => onEditSection?.('evaluation')
          )}
          {renderSection(
            <div>
              {/* Solution */}
              <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>פתרון:</Text>
                <div style={{ 
                  padding: '12px',
                  background: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px'
                }}>
                  <Text>{question.solution.text || 'לא הוגדר פתרון'}</Text>
                </div>
              </div>

              {/* Answer Requirements */}
              <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>דרישות תשובה:</Text>
                {question.evaluation?.answerRequirements?.requiredElements?.length ? (
                  <ul style={{ paddingRight: '20px', margin: 0 }}>
                    {question.evaluation.answerRequirements.requiredElements.map((req, index) => (
                      <li key={index}><Text>{req}</Text></li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ 
                    padding: '12px',
                    background: 'white',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px'
                  }}>
                    <Text type="secondary">לא הוגדרו דרישות תשובה</Text>
                  </div>
                )}
              </div>

              {/* Rubric Assessment */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>מחוון הערכה:</Text>
                {question.evaluation?.rubricAssessment?.criteria?.length ? (
                  question.evaluation.rubricAssessment.criteria.map((criterion, index) => (
                    <div 
                      key={index}
                      style={{ 
                        marginBottom: '8px',
                        padding: '12px',
                        background: 'white',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px'
                      }}
                    >
                      <Text strong>{criterion.name} ({criterion.weight}%)</Text>
                      <br />
                      <Text>{criterion.description}</Text>
                    </div>
                  ))
                ) : (
                  <div style={{ 
                    padding: '12px',
                    background: 'white',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px'
                  }}>
                    <Text type="secondary">לא הוגדרו קריטריונים להערכה</Text>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Space>
    </div>
  );
};

export default QuestionMetadataViewer; 