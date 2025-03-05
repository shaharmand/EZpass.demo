import React from 'react';
import { Modal, Typography, Button, Steps } from 'antd';
import { CreditCardOutlined, UserOutlined, CheckOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface JoinEZpassPlusDialogProps {
  open: boolean;
  onClose: () => void;
}

export const JoinEZpassPlusDialog: React.FC<JoinEZpassPlusDialogProps> = ({ open, onClose }) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      maskClosable={false}
      closable
    >
      <div style={{ textAlign: 'center', direction: 'rtl', padding: '20px 0' }}>
        <Title level={4} style={{ color: '#1d4ed8', marginBottom: '32px' }}>
          הצטרף לאיזיפס+
        </Title>

        <Steps
          direction="horizontal"
          current={0}
          items={[
            {
              title: 'פרטים',
              icon: <UserOutlined />
            },
            {
              title: 'תשלום',
              icon: <CreditCardOutlined />
            },
            {
              title: 'סיום',
              icon: <CheckOutlined />
            }
          ]}
          style={{ marginBottom: '32px' }}
        />

        <div style={{
          background: '#f8fafc',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px',
          textAlign: 'right'
        }}>
          <Title level={5} style={{ marginBottom: '16px', color: '#1e40af' }}>
            מסלול חודשי - 49.90 ₪ לחודש
          </Title>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircleOutlined style={{ color: '#2563eb' }} />
              <Text>גישה מלאה לכל התכונות</Text>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircleOutlined style={{ color: '#2563eb' }} />
              <Text>ביטול בכל עת</Text>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircleOutlined style={{ color: '#2563eb' }} />
              <Text>7 ימי ניסיון בחינם</Text>
            </li>
          </ul>
        </div>

        <Button 
          type="primary"
          size="large"
          onClick={() => window.location.href = 'https://ezpass.co.il/checkout'}
          className="checkout-button"
          style={{
            height: '48px',
            width: '100%',
            fontSize: '16px',
            background: '#2563eb',
            borderRadius: '24px',
            border: 'none',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)',
            transition: 'all 0.3s ease',
            fontWeight: 600
          }}
        >
          המשך לתשלום
        </Button>
      </div>

      <style>
        {`
          .checkout-button:hover {
            background: #1d4ed8 !important;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
          }
        `}
      </style>
    </Modal>
  );
}; 