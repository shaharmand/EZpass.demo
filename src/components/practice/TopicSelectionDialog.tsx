import React, { useEffect } from 'react';
import { Modal, Typography, Button, Tooltip } from 'antd';
import { 
  InfoCircleOutlined,
  BookOutlined
} from '@ant-design/icons';
import type { ExamTemplate } from '../../types/examTemplate';
import type { FilterState, Question } from '../../types/question';
import type { SkipReason } from '../../types/prepUI';

const { Text } = Typography;

interface TopicSelectionDialogProps {
  exam: ExamTemplate;
  open: boolean;
  onClose: () => void;
  currentFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  currentQuestion?: Question;
  onSkip?: (reason: SkipReason, filters: FilterState) => void;
}

export const TopicSelectionDialog: React.FC<TopicSelectionDialogProps> = ({
  exam,
  open,
  onClose,
  currentFilters,
  onFilterChange,
  currentQuestion,
  onSkip
}) => {
  // Helper function to check if a subtopic is focused
  const isSubtopicFocused = (subtopicId: string) => 
    currentFilters.subTopics?.length === 1 && currentFilters.subTopics[0] === subtopicId;

  // Handle focusing on a subtopic
  const handleFocusSubtopic = async (subtopicId: string) => {
    try {
      console.log('FORCE LOG - TopicSelectionDialog handleFocusSubtopic:', {
        subtopicId,
        currentQuestionSubtopic: currentQuestion?.metadata.subtopicId,
        currentFilters,
        timestamp: new Date().toISOString()
      });

      // Create new filters with the selected subtopic
      const updatedFilters = { ...currentFilters, subTopics: [subtopicId] };

      // Update filters first
      onFilterChange(updatedFilters);

      // If this is a different subtopic than the current question's subtopic
      if (currentQuestion && currentQuestion.metadata.subtopicId !== subtopicId) {
        console.log('FORCE LOG - TopicSelectionDialog initiating skip:', {
          reason: 'filter_change',
          updatedFilters,
          timestamp: new Date().toISOString()
        });

        // Skip with updated filters and wait for it to complete
        if (onSkip) {
          await onSkip('filter_change', updatedFilters);
          console.log('FORCE LOG - TopicSelectionDialog skip completed');
        } else {
          console.warn('FORCE LOG - TopicSelectionDialog onSkip not provided');
        }
      }

      // Close dialog last
      onClose();
    } catch (error) {
      console.error('FORCE LOG - TopicSelectionDialog error:', error);
    }
  };

  // Handle selecting all topics
  const handleSelectAllTopics = () => {
    // Remove subTopics filter to show all topics
    const { subTopics, ...updatedFilters } = currentFilters;
    
    // Update filters first
    onFilterChange(updatedFilters);
    
    // Close dialog last
    onClose();
  };

  // When dialog opens, if no subtopic is focused, select "all topics"
  useEffect(() => {
    if (open && currentFilters.subTopics?.length !== 1) {
      const { subTopics, ...updatedFilters } = currentFilters;
      onFilterChange(updatedFilters);
    }
  }, [open]);

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <Text style={{ fontSize: '16px', fontWeight: 500 }}>
            בחר תת-נושא על מנת להתמקד בו בתרגול
          </Text>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={800}
      footer={null}
      bodyStyle={{ 
        maxHeight: 'calc(90vh - 120px)', 
        overflowY: 'auto', 
        padding: '16px 24px',
        background: '#f8fafc' // Light gray background for the whole dialog
      }}
      className="topic-selection-dialog"
    >
      {/* All Topics Option */}
      <Button
        type="default"
        onClick={handleSelectAllTopics}
        style={{
          width: '100%',
          marginBottom: '24px',
          height: 'auto',
          padding: '12px',
          textAlign: 'center',
          borderRadius: '8px',
          background: !currentFilters.subTopics?.length ? '#3b82f6' : '#ffffff',
          borderColor: !currentFilters.subTopics?.length ? '#3b82f6' : '#d1d5db',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Text strong style={{ 
          fontSize: '15px',
          color: !currentFilters.subTopics?.length ? '#ffffff' : '#4b5563'
        }}>
          ללא מיקוד - תרגל בכל הנושאים
        </Text>
      </Button>

      {/* Topics Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {exam.topics.map((topic) => (
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
              gap: '8px'
            }}>
              <BookOutlined style={{ color: '#3b82f6', fontSize: '16px' }} />
              <Text style={{ 
                fontSize: '16px', 
                fontWeight: 600,
                color: '#1f2937'
              }}>
                {topic.name}
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
                const isFocused = isSubtopicFocused(subtopic.id);

                return (
                  <div key={subtopic.id} style={{ position: 'relative' }}>
                    <Button
                      type="text"
                      onClick={() => handleFocusSubtopic(subtopic.id)}
                      style={{
                        width: '100%',
                        height: 'auto',
                        padding: '8px 12px',
                        textAlign: 'right',
                        display: 'block',
                        borderRadius: '6px',
                        transition: 'all 0.2s',
                        background: isFocused ? '#e0f2fe' : '#ffffff',
                        border: '1px solid',
                        borderColor: isFocused ? '#60a5fa' : '#e5e7eb'
                      }}
                    >
                      <Text style={{ 
                        fontSize: '14px',
                        color: isFocused ? '#1e40af' : '#4b5563',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {subtopic.name}
                      </Text>
                    </Button>
                    {subtopic.description && (
                      <Tooltip title={subtopic.description} placement="left">
                        <InfoCircleOutlined style={{ 
                          position: 'absolute',
                          top: '-8px',
                          left: '-8px',
                          color: isFocused ? '#1e40af' : '#9ca3af',
                          fontSize: '14px',
                          background: '#ffffff',
                          borderRadius: '50%',
                          padding: '2px',
                          cursor: 'help',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
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
        .topic-selection-dialog .ant-modal-content {
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