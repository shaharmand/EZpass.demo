import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Typography, Button, Tooltip, Space, notification, message } from 'antd';
import styled from 'styled-components';
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
import { useStudentPrep } from '../../contexts/StudentPrepContext';

const { Text, Title } = Typography;

const TopicHeader = styled.div`
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 8px;
  border-right: 4px solid #3b82f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

interface ExamContentDialogProps {
  exam: ExamTemplate;
  open: boolean;
  onClose: () => void;
  prepId: string;
  onPrepUpdate?: (updatedPrep: StudentPrep) => void;
}

interface TopicCounts {
  mainTopics: { selected: number; total: number };
  subtopics: { selected: number; total: number };
}

export const ExamContentDialog: React.FC<ExamContentDialogProps> = ({
  exam,
  open,
  onClose,
  prepId,
  onPrepUpdate
}) => {
  const [currentPrep, setCurrentPrep] = useState<StudentPrep | null>(null);
  const [selection, setSelection] = useState<TopicSelection>({ subTopics: [] });
  const { startPrep } = useStudentPrep();

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
    
    // Only update local state, don't save yet
    setSelection({ subTopics: newSelection });
  };

  // Handle confirming changes
  const handleConfirm = () => {
    if (!currentPrep) {
      console.error('Failed to confirm changes: No current prep available');
      return;
    }

    console.log('ExamContentDialog: Confirming changes', {
      oldSelectionCount: PrepStateManager.getSelectedTopicsCount(currentPrep),
      newSelectionCount: selection.subTopics.length,
      timestamp: new Date().toISOString()
    });

    // Create a new TopicSelection object with the selected subtopics
    const newSelection: TopicSelection = {
      subTopics: selection.subTopics
    };

    // Update the selection using PrepStateManager
    try {
      const updatedPrep = PrepStateManager.updateSelection(currentPrep.id, newSelection);
      
      // Update local state with the fresh prep
      setCurrentPrep(updatedPrep);
      
      // Notify parent about the update
      if (onPrepUpdate) {
        onPrepUpdate(updatedPrep);
      }
    } catch (error) {
      console.error('Failed to update selection:', error);
      // You might want to show an error message to the user here
    }
    
    // Close the dialog
    onClose();
  };

  // Calculate total stats using PrepStateManager
  const topicCounts = useMemo<TopicCounts>(() => {
    if (!currentPrep) return { mainTopics: { selected: 0, total: 0 }, subtopics: { selected: 0, total: 0 } };
    return PrepStateManager.getTopicCountsByType(currentPrep);
  }, [currentPrep]);

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
                נושאים: <Text strong>{topicCounts.mainTopics.selected}/{topicCounts.mainTopics.total}</Text>
              </Text>
              <Text type="secondary">•</Text>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                תתי-נושאים: <Text strong>{topicCounts.subtopics.selected}/{topicCounts.subtopics.total}</Text>
              </Text>
            </Space>
          </div>
          <Space size={8}>
            <Button
              size="large"
              onClick={onClose}
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
              disabled={topicCounts.subtopics.selected === 0}
            >
              אישור
            </Button>
          </Space>
        </div>
      }
      open={open}
      closable={false}
      onCancel={onClose}
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
        {exam.topics.map((topic) => (
          <div key={topic.id} style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}>
            <TopicHeader>
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
                {topic.subTopics.length} נושאים
              </Text>
            </TopicHeader>
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
                        <Text style={{
                          color: isSelected ? '#1e40af' : '#4b5563',
                          fontWeight: isSelected ? 500 : 400
                        }}>
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
        ))}
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