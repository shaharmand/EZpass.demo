import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Form, Input, message, Card, Tabs, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, GoogleOutlined } from '@ant-design/icons';
import { TabsProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthFormData {
  email: string;
  password: string;
  full_name?: string;
}

interface AuthFormsProps {
  returnUrl?: string;
  googleOnly?: boolean;
}

export function AuthForms({ returnUrl, googleOnly }: AuthFormsProps) {
  const [activeTab, setActiveTab] = useState('signin');
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  // Get return URL from props, location state, or default to home
  const finalReturnUrl = returnUrl || 
    (location.state as any)?.from || 
    '/';

  const handleSuccessfulAuth = () => {
    navigate(finalReturnUrl, { replace: true });
  };

  const handleSignIn = async (values: AuthFormData) => {
    try {
      const { error } = await signIn(values.email, values.password);
      if (error) throw error;
      message.success('התחברת בהצלחה!');
      handleSuccessfulAuth();
    } catch (error: any) {
      message.error(error.message || 'ההתחברות נכשלה');
    }
  };

  const handleSignUp = async (values: AuthFormData) => {
    try {
      const [first_name = '', last_name = ''] = (values.full_name || '').split(' ');
      const { error } = await signUp(values.email, values.password, first_name, last_name);
      
      if (error) throw error;
      
      message.success('נרשמת בהצלחה! אנא אשר את המייל שנשלח אליך.');
      setActiveTab('signin');
    } catch (error: any) {
      console.error('Error signing up:', error);
      message.error(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Store return URL in localStorage before redirecting
      localStorage.setItem('returnUrl', finalReturnUrl);
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error: any) {
      message.error('ההתחברות עם Google נכשלה');
    }
  };

  // If googleOnly is true, render only the Google sign-in button
  if (googleOnly) {
    return (
      <Button 
        icon={<GoogleOutlined style={{ fontSize: '20px', marginRight: '8px' }} />} 
        onClick={handleGoogleSignIn} 
        size="large"
        style={{ 
          backgroundColor: '#4285f4',
          borderColor: '#4285f4',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          height: '48px',
          fontSize: '16px',
          padding: '0 32px',
          borderRadius: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          transition: 'all 0.3s ease',
          fontWeight: 500
        }}
        className="google-sign-in-button"
        onMouseEnter={e => {
          const target = e.currentTarget;
          target.style.backgroundColor = '#3367d6';
          target.style.borderColor = '#3367d6';
          target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={e => {
          const target = e.currentTarget;
          target.style.backgroundColor = '#4285f4';
          target.style.borderColor = '#4285f4';
          target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
        }}
      >
        התחבר עם Google
      </Button>
    );
  }

  const items: TabsProps['items'] = [
    {
      key: 'signin',
      label: 'התחברות',
      children: (
        <Form
          form={form}
          name="signin"
          onFinish={handleSignIn}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'אנא הכנס אימייל' },
              { type: 'email', message: 'אנא הכנס אימייל תקין' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="אימייל" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'אנא הכנס סיסמה' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="סיסמה" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              התחבר
            </Button>
          </Form.Item>

          <Divider>או</Divider>

          <Button 
            icon={<GoogleOutlined />} 
            onClick={handleGoogleSignIn} 
            block
            style={{ 
              backgroundColor: '#fff',
              borderColor: '#d9d9d9',
              color: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            התחבר עם Google
          </Button>
        </Form>
      ),
    },
    {
      key: 'signup',
      label: 'הרשמה',
      children: (
        <Form
          form={form}
          name="signup"
          onFinish={handleSignUp}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="full_name"
            rules={[{ required: true, message: 'אנא הכנס שם מלא' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="שם מלא" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'אנא הכנס אימייל' },
              { type: 'email', message: 'אנא הכנס אימייל תקין' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="אימייל" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'אנא הכנס סיסמה' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="סיסמה" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              הרשם
            </Button>
          </Form.Item>

          <Divider>או</Divider>

          <Button 
            icon={<GoogleOutlined />} 
            onClick={handleGoogleSignIn} 
            block
            style={{ 
              backgroundColor: '#fff',
              borderColor: '#d9d9d9',
              color: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            הרשם עם Google
          </Button>
        </Form>
      ),
    },
  ];

  const containerStyle = returnUrl ? {} : { maxWidth: 400, margin: '40px auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };

  return (
    <Card style={containerStyle}>
      <Tabs
        activeKey={activeTab}
        items={items}
        onChange={(key) => {
          setActiveTab(key);
          form.resetFields();
        }}
        centered
      />
    </Card>
  );
} 