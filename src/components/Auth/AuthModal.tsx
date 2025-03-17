import React from 'react';
import { Modal } from 'antd';
import { AuthForms } from './AuthForms';
import { useAuth } from '../../contexts/AuthContext';
import styled from 'styled-components';

const StyledModal = styled(Modal)`
  .ant-modal-content {
    padding: 0;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1), 0 4px 8px -4px rgba(0, 0, 0, 0.06);
    width: fit-content;
    min-width: 360px;
    max-width: 95vw;
    margin: 0 auto;
  }

  .ant-modal-close {
    top: 16px;
    right: 16px;
    color: #94a3b8;
    width: 28px;
    height: 28px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    background: transparent;
    z-index: 10;

    &:hover {
      background: #f1f5f9;
      color: #475569;
    }
  }

  .ant-modal-close-x {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  .ant-modal-body {
    padding: 0;
    width: fit-content;
  }
`;

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  returnUrl?: string;
}

export function AuthModal({ open, onClose, returnUrl }: AuthModalProps) {
  const { user } = useAuth();

  // Close modal if user becomes authenticated
  React.useEffect(() => {
    if (user) {
      onClose();
    }
  }, [user, onClose]);

  return (
    <StyledModal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width="auto"
      maskStyle={{ background: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(4px)' }}
    >
      <AuthForms returnUrl={returnUrl} onSuccess={onClose} />
    </StyledModal>
  );
} 