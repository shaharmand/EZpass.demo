import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StudentPrepProvider } from './contexts/StudentPrepContext';
import { PracticeAttemptsProvider } from './contexts/PracticeAttemptsContext';
import { ExamProvider } from './contexts/ExamContext';
import PracticePage from './pages/PracticePage';
import { AuthForms } from './components/Auth/AuthForms';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import ExamDashboard from './pages/ExamDashboard';
import { UserProfile } from './pages/UserProfile';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import { QuestionLibraryPage } from './pages/admin/questions/QuestionLibraryPage';
import { QuestionEditor } from './pages/admin/questions/QuestionEditor';
import { QuestionImport } from './pages/admin/questions/QuestionImport';
import AuthCallback from './pages/AuthCallback';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <StudentPrepProvider>
        <ExamProvider>
          <Routes>
            {/* Public routes */}
            <Route index element={<ExamDashboard />} />
            <Route path="auth">
              <Route index element={<AuthForms />} />
              <Route path="callback" element={<AuthCallback />} />
            </Route>

            {/* Practice routes */}
            <Route path="practice">
              <Route path=":prepId" element={
                <PracticeAttemptsProvider>
                  <PracticePage />
                </PracticeAttemptsProvider>
              } />
            </Route>

            {/* Protected routes */}
            <Route path="profile" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="admin" element={
              <ProtectedRoute>
                <AdminLayout>
                  <Outlet />
                </AdminLayout>
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="questions">
                <Route index element={<QuestionLibraryPage />} />
                <Route path="new" element={<QuestionEditor />} />
                <Route path=":id" element={<QuestionEditor />} />
                <Route path="import" element={<QuestionImport />} />
              </Route>
            </Route>
          </Routes>
        </ExamProvider>
      </StudentPrepProvider>
    </AuthProvider>
  );
}

export default App;