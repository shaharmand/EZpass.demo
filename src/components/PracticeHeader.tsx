import React, { useState, useEffect } from 'react';
import { Typography, Button, Space, Spin, notification, Input, Tooltip } from 'antd';
import { EditOutlined, InfoCircleOutlined, SettingOutlined, BookOutlined } from '@ant-design/icons';
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
import { UserHeader } from './layout/UserHeader';
import { colors } from '../utils/feedbackStyles';
import './PracticeHeader.css';
import { JoinEZpassPlusDialog } from './dialogs/JoinEZpassPlusDialog';
import { BrandLogo } from './brand/BrandLogo';
import { UserProfile } from './user/UserProfile';

const { Text, Title } = Typography;

export interface PracticeHeaderProps {
  prep: StudentPrep;
  isLoading?: boolean;
  onPrepUpdate?: (prep: StudentPrep) => void;
}

/**
 * PracticeHeader - A composite component that combines UserHeader and PracticeHeaderProgress
 * for practice-related pages. Handles all practice header logic in one place.
 */
export const PracticeHeader: React.FC<PracticeHeaderProps> = ({
  prep,
  isLoading = false,
  onPrepUpdate
}) => {
  const { getPrep } = useStudentPrep();
  const { getCurrentAttempts, getMaxAttempts } = usePracticeAttempts();
  const { startPrep } = useStudentPrep();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [configOpen, setConfigOpen] = useState(false);
  const [examContentOpen, setExamContentOpen] = useState(false);
  const [joinEZpassPlusOpen, setJoinEZpassPlusOpen] = useState(false);
  const [localPrep, setLocalPrep] = useState<StudentPrep>(prep);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    setLocalPrep(prep);
  }, [prep]);

  const handleExamContentClose = () => {
    setExamContentOpen(false);
  };

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
    
    // Update in storage - use async/await properly
    const updateStorage = async () => {
      try {
        await PrepStateManager.updatePrep(updatedPrep);
        
        // Force a refresh of the prep state
        const freshPrep = await PrepStateManager.getPrep(prep.id);
        if (freshPrep) {
          setLocalPrep(freshPrep);
        }
        
        notification.success({
          message: 'שם המבחן עודכן',
          placement: 'topLeft',
          duration: 2,
        });
      } catch (error) {
        console.error('Error updating prep name:', error);
        notification.error({
          message: 'שגיאה בעדכון שם המבחן',
          placement: 'topLeft',
          duration: 2,
        });
      }
    };
    
    // Update local state immediately
    setLocalPrep(updatedPrep);
    setIsEditingName(false);
    setEditingName('');
    
    // Then update storage
    updateStorage();
  };

  const pageTitle = "תרגול שאלות";

  // Prepare the metrics content
  const metricsContent = isLoading ? (
    <Space>
      <Spin size="small" />
      <Text>טוען נתונים...</Text>
    </Space>
  ) : (
    <PracticeHeaderProgress 
      metrics={PrepStateManager.getHeaderMetrics(localPrep)}
      prep={localPrep}
      onShowTopicDetails={() => setExamContentOpen(true)}
      onPrepUpdate={async (updatedPrep: StudentPrep) => {
        // Force a refresh of the prep state
        const freshPrep = await PrepStateManager.getPrep(updatedPrep.id);
        if (freshPrep) {
          // Update the local prep state
          setLocalPrep(freshPrep);
          if (onPrepUpdate) {
            onPrepUpdate(freshPrep);
          }
        }
      }}
    />
  );

  return (
    <div className="practice-header-container">
      {/* User Header */}
      <UserHeader
        variant="practice"
        pageType="תרגול שאלות"
        pageContent={localPrep.exam.names?.full || pageTitle}
      />
      
      {/* Metrics Section */}
      <div style={{
        background: '#f8fafc',
        borderBottom: '1px solid #e5e7eb',
        width: '100%'
      }}>
        {metricsContent}
      </div>
      
      {/* Dialogs */}
      <PrepConfigDialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        prep={localPrep}
        onUpdate={(newName: string) => {
          // Handle name update
          const updatedPrep = {...localPrep, customName: newName};
          setLocalPrep(updatedPrep);
          if (onPrepUpdate) {
            onPrepUpdate(updatedPrep);
          }
        }}
      />
      
      <ExamContentDialog
        open={examContentOpen}
        onClose={handleExamContentClose}
        exam={localPrep.exam}
        prepId={localPrep.id}
      />
      
      <JoinEZpassPlusDialog
        open={joinEZpassPlusOpen}
        onClose={() => setJoinEZpassPlusOpen(false)}
      />
    </div>
  );
}; 