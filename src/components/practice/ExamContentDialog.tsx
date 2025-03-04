import React, { useState, useEffect } from 'react';
import { Modal, Typography, Button, Tooltip, Space, notification } from 'antd';
import { 
  InfoCircleOutlined,
  BookOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import type { ExamTemplate } from '../../types/examTemplate';
import type { TopicSelection } from '../../types/prepState';
import type { StudentPrep } from '../../types/prepState';
import { PrepStateManager } from '../../services/PrepStateManager';

const { Text, Title } = Typography;

interface ExamContentDialogProps {
  exam: ExamTemplate;
  open: boolean;
  onClose: () => void;
  prepId: string;
}

export const ExamContentDialog: React.FC<ExamContentDialogProps> = ({
  exam,
  open,
  onClose,
  prepId
}) => {
  const [currentPrep, setCurrentPrep] = useState<StudentPrep | null>(null);
  const [selection, setSelection] = useState<TopicSelection>({ subTopics: [] });

  // Load current prep state when dialog opens
  useEffect(() => {
    if (open) {
      const freshPrep = PrepStateManager.getPrep(prepId);
      if (freshPrep) {
        setCurrentPrep(freshPrep);
        setSelection(freshPrep.selection);
      }
    }
  }, [open, prepId]);

  // Helper function to check if a subtopic is selected
  const isSubtopicSelected = (subtopicId: string) => 
    selection.subTopics.includes(subtopicId);

  // Handle toggling a subtopic selection
  const handleToggleSubtopic = (subtopicId: string) => {
    if (!currentPrep) return;

    const newSelection = isSubtopicSelected(subtopicId)
      ? selection.subTopics.filter(id => id !== subtopicId)
      : [...selection.subTopics, subtopicId];
    
    // Only update local state, don't update PrepStateManager yet
    setSelection({ subTopics: newSelection });
  };

  // Handle closing the dialog
  const handleClose = () => {
    if (!currentPrep) return;
    
    // Get fresh prep state before closing
    const freshPrep = PrepStateManager.getPrep(prepId);
    if (freshPrep) {
      setCurrentPrep(freshPrep);
      setSelection(freshPrep.selection);

      // Calculate total subtopics
      const totalSubtopics = exam.topics.reduce((acc, topic) => 
        acc + topic.subTopics.length, 0
      );

      // Show notification with selection summary
      notification.success({
        message: 'תכולת המבחן עודכנה',
        description: `תכולת המבחן שלך שונתה לכלול ${freshPrep.selection.subTopics.length} תת-נושאים מתוך ${totalSubtopics}`,
        placement: 'topLeft',
        duration: 3,
      });
    }
    
    onClose();
  };

  // Handle confirming changes
  const handleConfirm = () => {
    if (!currentPrep) return;

    // Update prep state with new selection
    const updatedPrep = PrepStateManager.updateSelection(currentPrep, selection);
    setCurrentPrep(updatedPrep);
    
    handleClose();
  };

  // Calculate total stats
  const totalStats = exam.topics.reduce((acc, topic) => {
    const selectedInTopic = topic.subTopics.filter(st => isSubtopicSelected(st.id)).length;
    return {
      selectedTopics: acc.selectedTopics + (selectedInTopic > 0 ? 1 : 0),
      totalTopics: acc.totalTopics + 1,
      selectedSubtopics: acc.selectedSubtopics + selectedInTopic,
      totalSubtopics: acc.totalSubtopics + topic.subTopics.length
    };
  }, { selectedTopics: 0, totalTopics: 0, selectedSubtopics: 0, totalSubtopics: 0 });

  if (!currentPrep) return null;

  return (
    <Modal
      title={
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          margin: '-20px -24px 20px',
          borderBottom: '1px solid #e5e7eb',
          background: '#ffffff'
        }}>
          <div>
            <Title level={4} style={{ margin: 0, marginBottom: '8px', color: '#1e293b' }}>
              תכולת המבחן
            </Title>
            <Space size={4}>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                נושאים: <Text strong>{totalStats.selectedTopics}/{totalStats.totalTopics}</Text>
              </Text>
              <Text type="secondary">•</Text>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                תתי-נושאים: <Text strong>{totalStats.selectedSubtopics}/{totalStats.totalSubtopics}</Text>
              </Text>
            </Space>
          </div>
          <Space size={8}>
            <Button
              size="large"
              onClick={handleClose}
              style={{
                minWidth: '100px',
                height: '40px',
                borderRadius: '8px',
                fontWeight: 500,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            >
              ביטול
            </Button>
            <Button 
              type="primary"
              size="large"
              onClick={handleConfirm}
              style={{
                minWidth: '100px',
                height: '40px',
                borderRadius: '8px',
                fontWeight: 500,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
            >
              אישור
            </Button>
          </Space>
        </div>
      }
      open={open}
      closable={false}
      onCancel={handleClose}
      width={800}
      footer={null}
      bodyStyle={{ 
        maxHeight: 'calc(90vh - 120px)', 
        overflowY: 'auto', 
        padding: '16px 24px',
        background: '#f8fafc'
      }}
      className="exam-content-dialog"
    >
      {/* Topics Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {exam.topics.map((topic) => {
          const selectedSubtopicsCount = topic.subTopics.filter(
            st => isSubtopicSelected(st.id)
          ).length;

          return (
            <div key={topic.id} style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
              {/* Topic Header */}
              <div style={{ 
                marginBottom: '16px', 
                padding: '8px 12px',
                background: '#f3f4f6',
                borderRadius: '8px',
                borderLeft: '4px solid #3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOutlined style={{ color: '#3b82f6', fontSize: '16px' }} />
                  <Text style={{ 
                    fontSize: '16px', 
                    fontWeight: 600,
                    color: '#1f2937'
                  }}>
                    {topic.name}
                  </Text>
                </div>
                <Text style={{ color: '#6b7280' }}>
                  {selectedSubtopicsCount}/{topic.subTopics.length} נושאים נבחרו
                </Text>
              </div>

              {/* Subtopics Grid */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '12px',
                padding: '0 8px'
              }}>
                {topic.subTopics.map((subtopic) => {
                  const isSelected = isSubtopicSelected(subtopic.id);

                  return (
                    <div key={subtopic.id} style={{ position: 'relative' }}>
                      <Button
                        type="text"
                        onClick={() => handleToggleSubtopic(subtopic.id)}
                        style={{
                          width: '100%',
                          height: 'auto',
                          padding: '8px 12px',
                          textAlign: 'right',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          borderRadius: '6px',
                          transition: 'all 0.2s',
                          background: isSelected ? '#e0f2fe' : '#ffffff',
                          border: '1px solid',
                          borderColor: isSelected ? '#60a5fa' : '#e5e7eb',
                          position: 'relative'
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '8px',
                          width: '100%'
                        }}>
                          {isSelected ? (
                            <CheckCircleOutlined style={{ 
                              color: '#1e40af',
                              fontSize: '16px',
                              flexShrink: 0
                            }} />
                          ) : (
                            <MinusCircleOutlined style={{ 
                              color: '#9ca3af',
                              fontSize: '16px',
                              flexShrink: 0
                            }} />
                          )}
                          <Text 
                            style={{ 
                              fontSize: '14px',
                              color: isSelected ? '#1e40af' : '#4b5563',
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {subtopic.name}
                          </Text>
                        </div>
                      </Button>
                      {subtopic.description && (
                        <Tooltip title={subtopic.description} placement="left">
                          <InfoCircleOutlined style={{ 
                            position: 'absolute',
                            top: '-8px',
                            left: '-8px',
                            color: isSelected ? '#1e40af' : '#9ca3af',
                            fontSize: '14px',
                            background: '#ffffff',
                            borderRadius: '50%',
                            padding: '2px',
                            cursor: 'help',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            zIndex: 1
                          }} />
                        </Tooltip>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .exam-content-dialog .ant-modal-content {
          border-radius: 12px;
          overflow: hidden;
        }
        .ant-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border-color: #60a5fa !important;
          background: #f0f9ff !important;
        }
        .ant-btn {
          transition: all 0.2s ease;
        }
      `}</style>
    </Modal>
  );
}; 