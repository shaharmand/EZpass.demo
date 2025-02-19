import React from 'react';
import { Button, Dropdown, Space } from 'antd';
import type { MenuProps } from 'antd';
import { 
  ToolOutlined, 
  InfoCircleOutlined, 
  BulbOutlined, 
  QuestionCircleOutlined, 
  BookOutlined,
  UpCircleOutlined,
  DownCircleOutlined,
  CloseCircleOutlined,
  DoubleRightOutlined
} from '@ant-design/icons';

interface QuestionActionsProps {
  onHelp?: (action: string) => void;
  onSkip?: (reason: 'too_hard' | 'too_easy' | 'not_in_material') => Promise<void>;
  disabled?: boolean;
}

const QuestionActions: React.FC<QuestionActionsProps> = ({
  onHelp,
  onSkip,
  disabled = false
}) => {
  const helpMenuItems: MenuProps['items'] = [
    {
      key: 'explanation',
      icon: <InfoCircleOutlined style={{ color: '#3b82f6' }} />,
      label: 'הסבר שאלה',
      disabled: disabled,
      onClick: () => onHelp?.('explanation')
    },
    {
      key: 'guidance',
      icon: <BulbOutlined style={{ color: '#f59e0b' }} />,
      label: 'הנחיה לפתרון',
      disabled: disabled,
      onClick: () => onHelp?.('guidance')
    },
    {
      key: 'stuck',
      icon: <QuestionCircleOutlined style={{ color: '#ef4444' }} />,
      label: 'נתקעתי',
      disabled: disabled,
      onClick: () => onHelp?.('stuck')
    },
    {
      key: 'teach',
      icon: <BookOutlined style={{ color: '#8b5cf6' }} />,
      label: 'למד אותי לפתור',
      disabled: disabled,
      onClick: () => onHelp?.('teach')
    }
  ];

  const skipMenuItems: MenuProps['items'] = [
    {
      key: 'too_hard',
      icon: <UpCircleOutlined style={{ color: '#ef4444' }} />,
      label: 'קשה מדי',
      disabled: disabled,
      onClick: () => onSkip?.('too_hard')
    },
    {
      key: 'too_easy',
      icon: <DownCircleOutlined style={{ color: '#22c55e' }} />,
      label: 'קל מדי',
      disabled: disabled,
      onClick: () => onSkip?.('too_easy')
    },
    {
      key: 'not_in_material',
      icon: <CloseCircleOutlined style={{ color: '#6b7280' }} />,
      label: 'לא בחומר',
      disabled: disabled,
      onClick: () => onSkip?.('not_in_material')
    }
  ];

  return (
    <Space size="middle" style={{ marginLeft: 'auto' }}>
      <Dropdown menu={{ items: helpMenuItems }} disabled={disabled}>
        <Button 
          icon={<ToolOutlined />}
          style={{ 
            borderColor: '#1890ff',
            color: '#1890ff',
            height: '40px',
            fontSize: '15px'
          }}
        >
          עזרה
        </Button>
      </Dropdown>
      <Dropdown menu={{ items: skipMenuItems }} disabled={disabled}>
        <Button
          style={{ 
            borderColor: '#1890ff',
            color: '#1890ff',
            height: '40px',
            fontSize: '15px'
          }}
        >
          <Space>
            דלג
            <DoubleRightOutlined style={{ 
              fontSize: '15px',
              transform: 'rotate(180deg)' // Flip the icon for RTL
            }} />
          </Space>
        </Button>
      </Dropdown>
    </Space>
  );
};

export default QuestionActions; 