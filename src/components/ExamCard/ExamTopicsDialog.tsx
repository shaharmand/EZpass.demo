import React from 'react';
import { Modal, Typography, Space, Divider, Card, Button, Collapse } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  BookOutlined, 
  ClockCircleOutlined, 
  QuestionCircleOutlined,
  RightCircleOutlined,
  CaretRightOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import type { FormalExam, Topic } from '../../types/shared/exam';
import { useStudentPrep } from '../../contexts/StudentPrepContext';
import { startQuickPractice } from '../../utils/examUtils';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ExamTopicsDialogProps {
  exam: FormalExam;
  open: boolean;
  onClose: () => void;
}

export const ExamTopicsDialog: React.FC<ExamTopicsDialogProps> = ({
  exam,
  open,
  onClose,
}) => {
  const navigate = useNavigate();
  const { setActivePrep } = useStudentPrep();
  
  // Filter out missing topics
  const validTopics = React.useMemo(() => {
    if (!exam.topics) return [];
    return exam.topics;
  }, [exam.topics]);

  const handleStartPractice = () => {
    startQuickPractice(exam, setActivePrep, navigate);
    onClose();
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      width={800}
      footer={
        <Button 
          type="primary" 
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={handleStartPractice}
          style={{
            width: '100%',
            height: '48px',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          התחל תרגול
        </Button>
      }
      className="exam-topics-dialog"
      bodyStyle={{ padding: 0 }}
    >
      {/* Header Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
        padding: '24px',
        borderRadius: '8px 8px 0 0',
        marginBottom: '24px'
      }}>
        <Title level={4} style={{ 
          margin: 0,
          color: 'white',
          marginBottom: '16px'
        }}>
          {exam.title}
        </Title>
        
        <Space split={<Divider type="vertical" style={{ borderColor: 'rgba(255,255,255,0.3)' }} />}>
          <Space>
            <BookOutlined style={{ color: 'white' }} />
            <Text style={{ color: 'white' }}>
              קוד {exam.description.split(' - ')[0]}
            </Text>
          </Space>
          <Space>
            <ClockCircleOutlined style={{ color: 'white' }} />
            <Text style={{ color: 'white' }}>
              {exam.duration} דקות
            </Text>
          </Space>
          <Space>
            <QuestionCircleOutlined style={{ color: 'white' }} />
            <Text style={{ color: 'white' }}>
              {exam.totalQuestions} שאלות
            </Text>
          </Space>
        </Space>
      </div>

      <div style={{ 
        maxHeight: 'calc(80vh - 240px)', // Adjusted for footer
        overflowY: 'auto',
        padding: '0 24px 24px'
      }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>            
          {validTopics.map((topic, topicIndex) => (
            <Collapse 
              key={topicIndex}
              defaultActiveKey={['1']}
              expandIcon={({ isActive }) => (
                <CaretRightOutlined
                  rotate={isActive ? 90 : 0}
                  style={{ 
                    fontSize: '16px',
                    color: '#1890ff'
                  }}
                />
              )}
              style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <Panel 
                key="1"
                header={
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    <Text strong style={{ 
                      fontSize: '1.2rem',
                      color: '#1f2937'
                    }}>
                      {topic.name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                      {topic.subTopics.length} תתי-נושאים
                    </Text>
                  </div>
                }
              >
                {/* Topic Description */}
                <Space direction="vertical" style={{ width: '100%', marginBottom: '12px' }}>
                  <div>
                    <Text strong>תיאור הנושא:</Text>
                    <Paragraph style={{ 
                      margin: '4px 0 8px',
                      color: '#4b5563',
                      fontSize: '0.95rem'
                    }}>
                      {topic.description}
                    </Paragraph>
                  </div>
                </Space>

                {/* Subtopics */}
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {topic.subTopics.map((subTopic, subIndex) => (
                    <div key={subIndex} style={{
                      padding: '2px 4px',
                      background: '#f9fafb',
                      borderRadius: '4px',
                      marginBottom: subIndex < topic.subTopics.length - 1 ? '2px' : 0
                    }}>
                      <Collapse 
                        ghost 
                        expandIcon={({ isActive }) => (
                          <CaretRightOutlined
                            rotate={isActive ? 90 : 0}
                            style={{ 
                              fontSize: '14px',
                              color: '#1890ff'
                            }}
                          />
                        )}
                      >
                        <Panel 
                          header={
                            <Text strong style={{ 
                              color: '#1f2937',
                              fontSize: '0.95rem',
                              lineHeight: '1.2'
                            }}>
                              {subTopic.name}
                            </Text>
                          }
                          key="1"
                          style={{ padding: 0, margin: 0 }}
                        >
                          <div style={{ paddingTop: '2px', paddingLeft: '20px' }}>
                            <Space direction="vertical" style={{ width: '100%' }} size={2}>
                              <div>
                                <Text strong>תיאור:</Text>
                                <Paragraph style={{ 
                                  margin: '2px 0',
                                  fontSize: '0.9rem'
                                }}>
                                  {subTopic.description}
                                </Paragraph>
                              </div>
                              {subTopic.questionTemplate && (
                                <div>
                                  <Text strong>שאלות אופייניות:</Text>
                                  <Paragraph style={{ 
                                    margin: '2px 0',
                                    fontSize: '0.9rem'
                                  }}>
                                    {subTopic.questionTemplate}
                                  </Paragraph>
                                </div>
                              )}
                            </Space>
                          </div>
                        </Panel>
                      </Collapse>
                    </div>
                  ))}
                </Space>
              </Panel>
            </Collapse>
          ))}
        </Space>
      </div>
    </Modal>
  );
}; 