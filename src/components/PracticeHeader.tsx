import React, { useState, useEffect } from 'react';
import { Typography, Button, Space, Spin, notification, Input, Tooltip } from 'antd';
import { EditOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useStudentPrep } from '../contexts/StudentPrepContext';
import { usePracticeAttempts } from '../contexts/PracticeAttemptsContext';
import type { StudentPrep } from '../types/prepState';
import { PrepConfigDialog } from './practice/PrepConfigDialog';
import { ExamContentDialog } from './practice/ExamContentDialog';
import { ExamDatePicker } from './practice/ExamDatePicker';
import type { Question } from '../types/question';
import PracticeHeaderProgress from './PracticeHeaderProgress/PracticeHeaderProgress';
import { useNavigate } from 'react-router-dom';
import { PrepStateManager } from '../services/PrepStateManager';
import { useAuth } from '../contexts/AuthContext';
import type { ActivePracticeQuestion } from '../types/prepUI';
import { BaseHeader } from './base/BaseHeader';
import { colors } from '../utils/feedbackStyles';
import './PracticeHeader.css';
import { JoinEZpassPlusDialog } from './dialogs/JoinEZpassPlusDialog';

const { Text, Title } = Typography;

interface PracticeHeaderProps {
  prepId: string;
  question?: Question;
  currentQuestion?: ActivePracticeQuestion;
  onBack?: () => void;
  prep?: StudentPrep;
}

export const PracticeHeader: React.FC<PracticeHeaderProps> = ({
  prepId,
  question,
  currentQuestion,
  onBack,
  prep: initialPrep
}) => {
  const { getPrep } = useStudentPrep();
  const { getCurrentAttempts, getMaxAttempts } = usePracticeAttempts();
  const [prep, setPrep] = useState<StudentPrep | null>(initialPrep || null);
  const [isLoading, setIsLoading] = useState(false);
  const { startPrep } = useStudentPrep();
  const [configOpen, setConfigOpen] = useState(false);
  const navigate = useNavigate();
  const [examContentOpen, setExamContentOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [joinEZpassPlusOpen, setJoinEZpassPlusOpen] = useState(false);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    // If we have initialPrep, use it
    if (initialPrep) {
      setPrep(initialPrep);
      return;
    }

    const loadPrep = async () => {
      console.log('Loading prep state for ID:', prepId);
      // Get fresh prep state from storage
      const freshPrep = PrepStateManager.getPrep(prepId);
      console.log('Fresh prep state:', freshPrep ? 'found' : 'not found');
      
      if (freshPrep) {
        // Only update if the state has actually changed AND it's not during a topic selection update
        const shouldUpdate = !prep || 
            (freshPrep.state.status !== prep.state.status ||
            freshPrep.customName !== prep.customName ||
            ('activeTime' in freshPrep.state && 'activeTime' in prep.state && freshPrep.state.activeTime !== prep.state.activeTime) ||
            ('completedQuestions' in freshPrep.state && 'completedQuestions' in prep.state && freshPrep.state.completedQuestions !== prep.state.completedQuestions)) &&
            // Don't update if only the selection changed - this should be handled by handleExamContentClose
            JSON.stringify(freshPrep.selection.subTopics) === JSON.stringify(prep?.selection.subTopics);
            
        console.log('Should update prep state:', shouldUpdate, {
          reason: 'Selection change only',
          currentSelection: prep?.selection.subTopics.length,
          newSelection: freshPrep.selection.subTopics.length
        });
        
        if (shouldUpdate) {
          setPrep(freshPrep);
        }
      } else {
        console.log('No prep found in storage, trying context');
        // If not in storage, try getting from context
        const contextPrep = await getPrep(prepId);
        if (contextPrep) {
          console.log('Found prep in context, updating state');
          setPrep(contextPrep);
        }
      }
    };

    // Load initially
    loadPrep();

    // Refresh every 5 seconds if we don't have initialPrep
    const refreshInterval = setInterval(loadPrep, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [prepId, prep, getPrep, initialPrep]);

  if (!prep) return null;
  
  // Calculate topic counts
  const topicCount = prep.exam.topics?.length || 0;
  const subTopicCount = prep.exam.topics?.reduce(
    (count: number, topic) => count + (topic.subTopics?.length || 0), 
    0
  ) || 0;

  const currentAttempts = getCurrentAttempts();
  const maxAttempts = getMaxAttempts();

  const handleStartEditing = () => {
    setEditingName(prep?.customName || prep?.exam.names.medium || '');
    setIsEditingName(true);
  };

  const handleNameUpdate = (newName: string) => {
    if (!prep) return;
    
    const trimmedName = newName.trim();
    
    // Only update if the name has actually changed
    if (trimmedName === prep.customName) {
      setIsEditingName(false);
      setEditingName('');
      return;
    }

    const updatedPrep: StudentPrep = {
      ...prep,
      customName: trimmedName || null
    };
    
    // Update in storage
    PrepStateManager.updatePrep(updatedPrep);
    
    // Update local state
    setPrep(updatedPrep);
    setIsEditingName(false);
    setEditingName('');

    // Force a refresh of the prep state
    setTimeout(() => {
      const freshPrep = PrepStateManager.getPrep(prep.id);
      if (freshPrep) {
        setPrep(freshPrep);
      }
    }, 0);

    notification.success({
      message: 'שם המבחן עודכן',
      placement: 'topLeft',
      duration: 2,
    });
  };

  // Remove the sync effect as it's causing issues with state updates
  useEffect(() => {
    if (initialPrep) {
      setPrep(initialPrep);
    }
  }, [initialPrep]);

  // Force refresh prep state when exam content dialog closes
  const handleExamContentClose = () => {
    console.log('PracticeHeader - Dialog closing, current state:', {
      currentSelection: prep?.selection.subTopics.length
    });

    // Force an immediate refresh
    const freshPrep = PrepStateManager.getPrep(prepId);
    if (freshPrep) {
      console.log('PracticeHeader - Immediate refresh:', {
        oldSelection: prep?.selection.subTopics.length,
        newSelection: freshPrep.selection.subTopics.length,
        selectionChanged: prep?.selection.subTopics.length !== freshPrep.selection.subTopics.length
      });

      // Always update the prep state to ensure re-render
      setPrep(freshPrep);
      
      // Show notification if selection changed
      if (prep?.selection.subTopics.length !== freshPrep.selection.subTopics.length) {
        const totalSubtopics = freshPrep.exam.topics.reduce((acc, topic) => 
          acc + topic.subTopics.length, 0
        );

        notification.success({
          message: 'תכולת המבחן עודכנה',
          description: `תכולת המבחן שלך שונתה לכלול ${freshPrep.selection.subTopics.length} תת-נושאים מתוך ${totalSubtopics}`,
          placement: 'topLeft',
          duration: 3,
        });
      }
    }

    // Force a re-render after a short delay to ensure state is updated
    setTimeout(() => {
      const verifyPrep = PrepStateManager.getPrep(prepId);
      if (verifyPrep) {
        console.log('PracticeHeader - Verify state after close:', {
          selection: verifyPrep.selection.subTopics.length,
          storageState: localStorage.getItem('active_preps')
        });
        setPrep(verifyPrep);
      }
    }, 0);

    setExamContentOpen(false);
  };

  const topRowContent = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      gap: '32px'
    }}>
      {/* Exam Name Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        paddingRight: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {isEditingName ? (
            <Input
              autoFocus
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onPressEnter={() => handleNameUpdate(editingName)}
              onBlur={() => handleNameUpdate(editingName)}
              style={{
                fontSize: '20px',
                width: '300px',
                height: '40px'
              }}
              placeholder="הכנס שם אישי למבחן..."
            />
          ) : (
            <>
              <Title level={4} style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
                color: '#1e293b',
                maxWidth: '400px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {prep.customName || prep.exam.names.medium}
              </Title>
              <Tooltip title="שנה שם מבחן">
                <Button
                  type="text"
                  icon={<EditOutlined style={{ fontSize: '15px', color: '#64748b' }} />}
                  onClick={handleStartEditing}
                  style={{
                    padding: '4px',
                    height: '32px',
                    width: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '4px'
                  }}
                />
              </Tooltip>
            </>
          )}
        </div>
        {prep.customName && (
          <Text style={{
            color: '#64748b',
            fontSize: '13px',
            marginTop: '4px'
          }}>
            {prep.exam.names.medium}
          </Text>
        )}
      </div>

      {/* Right Side - Premium Features */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        borderRight: '1px solid #e5e7eb',
        paddingRight: '20px',
        height: '40px',
        borderRightColor: '#e2e8f0'
      }}>
        {/* Attempts Counter */}
        <Tooltip title="משובים מלאים שנותרו היום">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#f8fafc',
            padding: '4px 12px',
            borderRadius: '20px',
            border: '1px solid #e2e8f0'
          }}>
            <Text style={{ 
              color: '#475569', 
              fontSize: '13px',
              fontWeight: 600,
              lineHeight: '1'
            }}>
              {currentAttempts}/{maxAttempts}
            </Text>
            <InfoCircleOutlined style={{ 
              fontSize: '14px',
              color: '#64748b',
              transition: 'color 0.2s ease'
            }} />
          </div>
        </Tooltip>

        {/* EZPass+ Button */}
        <Button 
          type="primary"
          onClick={() => setJoinEZpassPlusOpen(true)}
          style={{
            backgroundColor: '#f59e0b',
            borderColor: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: '40px',
            padding: '0 24px',
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: '20px',
            boxShadow: '0 2px 4px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f97316';
            e.currentTarget.style.borderColor = '#f97316';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f59e0b';
            e.currentTarget.style.borderColor = '#f59e0b';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
          }}
        >
          <span style={{ 
            fontSize: '18px', 
            marginRight: '-2px',
            background: 'rgba(255, 255, 255, 0.2)',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px'
          }}>+</span>
          איזיפס
        </Button>
      </div>
    </div>
  );

  const metricsContent = isLoading ? (
    <Space>
      <Spin size="small" />
      <Text>טוען נתונים...</Text>
    </Space>
  ) : (
    <PracticeHeaderProgress 
      metrics={PrepStateManager.getHeaderMetrics(prep)}
      prep={prep}
      onShowTopicDetails={() => setExamContentOpen(true)}
    />
  );

  const pageTitle = "תרגול שאלות";

  return (
    <>
      <BaseHeader
        variant="practice"
        pageTitle={pageTitle}
        topRowContent={topRowContent}
        showMetricsRow
        metricsContent={metricsContent}
      />
      
      <ExamContentDialog
        open={examContentOpen}
        onClose={handleExamContentClose}
        exam={prep.exam}
        prepId={prep.id}
      />

      <PrepConfigDialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        prep={prep}
      />

      <JoinEZpassPlusDialog
        open={joinEZpassPlusOpen}
        onClose={() => setJoinEZpassPlusOpen(false)}
      />
    </>
  );
}; 