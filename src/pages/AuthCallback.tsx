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
            // Get the full name from metadata
            const fullName = userMetadata.full_name || userMetadata.name || '';
            let firstName = '', lastName = '';

            // Try to get first/last name directly first
            if (userMetadata.given_name && userMetadata.family_name) {
              firstName = userMetadata.given_name;
              lastName = userMetadata.family_name;
            } else if (fullName) {
              // Split full name as fallback
              const nameParts = fullName.split(' ');
              firstName = nameParts[0] || '';
              lastName = nameParts.slice(1).join(' ') || '';
            }

            // Get avatar URL from various possible sources
            const avatarUrl = userMetadata.avatar_url || 
                            userMetadata.picture ||
                            userMetadata.avatar ||
                            null;

            // Update the profile
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                first_name: firstName,
                last_name: lastName,
                updated_at: new Date().toISOString()
              }, {
                // Only update if values are different
                onConflict: 'id',
                ignoreDuplicates: false
              })
              .select()
              .single();

            if (profileError) {
              console.error('Error updating profile:', profileError);
              message.error('שגיאה בעדכון הפרופיל');
            } else {
              message.success('התחברת בהצלחה!');
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
        message.error('שגיאה בתהליך ההתחברות');
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