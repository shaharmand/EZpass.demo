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
        <PracticeAttemptsProvider>
          <ExamProvider>
            <Routes>
              <Route path="/" element={<ExamDashboard />} />
              <Route path="/auth" element={<AuthForms />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/practice/:prepId" element={<PracticePage />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout children={<Outlet />} />
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
        </PracticeAttemptsProvider>
      </StudentPrepProvider>
    </AuthProvider>
  );
};

export default App;