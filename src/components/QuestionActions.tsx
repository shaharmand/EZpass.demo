import React from 'react';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { 
  QuestionCircleOutlined, 
  DoubleLeftOutlined,
  BulbOutlined,
  ReadOutlined,
  CheckOutlined,
  BookOutlined
} from '@ant-design/icons';

interface QuestionActionsProps {
  onNext?: () => void;
  onHelp?: (action: string) => void;
}

const QuestionActions: React.FC<QuestionActionsProps> = ({ 
  onNext,
  onHelp
}) => {
  const helpMenuItems: MenuProps['items'] = [
    {
      key: 'hint',
      icon: <BulbOutlined style={{ color: '#2563eb' }} />,
      label: <span style={{ color: '#2563eb' }}>רמז</span>,
      onClick: () => onHelp?.('hint')
    },
    {
      key: 'explanation',
      icon: <ReadOutlined style={{ color: '#2563eb' }} />,
      label: <span style={{ color: '#2563eb' }}>הסבר</span>,
      onClick: () => onHelp?.('explanation')
    },
    {
      key: 'solution',
      icon: <CheckOutlined style={{ color: '#2563eb' }} />,
      label: <span style={{ color: '#2563eb' }}>פתרון מלא</span>,
      onClick: () => onHelp?.('solution')
    },
    {
      key: 'resources',
      icon: <BookOutlined style={{ color: '#2563eb' }} />,
      label: <span style={{ color: '#2563eb' }}>חומר עזר</span>,
      onClick: () => onHelp?.('resources')
    }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px',
      marginRight: 'auto'
    }}>
      {/* Help button */}
      <Button 
        type="text"
        style={{
          color: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          border: '1px solid #2563eb',
          borderRadius: '6px',
          height: '36px',
          padding: '0 12px'
        }}
      >
        <Dropdown
          menu={{ items: helpMenuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <QuestionCircleOutlined style={{ fontSize: '16px' }} />
            עזרה
          </div>
        </Dropdown>
      </Button>

      {/* Next Question Button */}
      <Button
        type="default"
        onClick={onNext}
        style={{
          color: '#2563eb',
          borderColor: '#2563eb',
          height: '36px',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'transparent'
        }}
        icon={<DoubleLeftOutlined style={{ color: '#2563eb' }} />}
      >
        שאלה הבאה
      </Button>
    </div>
  );
};

export default QuestionActions; 