import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Spin, message } from 'antd';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the initial auth state
    const handleAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session?.user) {
          const { user } = session;
          const userMetadata = user.user_metadata;

          // Update profile with Google data if available
          if (userMetadata) {
            // Split full name into first and last name
            const fullName = userMetadata.full_name || userMetadata.name || '';
            const [firstName = '', lastName = ''] = fullName.split(' ');

            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                first_name: firstName,
                last_name: lastName,
                avatar_url: userMetadata.avatar_url || userMetadata.picture,
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (profileError) {
              console.error('Error updating profile:', profileError);
              message.error('Failed to update profile');
            } else {
              message.success('Successfully signed in!');
            }
          }

          // Get the return URL from localStorage or default to home
          const returnUrl = localStorage.getItem('returnUrl') || '/';
          navigate(returnUrl, { replace: true });
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        message.error('An error occurred during sign in');
        navigate('/', { replace: true });
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <Spin size="large" />
      <div style={{ marginTop: 16 }}>מתחבר...</div>
    </div>
  );
};

export default AuthCallback; 