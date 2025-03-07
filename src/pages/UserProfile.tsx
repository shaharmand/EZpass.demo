import React, { useEffect, useState } from 'react';
import { Card, Avatar, Typography, Button, message, Spin, Descriptions, Tag } from 'antd';
import { UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserProfile as UserProfileType } from '../types/userTypes';

const { Title, Text } = Typography;

export function UserProfile() {
  const { user, profile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user, profile]);

  const handleSignOut = async () => {
    try {
      await signOut();
      message.success('Successfully signed out');
    } catch (error) {
      message.error('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Text>Please sign in to view your profile</Text>
      </div>
    );
  }

  return (
    <Card style={{ maxWidth: 800, margin: '40px auto', padding: '24px' }}>
      {/* Header with Avatar and Name */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Avatar 
          size={96} 
          icon={<UserOutlined />} 
          src={profile.avatarUrl}
          style={{ marginBottom: 16 }}
        />
        <Title level={2} style={{ marginBottom: 8 }}>
          {profile.firstName && profile.lastName 
            ? `${profile.firstName} ${profile.lastName}`
            : user.email?.split('@')[0]}
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          {user.email}
        </Text>
      </div>

      {/* Detailed Information */}
      <Descriptions 
        bordered 
        column={1}
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Role">
          <Tag color={profile.role === 'admin' ? 'red' : 'blue'}>
            {profile.role.toUpperCase()}
          </Tag>
        </Descriptions.Item>
        
        <Descriptions.Item label="Subscription">
          <Tag color={
            profile.subscriptionTier === 'pro' ? 'gold' :
            profile.subscriptionTier === 'plus' ? 'green' :
            'default'
          }>
            {profile.subscriptionTier.toUpperCase()}
          </Tag>
        </Descriptions.Item>

        {profile.phone && (
          <Descriptions.Item label="Phone">
            {profile.phone}
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Account Created">
          <ClockCircleOutlined /> {new Date(user.created_at).toLocaleDateString()}
        </Descriptions.Item>

        <Descriptions.Item label="Last Sign In">
          <ClockCircleOutlined /> {new Date(user.last_sign_in_at || '').toLocaleDateString()}
        </Descriptions.Item>

        <Descriptions.Item label="Email Verified">
          <Tag color={user.email_confirmed_at ? 'success' : 'warning'}>
            {user.email_confirmed_at ? 'VERIFIED' : 'NOT VERIFIED'}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      {/* Actions */}
      <div style={{ marginTop: 24 }}>
        <Button 
          type="primary" 
          danger 
          onClick={handleSignOut}
          block
        >
          Sign Out
        </Button>
      </div>
    </Card>
  );
} 