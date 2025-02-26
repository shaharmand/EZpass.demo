import React from 'react';
import { Button, Space, Tooltip, Dropdown, Typography } from 'antd';
import { 
  QuestionCircleOutlined, 
  ArrowLeftOutlined,
  MoreOutlined,
  ForwardOutlined,
  ThunderboltOutlined,
  StopOutlined,
  BulbOutlined,
  ReadOutlined,
  CheckOutlined,
  BookOutlined
} from '@ant-design/icons';
import { logger } from '../../utils/logger';
import './QuestionActions.css';

const { Text } = Typography;

interface QuestionActionsProps {
  onHelp: (type: string) => void;
  onSkip?: (reason: 'too_hard' | 'too_easy' | 'not_in_material') => void;
  onNext?: () => void;
  disabled?: boolean;
  showNext?: boolean;
}

const QuestionActions: React.FC<QuestionActionsProps> = ({
  onHelp,
  onSkip,
  onNext,
  disabled,
  showNext
}) => {
  const handleHelp = (type: string) => {
    logger.info('User clicked help option', { type });
    onHelp(type);
  };

  const handleSkip = async (reason: 'too_hard' | 'too_easy' | 'not_in_material') => {
    logger.info('User clicked skip button', { reason });
    await onSkip?.(reason);
  };

  const handleNext = () => {
    logger.info('User clicked next button');
    onNext?.();
  };

  const helpItems = [
    {
      key: 'hint',
      icon: <BulbOutlined style={{ color: '#2563eb' }} />,
      label: 'רמז'
    },
    {
      key: 'explanation',
      icon: <ReadOutlined style={{ color: '#2563eb' }} />,
      label: 'הסבר'
    },
    {
      key: 'solution',
      icon: <CheckOutlined style={{ color: '#2563eb' }} />,
      label: 'פתרון מלא'
    },
    {
      key: 'resources',
      icon: <BookOutlined style={{ color: '#2563eb' }} />,
      label: 'חומר עזר'
    }
  ];

  const skipItems = [
    {
      key: 'too_hard',
      icon: <ThunderboltOutlined style={{ color: '#ef4444' }} />,
      label: <Text style={{ color: '#ef4444' }}>קשה מדי</Text>
    },
    {
      key: 'too_easy',
      icon: <ForwardOutlined style={{ color: '#10b981' }} />,
      label: <Text style={{ color: '#10b981' }}>קל מדי</Text>
    },
    {
      key: 'not_in_material',
      icon: <StopOutlined style={{ color: '#6b7280' }} />,
      label: <Text style={{ color: '#6b7280' }}>לא בתוכן המבחן</Text>
    }
  ];

  return (
    <div className="action-buttons">
      <Space size="small">
        <Dropdown
          menu={{
            items: helpItems,
            onClick: ({ key }) => handleHelp(key)
          }}
          disabled={disabled}
        >
          <Button 
            icon={<QuestionCircleOutlined />}
            type="text"
            className="action-button"
          >
            עזרה
          </Button>
        </Dropdown>

        {onSkip && !showNext && (
          <Dropdown
            menu={{
              items: skipItems,
              onClick: ({ key }) => handleSkip(key as any)
            }}
            disabled={disabled}
          >
            <Button
              type="text"
              className="action-button"
              icon={<MoreOutlined />}
            >
              דלג
            </Button>
          </Dropdown>
        )}
        
        {showNext && onNext && (
          <Button
            type="text"
            onClick={handleNext}
            icon={<ArrowLeftOutlined />}
            className="action-button"
          >
            הבא
          </Button>
        )}
      </Space>

      <style>
        {`
          .action-buttons {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .action-button {
            color: #4b5563;
            font-size: 14px;
            height: 32px;
            padding: 0 12px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: all 0.2s ease;
          }

          .action-button:hover {
            color: #2563eb;
            background: #f0f9ff;
          }
        `}
      </style>
    </div>
  );
};

export default QuestionActions; 