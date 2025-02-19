import React from 'react';
import { Card, Space, Button, Typography } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Question } from '../../types/question';
import type { QuestionState } from '../../types/practice';
import QuestionContent from '../QuestionContent';
import QuestionActions from './QuestionActions';

const { Text } = Typography;

interface PracticeQuestionDisplayProps {
  question: Question;
  state: QuestionState;
  onHelp: (action: string) => void;
  onSkip: (reason: 'too_hard' | 'too_easy' | 'not_in_material') => Promise<void>;
}

const formatQuestionId = (id: string): string => {
  const shortId = id.slice(-5).padStart(5, '0').toUpperCase();
  return `EZ-${shortId}`;
};

const PracticeQuestionDisplay: React.FC<PracticeQuestionDisplayProps> = ({
  question,
  state,
  onHelp,
  onSkip
}) => {
  const navigate = useNavigate();
  const isLoading = state.status === 'loading';
  const isDisabled = isLoading || state.status === 'submitted' || state.status === 'completed';

  return (
    <div className="practice-question-container" style={{ 
      padding: '24px',
      opacity: isLoading ? 0.7 : 1,
      transition: 'opacity 0.2s ease-in-out'
    }}>
      <Card className="practice-question-card">
        {/* Header with ID, navigation, and actions all in one row */}
        <div className="question-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          minHeight: '40px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text strong style={{ fontSize: '16px' }}>שאלה</Text>
            <Button 
              type="link"
              onClick={() => navigate(`/questions/${question.id}`)}
              disabled={isLoading}
              style={{ 
                padding: '0 4px',
                height: '40px',
                fontSize: '15px'
              }}
            >
              <Space>
                <Text type="secondary" style={{ fontSize: '15px' }}>{formatQuestionId(question.id)}</Text>
                <LinkOutlined style={{ fontSize: '15px' }} />
              </Space>
            </Button>
          </div>

          {/* Actions (Help & Skip) */}
          <QuestionActions 
            onHelp={onHelp}
            onSkip={onSkip}
            disabled={isDisabled}
          />
        </div>

        {/* Question Content */}
        <QuestionContent 
          content={question.content.text}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
};

export default PracticeQuestionDisplay; 