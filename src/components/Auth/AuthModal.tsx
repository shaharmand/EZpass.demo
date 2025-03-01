import React from 'react';
import { Modal } from 'antd';
import { AuthForms } from './AuthForms';
import { useAuth } from '../../contexts/AuthContext';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  returnUrl?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, returnUrl }) => {
  const { user } = useAuth();

  // Close modal if user becomes authenticated
  React.useEffect(() => {
    if (user) {
      onClose();
    }
  }, [user, onClose]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
      destroyOnClose
      centered
    >
      <AuthForms returnUrl={returnUrl} />
    </Modal>
  );
}; 