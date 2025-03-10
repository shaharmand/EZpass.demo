import React, { useEffect, useState } from 'react';
import { Modal, Table, Select, message, Tag } from 'antd';
import type { TableProps } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import { supabase } from '../lib/supabaseClient';
import { translations } from '../translations/he';
import styled from 'styled-components';

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 12px;
    
    .ant-modal-header {
      border-radius: 12px 12px 0 0;
    }
  }

  .ant-table {
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .role-tag {
    padding: 4px 12px;
    font-size: 14px;
    min-width: 80px;
    text-align: center;
  }

  .ant-select {
    .ant-select-selector {
      .ant-select-selection-item {
        .role-tag {
          margin-right: 0;
        }
      }
    }
  }

  .ant-select-dropdown {
    .ant-select-item {
      padding: 5px 12px;
      
      .role-tag {
        margin: 0;
        width: 100%;
      }
    }
  }
`;

const RTLWrapper = styled.div`
  direction: rtl;
`;

const StyledSelect = styled(Select)`
  .ant-select-selection-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }
`;

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Profile {
  id: string;
  role: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string;
  updated_at: string;
  subscription_tier?: string;
  email?: string;
}

const ROLE_OPTIONS = [
  { label: 'מנהל', value: 'admin' },
  { label: 'מורה', value: 'teacher' },
  { label: 'תלמיד', value: 'student' },
];

const SUBSCRIPTION_OPTIONS = [
  { label: 'בסיסי', value: 'free' },
  { label: 'איזיפס+', value: 'plus' },
  { label: 'איזיפס פרו', value: 'pro' },
];

// Add exam type constants
const EXAM_TYPE_OPTIONS = [
  { label: 'בגרות', value: 'bagrut_exam', count: 4 },
  { label: 'מיצב', value: 'mahat_exam', count: 7 },
  { label: 'ממשלתי', value: 'government_exam', count: 3 },
];

const getRoleColor = (role: string) => {
  switch (role) {
    case 'student':
      return 'geekblue';
    case 'teacher':
      return 'purple';
    case 'admin':
      return 'gold';
    default:
      return 'default';
  }
};

const getSubscriptionColor = (tier: string) => {
  switch (tier) {
    case 'pro':
      return 'gold';
    case 'plus':
      return 'purple';
    case 'free':
    default:
      return 'blue';
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin':
      return 'מנהל';
    case 'teacher':
      return 'מורה';
    case 'student':
      return 'תלמיד';
    default:
      return role;
  }
};

const getSubscriptionLabel = (tier: string) => {
  switch (tier) {
    case 'pro':
      return 'איזיפס פרו';
    case 'plus':
      return 'איזיפס+';
    case 'free':
    default:
      return 'בסיסי';
  }
};

const getExamTypeLabel = (type: string) => {
  switch (type) {
    case 'bagrut_exam':
      return 'בגרות';
    case 'mahat_exam':
      return 'מיצב';
    case 'government_exam':
      return 'ממשלתי';
    default:
      return type;
  }
};

const getExamTypeColor = (type: string) => {
  switch (type) {
    case 'bagrut_exam':
      return 'volcano';
    case 'mahat_exam':
      return 'green';
    case 'government_exam':
      return 'cyan';
    default:
      return 'default';
  }
};

// Table locale configuration
const tableLocale = {
  emptyText: 'אין משתמשים להצגה',
};

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching users...');
      
      const { data, error } = await supabase
        .rpc('get_users_with_emails');

      if (error) throw error;

      console.log('Fetched users:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('שגיאה בטעינת המשתמשים');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      message.success('התפקיד עודכן בהצלחה');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating role:', error);
      message.error('שגיאה בעדכון התפקיד');
    }
  };

  const handleSubscriptionChange = async (userId: string, newTier: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: newTier })
        .eq('id', userId);

      if (error) throw error;
      message.success('המנוי עודכן בהצלחה');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating subscription:', error);
      message.error('שגיאה בעדכון המנוי');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const renderTag = (value: string, isRole: boolean = true) => {
    const color = isRole ? getRoleColor(value) : getSubscriptionColor(value);
    const label = isRole ? getRoleLabel(value) : getSubscriptionLabel(value);
    return (
      <Tag color={color} className="role-tag">
        {label}
      </Tag>
    );
  };

  const columns: TableProps<Profile>['columns'] = [
    {
      title: 'שם מלא',
      key: 'name',
      width: '25%',
      render: (_, record: Profile) => {
        const fullName = [record.first_name, record.last_name]
          .filter(Boolean)
          .join(' ');
        return fullName || 'אין שם';
      },
    },
    {
      title: 'אימייל',
      dataIndex: 'email',
      key: 'email',
      width: '35%',
      render: (email: string) => email || 'אין אימייל',
    },
    {
      title: 'תפקיד',
      dataIndex: 'role',
      key: 'role',
      width: '20%',
      render: (role: string, record: Profile) => (
        <StyledSelect<string>
          value={role}
          onChange={(value) => handleRoleChange(record.id, value as string)}
          style={{ width: 150 }}
          placeholder="בחר תפקיד"
        >
          {ROLE_OPTIONS.map(option => (
            <Select.Option key={option.value} value={option.value}>
              {renderTag(option.value, true)}
            </Select.Option>
          ))}
        </StyledSelect>
      ),
    },
    {
      title: 'מנוי',
      dataIndex: 'subscription_tier',
      key: 'subscription_tier',
      width: '20%',
      render: (tier: string, record: Profile) => (
        <StyledSelect<string>
          value={tier || 'free'}
          onChange={(value) => handleSubscriptionChange(record.id, value as string)}
          style={{ width: 150 }}
          placeholder="בחר מנוי"
        >
          {SUBSCRIPTION_OPTIONS.map(option => (
            <Select.Option key={option.value} value={option.value}>
              {renderTag(option.value, false)}
            </Select.Option>
          ))}
        </StyledSelect>
      ),
    },
    {
      title: 'עדכון אחרון',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: '12.5%',
      render: (date: string) => new Date(date).toLocaleDateString('he-IL'),
    },
    {
      title: 'תאריך הצטרפות',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '12.5%',
      render: (date: string) => new Date(date).toLocaleDateString('he-IL'),
    },
  ];

  return (
    <StyledModal
      title="ניהול משתמשים"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1200}
    >
      <RTLWrapper>
        <Table<Profile>
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ 
            pageSize: 10,
            position: ['bottomCenter'],
            showSizeChanger: false
          }}
          locale={tableLocale}
          scroll={{ x: 1100 }}
        />
      </RTLWrapper>
    </StyledModal>
  );
}; 