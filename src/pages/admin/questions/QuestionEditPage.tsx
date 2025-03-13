import React, { useState, useEffect, FC, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Space, Typography, Button, message, Tag, Divider, Tooltip } from 'antd';
import { 
  Question, 
  DatabaseQuestion,
  ValidationStatus,
  PublicationStatusEnum,
  ReviewStatusEnum,
  SaveQuestion,
  QuestionType
} from '../../../types/question';
import { ValidationResult, ValidationError, ValidationWarning, validateQuestion } from '../../../utils/questionValidator';
import { questionStorage } from '../../../services/admin/questionStorage';
import { questionLibrary } from '../../../services/questionLibrary';
import { useAdminPage } from '../../../contexts/AdminPageContext';
import { getEnumTranslation } from '../../../utils/translations';
import { 
  FileTextOutlined, 
  EditOutlined, 
  WarningOutlined,
  LeftOutlined,
  RightOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { QuestionContentSection } from '../components/questions/editor/content/Content';
import { QuestionContentSectionHandle } from '../components/questions/editor/content/Content';
import { QuestionStatusHeader } from '../components/questions/editor/content/QuestionStatusHeader';
import styled from 'styled-components';
import { QuestionEditorContainer } from '../../../components/question/editor/QuestionEditorContainer';
import { universalTopicsV2 } from '../../../services/universalTopics';
import { Domain } from '../../../types/subject';
import { useSearchResults } from '../../../contexts/SearchResultsContext';

const { Title, Text } = Typography;

// Styled Components
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px 80px;
`;

const ValidationSection = styled.div`
  padding: 16px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const ValidationMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
`;

const ValidationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 12px;
  padding: 8px;
  background: white;
  border-radius: 6px;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px;
  background: #fafafa;
  border-radius: 8px;
  
  > * {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
`;

const ContentSection = styled(Card)`
  margin-bottom: 0;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  
  .ant-card-head {
    border-bottom: 2px solid #f0f0f0;
    padding: 0 24px;
    min-height: 48px;
    background: #fafafa;
    border-radius: 8px 8px 0 0;
  }
  
  .ant-card-head-title {
    font-size: 16px;
    font-weight: 500;
  }
  
  .ant-card-body {
    padding: 24px;
    background: white;
  }
`;

const JsonSection = styled(ContentSection)`
  direction: ltr;
  text-align: left;
  opacity: 0.85;
  
  .ant-card-head {
    background: #f5f5f5;
  }
  
  .ant-card-body {
    background: #fafafa;
    font-family: monospace;
    font-size: 13px;
  }
`;

const HeaderCard = styled(Card)`
  .ant-card-body {
    padding: 16px;
    background: #fff;
  }
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const NavigationGroup = styled(Space.Compact)`
  direction: rtl;
  .ant-btn {
    margin: 0;
  }
`;

const HeaderActions = styled(Space)`
  .ant-btn {
    min-width: 100px;
    height: 32px;
  }

  .publish-button.ant-btn-primary {
    background-color: #52c41a;
    
    &:hover {
      background-color: #73d13d !important;
    }
    
    &:active {
      background-color: #389e0d !important;
    }
  }
`;

const ActionButtons = styled(Space)`
  gap: 8px;
  
  .ant-btn {
    min-width: 90px;
  }
`;

const PageTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  .question-id {
    font-size: 14px;
    color: #1677ff;
    background: #e6f4ff;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid #91caff;
  }
  
  .position {
    color: #666;
    font-size: 14px;
    margin-left: 8px;
  }
`;

const EditActionBar = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  
  .action-bar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .unsaved-changes {
    color: #faad14;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    
    .anticon {
      font-size: 16px;
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;

    .ant-btn {
      min-width: 90px;
      height: 32px;
      
      &[type="primary"] {
        background: #1677ff;
        
        &:not(:disabled):hover {
          background: #4096ff;
        }
      }
    }
  }
`;

const EditableContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  padding: 16px;
  margin-bottom: 32px;
  
  > ${EditActionBar} {
    margin: 0 0 16px;
  }
`;

interface QuestionEditPageProps {
  question: DatabaseQuestion;
  onSave: (data: SaveQuestion) => Promise<void>;
  onCancel: () => void;
}

export const QuestionEditPage: React.FC<QuestionEditPageProps> = ({
  question,
  onSave,
  onCancel
}) => {
  const [isModified, setIsModified] = useState(false);
  const navigate = useNavigate();
  const { setPageIdentity } = useAdminPage();
  const [updatedQuestion, setUpdatedQuestion] = useState(question);
  const { searchResults } = useSearchResults();
  
  // Add navigation state
  const [currentPosition, setCurrentPosition] = useState({ current: 1, filteredTotal: 0 });
  const [hasPrevious, setHasPrevious] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  // Load navigation state from search results
  useEffect(() => {
    if (searchResults) {
      const currentIndex = searchResults.findIndex((q: DatabaseQuestion) => q.id === question.id);
      if (currentIndex !== -1) {
        setCurrentPosition({
          current: currentIndex + 1,
          filteredTotal: searchResults.length
        });
        setHasPrevious(currentIndex > 0);
        setHasNext(currentIndex < searchResults.length - 1);
      }
    }
  }, [question.id, searchResults]);

  const handlePrevious = () => {
    if (hasPrevious && searchResults) {
      const currentIndex = searchResults.findIndex((q: DatabaseQuestion) => q.id === question.id);
      if (currentIndex > 0) {
        navigate(`/admin/questions/${searchResults[currentIndex - 1].id}`);
      }
    }
  };

  const handleNext = () => {
    if (hasNext && searchResults) {
      const currentIndex = searchResults.findIndex((q: DatabaseQuestion) => q.id === question.id);
      if (currentIndex < searchResults.length - 1) {
        navigate(`/admin/questions/${searchResults[currentIndex + 1].id}`);
      }
    }
  };

  // Set page identity when question loads or changes
  useEffect(() => {
    if (question) {
      const subject = universalTopicsV2.getSubjectSafe(question.data.metadata.subjectId);
      const domain = universalTopicsV2.getDomainSafe(question.data.metadata.subjectId, question.data.metadata.domainId);
      const questionType = getEnumTranslation('questionType', question.data.metadata.type);
      
      setPageIdentity({
        title: `עריכת שאלה ${question.id}`,
        subtitle: `${subject?.name || question.data.metadata.subjectId} › ${domain?.name || question.data.metadata.domainId} › ${questionType}`
      });
    }
    
    // Clear identity when unmounting
    return () => setPageIdentity(null);
  }, [question, setPageIdentity]);

  const handleSave = async (data: SaveQuestion) => {
    try {
      await onSave(data);
      setIsModified(false);
      message.success('השאלה נשמרה בהצלחה');
    } catch (error) {
      console.error('Failed to save question:', error);
      message.error('שגיאה בשמירת השאלה');
    }
  };

  const handleCancel = () => {
    setIsModified(false);
    onCancel();
  };

  const handleQuestionUpdated = (updated: DatabaseQuestion) => {
    setUpdatedQuestion(updated);
  };

  return (
    <PageContainer>
      <QuestionEditorContainer
        question={updatedQuestion}
        onSave={handleSave}
        onQuestionUpdated={handleQuestionUpdated}
        onNavigateBack={() => navigate('/admin/questions')}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        currentPosition={currentPosition}
      />
    </PageContainer>
  );
}; 