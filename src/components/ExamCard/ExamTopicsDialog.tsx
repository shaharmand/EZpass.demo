import React from 'react';
import { Modal, Typography, Space, Card, Tooltip } from 'antd';
import { 
  BookOutlined, 
  QuestionCircleOutlined
} from '@ant-design/icons';
import type { FormalExam } from '../../types/shared/exam';

const { Title, Text } = Typography;

interface ExamTopicsDialogProps {
  exam: FormalExam;
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
        <div style={{ textAlign: 'center' }}>
          <Title level={4} style={{ margin: 0, marginBottom: '8px' }}>
            {exam.title}
          </Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            {exam.description}
          </Text>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={800}
      footer={null}
      className="exam-topics-dialog"
    >
      {/* Topics List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {exam.topics.map((topic) => (
          <Card 
            key={topic.id}
            size="small"
            title={
              <Space>
                <BookOutlined style={{ color: '#1890ff' }} />
                <Text strong>{topic.name}</Text>
              </Space>
            }
            style={{ 
              background: '#fafafa',
              borderRadius: '8px'
            }}
            bodyStyle={{ padding: '12px' }}
          >
            {/* Topic Description */}
            {topic.description && (
              <Text type="secondary" style={{ 
                display: 'block',
                marginBottom: '12px',
                fontSize: '14px'
              }}>
                {topic.description}
              </Text>
            )}

            {/* Subtopics */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '12px'
            }}>
              {topic.subTopics.map((subtopic) => (
                <div
                  key={subtopic.id}
                  style={{
                    padding: '12px 16px',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #f0f0f0'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text strong style={{ fontSize: '15px' }}>
                      {subtopic.name}
                    </Text>
                    {subtopic.questionTemplate && (
                      <Tooltip 
                        title={
                          <div>
                            <Text strong style={{ color: 'white', display: 'block', marginBottom: '4px' }}>
                              דוגמה לשאלה:
                            </Text>
                            <Text style={{ color: 'white' }}>
                              {subtopic.questionTemplate}
                            </Text>
                          </div>
                        }
                        placement="top"
                      >
                        <QuestionCircleOutlined style={{ color: '#6b7280', cursor: 'help' }} />
                      </Tooltip>
                    )}
                  </div>
                  
                  {/* Subtopic Description */}
                  {subtopic.description && (
                    <Text type="secondary" style={{ 
                      display: 'block',
                      fontSize: '14px',
                      marginTop: '8px'
                    }}>
                      {subtopic.description}
                    </Text>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <style>{`
        .exam-topics-dialog .ant-modal-content {
          border-radius: 12px;
          overflow: hidden;
        }
        .exam-topics-dialog .ant-modal-header {
          border-bottom: none;
          padding-bottom: 0;
        }
        .exam-topics-dialog .ant-modal-body {
          padding: 24px;
        }
        .exam-topics-dialog .ant-card-head {
          min-height: unset;
          padding: 8px 12px;
          background: #f0f7ff;
        }
        .exam-topics-dialog .ant-card-head-title {
          padding: 0;
        }
        .exam-topics-dialog .ant-tooltip-inner {
          max-width: 300px;
        }
      `}</style>
    </Modal>
  );
}; 