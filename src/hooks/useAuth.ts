import { useState, useEffect } from 'react';

interface User {
  displayName?: string;
  email?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  const signOut = () => {
    setUser(null);
  };

  return {
    user,
    signOut
  };
}; 