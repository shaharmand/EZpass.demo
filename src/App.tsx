import React, { useEffect } from 'react';
import { useRoutes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StudentPrepProvider } from './contexts/StudentPrepContext';
import { PracticeAttemptsProvider } from './contexts/PracticeAttemptsContext';
import { ExamProvider } from './contexts/ExamContext';
import { SearchResultsProvider } from './contexts/SearchResultsContext';
import PracticePage from './pages/PracticePage';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import ExamDashboard from './pages/ExamDashboard';
import { UserProfile } from './pages/UserProfile';
import AuthCallback from './pages/AuthCallback';
import { checkEnvironmentVariables } from './utils/envCheck';
import { adminRoutes } from './routes/adminRoutes';
import SafetyCoursePage from './pages/courses/SafetyCoursePage';
import VideoPage from './components/courses/VideoPage';
import SubmissionHistoryPage from './pages/user/SubmissionHistoryPage';
import SettingsPage from './pages/user/SettingsPage';

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
        { path: 'callback', element: <AuthCallback /> }
      ]
    },
    // Course routes
    {
      path: 'courses',
      children: [
        {
          path: 'safety',
          children: [
            {
              index: true,
              element: <SafetyCoursePage />
            },
            {
              path: 'video/:videoId',
              element: <VideoPage />
            }
          ]
        }
      ]
    },
    // Practice routes
    {
      path: 'practice',
      children: [
        {
          index: true,
          element: <ExamDashboard />
        },
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
    // User routes
    {
      path: 'user',
      children: [
        {
          path: 'submissions',
          element: (
            <ProtectedRoute>
              <SubmissionHistoryPage />
            </ProtectedRoute>
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
    {
      path: 'settings',
      element: (
        <ProtectedRoute>
          <SettingsPage />
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