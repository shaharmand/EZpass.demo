import React, { useEffect, useState } from 'react';
import { Card, Avatar, Typography, Button, message, Spin } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

const { Title, Text } = Typography;

interface UserData {
  id: string;
  full_name?: string;
  avatar_url?: string;
}

export function UserProfile() {
  const { user, signOut } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      try {
        if (!user) return;

        // Try to get existing profile
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        // If profile doesn't exist, create it
        if (!existingProfile) {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .upsert([
              {
                id: user.id,
                full_name: user.user_metadata?.full_name,
                avatar_url: user.user_metadata?.avatar_url,
              }
            ])
            .select('*')
            .single();

          if (insertError) throw insertError;
          setUserData(newProfile);
        } else {
          setUserData(existingProfile);
        }
      } catch (error: any) {
        console.error('Error loading user data:', error);
        message.error(error.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [user]);

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

  return (
    <Card style={{ maxWidth: 600, margin: '40px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Avatar 
          size={64} 
          icon={<UserOutlined />} 
          src={userData?.avatar_url}
        />
        <Title level={3} style={{ marginTop: 16 }}>
          {userData?.full_name || user?.email}
        </Title>
        <Text type="secondary">
          {user?.email}
        </Text>
      </div>

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