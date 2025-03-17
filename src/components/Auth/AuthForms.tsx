import React from 'react';
import { Button } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircleOutlined } from '@ant-design/icons';

interface AuthFormsProps {
  returnUrl?: string;
  onSuccess?: () => void;
  googleOnly?: boolean;
}

export function AuthForms({ returnUrl, onSuccess, googleOnly }: AuthFormsProps) {
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
    <div style={{ 
      background: 'white',
      width: '480px',
      direction: 'rtl',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ 
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px'
      }}>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <h1 style={{ 
            fontSize: '26px', 
            margin: 0, 
            fontWeight: 500,
            color: '#1e293b',
            marginBottom: '8px'
          }}>התחבר לאיזיפס</h1>
          <p style={{ 
            fontSize: '16px', 
            color: '#64748b', 
            margin: 0
          }}>מביאים אותך להצלחה במבחן</p>
        </div>

        <Button 
          onClick={handleGoogleSignIn}
          style={{
            width: '100%',
            maxWidth: '360px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#4285f4',
            border: 'none',
            borderRadius: '24px',
            color: 'white',
            fontSize: '16px',
            position: 'relative',
            paddingLeft: '48px',
            paddingRight: '32px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget;
            target.style.transform = 'translateY(-1px)';
            target.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.25)';
            target.style.background = '#5290f5';
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget;
            target.style.transform = 'translateY(0)';
            target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.08)';
            target.style.background = '#4285f4';
          }}
        >
          <div style={{
            position: 'absolute',
            left: '2px',
            top: '2px',
            bottom: '2px',
            width: '44px',
            background: 'white',
            borderRadius: '22px',
            backgroundImage: 'url(https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg)',
            backgroundSize: '22px',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            transition: 'all 0.2s ease-in-out'
          }} />
          המשך עם Google
        </Button>

        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '100%'
        }}>
          {[
            'לקבל משוב מותאם אישית וסיוע מיידי מחונך אישי',
            'ללמוד עם מסלול מותאם אישית המזהה ומחזק את החולשות שלך',
            'לגשת למאגר שאלות עדכני וחומרי לימוד ממוקדים'
          ].map((text, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '16px'
            }}>
              <CheckCircleOutlined style={{ 
                color: '#4285f4', 
                fontSize: '20px',
                flexShrink: 0,
                marginTop: '4px'
              }} />
              <span style={{ 
                fontSize: '16px', 
                color: '#475569',
                lineHeight: '1.6',
                textAlign: 'right'
              }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}