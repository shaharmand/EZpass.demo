import React, { useState, useEffect } from 'react';
import { Modal, Typography } from 'antd';
import { AuthForms } from '../Auth/AuthForms';
import { StarOutlined, CheckCircleOutlined } from '@ant-design/icons';

const MAX_DIALOG_SHOWS = 1; // Show dialog only once
const { Text } = Typography;

interface GuestLimitDialogProps {
  open: boolean;
  onClose: () => void;
}

export const GuestLimitDialog: React.FC<GuestLimitDialogProps> = ({ open, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCount, setShowCount] = useState(0);

  // Log initial render and prop changes
  console.log('=== GuestLimitDialog render ===', {
    receivedOpenProp: open,
    currentIsOpen: isOpen,
    currentShowCount: showCount
  });

  useEffect(() => {
    console.log('=== GuestLimitDialog useEffect triggered ===', {
      open,
      showCount,
      isOpen,
      willShow: open && showCount < MAX_DIALOG_SHOWS
    });

    if (open && showCount < MAX_DIALOG_SHOWS) {
      console.log('Opening guest limit dialog');
      setIsOpen(true);
    }
  }, [open, showCount]);

  const handleClose = () => {
    console.log('Closing guest limit dialog');
    setIsOpen(false);
    setShowCount(prev => prev + 1);
    onClose();
  };

  // Log before returning JSX
  console.log('=== GuestLimitDialog pre-render state ===', {
    isOpen,
    showCount,
    willRenderModal: isOpen,
    willShowFirstMessage: showCount === 0
  });

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

        {showCount === 0 ? (
          <>
            <div style={{
              padding: '16px 20px',
              background: '#f0f9ff',
              borderRadius: '12px',
              border: '1px solid #93c5fd',
              marginBottom: '24px',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)'
            }}>
              <Text style={{ 
                fontSize: '20px', 
                color: '#1e40af',
                fontWeight: 500,
                display: 'block',
                lineHeight: 1.4
              }}>
                השלמת בהצלחה 2 שאלות תרגול!
              </Text>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              marginBottom: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
              <Text style={{ 
                fontSize: '18px',
                color: '#1d4ed8',
                fontWeight: 600,
                display: 'block',
                marginBottom: '20px'
              }}>
                צור/י חשבון חינמי כדי:
              </Text>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginBottom: '24px',
                textAlign: 'right'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircleOutlined style={{ color: '#2563eb', fontSize: '20px' }} />
                  <Text style={{ fontSize: '16px', color: '#374151', fontWeight: 500 }}>
                    לקבל משוב מפורט עבור שאלות נוספות
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircleOutlined style={{ color: '#2563eb', fontSize: '20px' }} />
                  <Text style={{ fontSize: '16px', color: '#374151', fontWeight: 500 }}>
                    לשמור את ההתקדמות שלך
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircleOutlined style={{ color: '#2563eb', fontSize: '20px' }} />
                  <Text style={{ fontSize: '16px', color: '#374151', fontWeight: 500 }}>
                    לעקוב אחר הביצועים שלך
                  </Text>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            padding: '16px 20px',
            background: '#f0f9ff',
            borderRadius: '12px',
            border: '1px solid #93c5fd',
            marginBottom: '24px',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)'
          }}>
            <Text style={{ 
              fontSize: '18px',
              color: '#1e40af',
              fontWeight: 500,
              display: 'block',
              lineHeight: 1.4
            }}>
              התחבר כדי לקבל משוב מפורט על התשובות שלך
            </Text>
          </div>
        )}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          paddingTop: '8px'
        }}>
          <AuthForms returnUrl={window.location.pathname} googleOnly />
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