import React, { useEffect } from 'react';
import { useRoutes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StudentPrepProvider } from './contexts/StudentPrepContext';
import { PracticeAttemptsProvider } from './contexts/PracticeAttemptsContext';
import { ExamProvider } from './contexts/ExamContext';
import { SearchResultsProvider } from './contexts/SearchResultsContext';
import PracticePage from './pages/PracticePage';
import { AuthForms } from './components/Auth/AuthForms';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import ExamDashboard from './pages/ExamDashboard';
import { UserProfile } from './pages/UserProfile';
import AuthCallback from './pages/AuthCallback';
import { checkEnvironmentVariables } from './utils/envCheck';
import { adminRoutes } from './routes/adminRoutes';

const App: React.FC = () => {
  useEffect(() => {
    // Check environment variables on app startup
    checkEnvironmentVariables();
  }, []);

  const routes = useRoutes([
    // Public routes
    { path: '/', element: <ExamDashboard /> },
    {
      path: 'auth',
      children: [
        { index: true, element: <AuthForms /> },
        { path: 'callback', element: <AuthCallback /> }
      ]
    },
    // Practice routes
    {
      path: 'practice',
      children: [
        {
          path: ':prepId',
          element: (
            <PracticeAttemptsProvider>
              <PracticePage />
            </PracticeAttemptsProvider>
          )
        }
      ]
    },
    // Protected routes
    {
      path: 'profile',
      element: (
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      )
    },
    // Admin routes
    adminRoutes
  ]);

  return (
    <AuthProvider>
      <StudentPrepProvider>
        <ExamProvider>
          <SearchResultsProvider>
            {routes}
          </SearchResultsProvider>
        </ExamProvider>
      </StudentPrepProvider>
    </AuthProvider>
  );
}

export default App;