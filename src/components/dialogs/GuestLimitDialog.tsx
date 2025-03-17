import React, { useState, useEffect } from 'react';
import { Modal, Typography } from 'antd';
import { AuthForms } from '../Auth/AuthForms';
import { StarOutlined } from '@ant-design/icons';

const MAX_DIALOG_SHOWS = 1; // Show dialog only once
const { Text } = Typography;

interface GuestLimitDialogProps {
  open: boolean;
  onClose: () => void;
}

export const GuestLimitDialog: React.FC<GuestLimitDialogProps> = ({ open, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCount, setShowCount] = useState(0);

  useEffect(() => {
    if (open && showCount < MAX_DIALOG_SHOWS) {
      setIsOpen(true);
    }
  }, [open, showCount]);

  const handleClose = () => {
    setIsOpen(false);
    setShowCount(prev => prev + 1);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      footer={null}
      width={480}
      centered
      maskClosable
      closable
      className="guest-limit-dialog"
    >
      <div style={{ textAlign: 'center', direction: 'rtl' }}>
        <div style={{ 
          fontSize: '28px', 
          fontWeight: 600,
          color: '#2563eb',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <StarOutlined style={{ fontSize: '32px', color: '#eab308' }} />
          {showCount === 0 ? "כל הכבוד! 🎓" : "התחברות נדרשת"}
        </div>

        <div style={{
          padding: '24px',
          background: '#f0f9ff',
          borderRadius: '16px',
          border: '1px solid #93c5fd',
          marginBottom: '32px',
          boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)'
        }}>
          <Text style={{ 
            fontSize: '20px', 
            color: '#1e40af',
            fontWeight: 500,
            display: 'block',
            lineHeight: 1.4
          }}>
            {showCount === 0 ? (
              <>
                השלמת בהצלחה 2 שאלות תרגול!
                <br />
                <span style={{ fontSize: '16px', marginTop: '8px', display: 'block' }}>
                  התחבר כדי להמשיך לתרגל ולקבל משוב מפורט
                </span>
              </>
            ) : (
              "התחבר כדי לקבל משוב מפורט על התשובות שלך"
            )}
          </Text>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center'
        }}>
          <AuthForms returnUrl={window.location.pathname} />
        </div>
      </div>

      <style>
        {`
          .guest-limit-dialog .ant-modal-content {
            border-radius: 20px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #e5e7eb;
            padding: 32px;
          }
          
          .guest-limit-dialog .ant-modal-close {
            top: 24px;
            right: 24px;
          }
          
          .guest-limit-dialog .ant-modal-close:hover {
            background: #f3f4f6;
          }
          
          .guest-limit-dialog .ant-modal-body {
            padding: 0;
          }
          
          .ant-modal-mask {
            background-color: rgba(17, 24, 39, 0.7) !important;
            backdrop-filter: blur(4px);
          }
        `}
      </style>
    </Modal>
  );
}; 