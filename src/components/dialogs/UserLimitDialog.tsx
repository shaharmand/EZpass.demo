import React, { useState, useEffect } from 'react';
import { Modal, Typography, Button } from 'antd';
import { StarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { JoinEZpassPlusDialog } from './JoinEZpassPlusDialog';

const MAX_DIALOG_SHOWS = 1; // Show dialog only once
const { Text } = Typography;

interface UserLimitDialogProps {
  open: boolean;
  onClose: () => void;
}

export const UserLimitDialog: React.FC<UserLimitDialogProps> = ({ open, onClose }) => {
  const [isOpen, setIsOpen] = useState(open);
  const [showCount, setShowCount] = useState(0);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  // Log initial render and prop changes
  console.log('=== UserLimitDialog render ===', {
    receivedOpenProp: open,
    currentIsOpen: isOpen,
    currentShowCount: showCount
  });

  useEffect(() => {
    console.log('=== UserLimitDialog useEffect triggered ===', {
      open,
      showCount,
      isOpen,
      willShow: open && showCount < MAX_DIALOG_SHOWS
    });

    if (open && showCount < MAX_DIALOG_SHOWS) {
      console.log('Opening user limit dialog');
      setIsOpen(true);
    }
  }, [open, showCount]);

  const handleClose = () => {
    console.log('Closing user limit dialog');
    setIsOpen(false);
    setShowCount(prev => prev + 1);
    onClose();
  };

  const handleJoinClick = () => {
    setShowJoinDialog(true);
  };

  return (
    <>
      <Modal
        open={isOpen}
        onCancel={handleClose}
        footer={null}
        width={480}
        centered
        maskClosable
        closable
        className="user-limit-dialog"
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
            כל הכבוד על ההתקדמות שלך היום!
          </div>

          <div style={{
            padding: '16px 20px',
            background: '#f0f9ff',
            borderRadius: '12px',
            border: '1px solid #93c5fd',
            marginBottom: '24px',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)'
          }}>
            <Text style={{ 
              fontSize: '17px', 
              color: '#1e40af',
              fontWeight: 500,
              display: 'block'
            }}>
              הגעת למכסת המשובים המפורטים היומית שלך (5)
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '24px'
            }}>
              <Text style={{ 
                fontSize: '22px', 
                color: '#1d4ed8', 
                fontWeight: 600 
              }}>
                הצטרף לאיזיפס+
              </Text>
              <StarOutlined style={{ fontSize: '24px', color: '#eab308' }} />
            </div>

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
                  משוב מלא עם פתרונות והסברים
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircleOutlined style={{ color: '#2563eb', fontSize: '20px' }} />
                <Text style={{ fontSize: '16px', color: '#374151', fontWeight: 500 }}>
                  עזרה והנחיה אישית
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircleOutlined style={{ color: '#2563eb', fontSize: '20px' }} />
                <Text style={{ fontSize: '16px', color: '#374151', fontWeight: 500 }}>
                  תכני לימוד מותאמים לצרכיך
                </Text>
              </div>
            </div>
            
            <Button
              type="primary"
              size="large"
              onClick={handleJoinClick}
              className="join-button"
              style={{
                height: '52px',
                width: '100%',
                maxWidth: '280px',
                fontSize: '17px',
                background: '#2563eb',
                borderRadius: '26px',
                border: 'none',
                boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)',
                transition: 'all 0.3s ease',
                fontWeight: 600,
                marginTop: '8px'
              }}
            >
              הצטרף עכשיו
            </Button>
          </div>

          <Text style={{ 
            fontSize: '15px', 
            color: '#6b7280',
            display: 'block',
            maxWidth: '360px',
            margin: '0 auto',
            lineHeight: 1.5
          }}>
            תוכל להמשיך לתרגל ולקבל משוב בסיסי על נכונות התשובות
          </Text>
        </div>
      </Modal>

      <JoinEZpassPlusDialog 
        open={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
      />

      <style>
        {`
          .user-limit-dialog .ant-modal-content {
            border-radius: 20px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #e5e7eb;
            padding: 32px;
            position: relative;
          }
          
          .user-limit-dialog .ant-modal-close {
            position: absolute;
            top: 24px;
            left: 24px;
            right: auto;
            padding: 8px;
            border-radius: 50%;
            transition: all 0.2s ease;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .user-limit-dialog .ant-modal-close:hover {
            background: #f3f4f6;
          }

          .user-limit-dialog .ant-modal-close-x {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            width: 100%;
          }
          
          .user-limit-dialog .ant-modal-body {
            padding: 0;
          }
          
          .join-button:hover {
            background: #1d4ed8 !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(37, 99, 235, 0.25) !important;
          }
          
          .ant-modal-mask {
            background-color: rgba(17, 24, 39, 0.7) !important;
            backdrop-filter: blur(4px);
          }
        `}
      </style>
    </>
  );
}; 