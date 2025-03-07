import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Spin, message } from 'antd';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

          // Check URL parameters first, then localStorage, then default to home
          const returnUrl = searchParams.get('return_to') || localStorage.getItem('returnUrl') || '/';
          
          // Clear the return URL from localStorage
          localStorage.removeItem('returnUrl');
          
          // Navigate to the return URL
          navigate(returnUrl, { replace: true });
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        message.error('An error occurred during sign in');
        navigate('/', { replace: true });
      }
    };

    handleAuth();
  }, [navigate, searchParams]);

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