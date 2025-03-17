import React from 'react';
import { Button } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircleOutlined } from '@ant-design/icons';

interface AuthContentProps {
  returnUrl?: string;
  onSuccess?: () => void;
}

export function AuthContent({ returnUrl, onSuccess }: AuthContentProps) {
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      localStorage.setItem('returnUrl', returnUrl || '/');
      await signInWithGoogle();
      onSuccess?.();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ background: 'white' }}>
      <div style={{ padding: '24px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
        <h1 style={{ fontSize: '20px', margin: 0 }}>התחבר לאיזיפס</h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: '8px 0 0' }}>מביאים אותך להצלחה במבחן</p>
      </div>

      <div style={{ padding: '32px 64px 40px' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginBottom: '16px' }}>
            <span>לקבל משוב מותאם אישית וסיוע מיידי מחונך אישי</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleOutlined style={{ color: '#2563eb', fontSize: '16px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginBottom: '16px' }}>
            <span>ללמוד עם מסלול מותאם אישית המזהה ומחזק את החולשות שלך</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleOutlined style={{ color: '#2563eb', fontSize: '16px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            <span>לגשת למאגר שאלות עדכני וחומרי לימוד ממוקדים</span>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleOutlined style={{ color: '#2563eb', fontSize: '16px' }} />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleGoogleSignIn}
          style={{
            width: '280px',
            height: '40px',
            margin: '0 auto',
            display: 'block',
            background: '#4285f4',
            border: 'none',
            borderRadius: '20px',
            color: 'white',
            fontSize: '14px',
            position: 'relative',
            paddingLeft: '48px'
          }}
        >
          <div style={{
            position: 'absolute',
            left: '1px',
            top: '1px',
            bottom: '1px',
            width: '38px',
            background: 'white',
            borderRadius: '19px',
            backgroundImage: 'url(https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg)',
            backgroundSize: '18px',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }} />
          המשך עם Google
        </Button>
      </div>
    </div>
  );
} 