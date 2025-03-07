import React from 'react';
import { Button, Dropdown, Tooltip } from 'antd';
import { 
  ArrowLeftOutlined,
  ArrowRightOutlined, 
  QuestionCircleOutlined,
  SendOutlined,
  BulbOutlined,
  ReadOutlined,
  SolutionOutlined,
  BookOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  ForwardOutlined,
  StopOutlined,
  StepBackwardOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { SkipReason } from '../../types/prepUI';
import './AnsweringActionBar.css';

export interface AnsweringActionBarProps {
  onSubmit: () => void;
  onSkip: (reason: SkipReason) => void;
  onHelp: (type: 'explain_question' | 'guide_solution' | 'hint' | 'show_solution' | 'learning_materials') => void;
  disabled?: boolean;
}

const helpItems: MenuProps['items'] = [
  {
    key: 'explain_question',
    label: 'הסבר שאלה',
    icon: <ExclamationCircleOutlined style={{ color: '#2563eb' }} />,
  },
  {
    key: 'guide_solution',
    label: 'מדריך לפתרון',
    icon: <ReadOutlined style={{ color: '#2563eb' }} />,
  },
  {
    key: 'hint',
    label: 'תקוע? קבל רמז',
    icon: <BulbOutlined style={{ color: '#2563eb' }} />,
  },
  {
    key: 'show_solution',
    label: 'הצג פתרון',
    icon: <SolutionOutlined style={{ color: '#2563eb' }} />,
  },
  {
    key: 'learning_materials',
    label: 'חומרי לימוד',
    icon: <BookOutlined style={{ color: '#2563eb' }} />,
  },
];

const skipItems: MenuProps['items'] = [
  {
    key: 'too_hard',
    label: 'קשה מדי',
    icon: <ThunderboltOutlined style={{ color: '#ef4444' }} />,
  },
  {
    key: 'too_easy',
    label: 'קל מדי',
    icon: <ForwardOutlined style={{ color: '#10b981' }} />,
  },
  {
    key: 'not_in_material',
    label: 'לא בחומר הלימוד',
    icon: <StopOutlined style={{ color: '#6b7280' }} />,
  },
];

export const AnsweringActionBar: React.FC<AnsweringActionBarProps> = ({
  onSubmit,
  onSkip,
  onHelp,
  disabled = false
}) => {
  return (
    <div className="answering-action-bar">
      <div className="answering-action-buttons-container">
        <div className="action-buttons-right">
          <Dropdown 
            menu={{ 
              items: helpItems, 
              onClick: ({ key }) => onHelp(key as 'explain_question' | 'guide_solution' | 'hint' | 'show_solution' | 'learning_materials')
            }} 
            placement="topRight"
            trigger={['click']}
          >
            <button className="help-button">
              <QuestionCircleOutlined />
              עזרה
            </button>
          </Dropdown>
          <Dropdown 
            menu={{ 
              items: skipItems, 
              onClick: ({ key }) => onSkip(key as SkipReason)
            }} 
            placement="topRight"
            trigger={['click']}
          >
            <button className="skip-button">
              <StepBackwardOutlined />
              דלג
            </button>
          </Dropdown>
        </div>
        <div className="action-buttons-left">
          <button
            className="answering-action-button answering-submit-button"
            onClick={onSubmit}
            disabled={disabled}
          >
            הגש תשובה
            <ArrowLeftOutlined className="answering-button-icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnsweringActionBar; 