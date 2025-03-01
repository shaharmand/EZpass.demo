import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  // Allow guest access to practice routes
  const isPracticeRoute = location.pathname.startsWith('/practice');
  
  // If auth is not required or it's a practice route, allow access
  if (!requireAuth || isPracticeRoute) {
    return <>{children}</>;
  }

  // For other routes, require authentication
  if (!user) {
    // Save the attempted path to redirect back after auth
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
} 