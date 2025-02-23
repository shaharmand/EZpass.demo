import React from 'react';
import { Modal, Typography, Space, Collapse, Divider, Statistic, Tag } from 'antd';
import { 
  BookOutlined, 
  QuestionCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  RightOutlined,
  CheckOutlined,
  FormOutlined
} from '@ant-design/icons';
import type { ExamTemplate } from '../../types/examTemplate';
import { getQuestionTypeLabel } from '../../utils/questionUtils';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ExamTopicsDialogProps {
  exam: ExamTemplate;
  open: boolean;
  onClose: () => void;
}

export const ExamTopicsDialog: React.FC<ExamTopicsDialogProps> = ({
  exam,
  open,
  onClose
}) => {
  return (
    <Modal
      title={
        <div style={{ 
          textAlign: 'center',
          background: '#1e40af',
          margin: '-20px -24px 20px',
          padding: '24px',
          borderRadius: '12px 12px 0 0',
          color: 'white'
        }}>
          <Title level={4} style={{ 
            margin: 0, 
            marginBottom: '8px',
            color: 'white',
            fontSize: '24px'
          }}>
            {exam.names.full}
          </Title>
          <Text style={{ 
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.85)'
          }}>
            {`${exam.code} - ${exam.names.medium}`}
          </Text>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={800}
      footer={null}
      className="exam-topics-dialog"
    >
      {/* Exam Structure Info */}
      <div style={{ 
        marginBottom: '24px',
        padding: '24px',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <Space size={48} style={{ width: '100%', justifyContent: 'center', marginBottom: '24px' }}>
          <Statistic 
            title="משך הבחינה"
            value={`${exam.duration} דקות`}
            prefix={<ClockCircleOutlined style={{ color: '#1e40af' }} />}
          />
          <Statistic 
            title="מספר שאלות"
            value={exam.totalQuestions}
            prefix={<FileTextOutlined style={{ color: '#1e40af' }} />}
          />
          <Statistic 
            title="רמת קושי"
            value={`${exam.difficulty}/${exam.maxDifficulty || exam.difficulty}`}
            prefix={<QuestionCircleOutlined style={{ color: '#1e40af' }} />}
          />
        </Space>

        {/* Question Types */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <Text strong style={{ 
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#1e40af'
          }}>
            <FormOutlined /> סוגי שאלות:
          </Text>
          {exam.allowedQuestionTypes.map((type) => (
            <Tag
              key={type}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: '#1e40af'
              }}
            >
              {getQuestionTypeLabel(type)}
            </Tag>
          ))}
        </div>
      </div>

      {/* Content Structure */}
      <div style={{ 
        marginBottom: '24px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          padding: '12px 24px',
          background: '#f1f5f9',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <BookOutlined style={{ color: '#3b82f6' }} />
          <Text strong>{exam.topics.length} נושאים</Text>
        </div>
        <div style={{ 
          padding: '12px 24px',
          background: '#f1f5f9',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FileTextOutlined style={{ color: '#3b82f6' }} />
          <Text strong>
            {exam.topics.reduce((sum, topic) => sum + (topic.subTopics?.length || 0), 0)} תתי-נושאים
          </Text>
        </div>
      </div>

      <Divider style={{ margin: '24px 0' }}>תוכן הבחינה</Divider>

      {/* Topics List */}
      <Collapse
        defaultActiveKey={[exam.topics[0]?.id]}
        expandIcon={({ isActive }) => (
          <RightOutlined rotate={isActive ? 90 : 0} style={{ fontSize: '12px' }} />
        )}
        className="topics-collapse"
      >
        {exam.topics.map((topic) => (
          <Panel
            key={topic.id}
            header={
              <Space>
                <BookOutlined style={{ color: '#3b82f6' }} />
                <Text strong>{topic.name}</Text>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  ({topic.subTopics.length} תתי-נושאים)
                </Text>
              </Space>
            }
          >
            {topic.description && (
              <Paragraph type="secondary" style={{ 
                marginBottom: '16px',
                fontSize: '14px',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                {topic.description}
              </Paragraph>
            )}

            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '12px'
            }}>
              {topic.subTopics.map((subtopic) => (
                <div
                  key={subtopic.id}
                  className="subtopic-item"
                  style={{
                    padding: '12px 16px',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s',
                    cursor: subtopic.questionTemplate ? 'help' : 'default'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckOutlined style={{ color: '#3b82f6', fontSize: '14px' }} />
                    <Text strong style={{ fontSize: '15px' }}>
                      {subtopic.name}
                    </Text>
                    {subtopic.questionTemplate && (
                      <QuestionCircleOutlined 
                        style={{ 
                          color: '#64748b',
                          cursor: 'help',
                          fontSize: '14px'
                        }}
                        title={`דוגמה לשאלה: ${subtopic.questionTemplate}`}
                      />
                    )}
                  </div>
                  
                  {subtopic.description && (
                    <Text type="secondary" style={{ 
                      display: 'block',
                      fontSize: '14px',
                      marginTop: '8px',
                      color: '#64748b'
                    }}>
                      {subtopic.description}
                    </Text>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </Collapse>

      <style>{`
        .exam-topics-dialog .ant-modal-content {
          border-radius: 12px;
          overflow: hidden;
        }
        .exam-topics-dialog .ant-modal-header {
          border-bottom: none;
          padding: 0;
          background: transparent;
        }
        .exam-topics-dialog .ant-modal-body {
          padding: 24px;
        }
        .exam-topics-dialog .ant-statistic {
          text-align: center;
        }
        .exam-topics-dialog .ant-statistic-title {
          color: #64748b;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .exam-topics-dialog .ant-statistic-content {
          color: #1e293b;
          font-size: 18px;
        }
        .topics-collapse .ant-collapse-header {
          padding: 12px 16px !important;
          background: #f8fafc;
          border-radius: 8px !important;
        }
        .topics-collapse .ant-collapse-content-box {
          padding: 16px !important;
        }
        .topics-collapse .ant-collapse-item {
          margin-bottom: 8px;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .topics-collapse .ant-collapse-item:last-child {
          margin-bottom: 0;
        }
        .subtopic-item:hover {
          border-color: #bfdbfe !important;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
          background: #f8fafc;
        }
      `}</style>
    </Modal>
  );
}; 