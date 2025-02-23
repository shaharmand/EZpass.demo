import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ExamDashboard from './pages/ExamDashboard';
import SafetyCoursesPage from './pages/SafetyCoursesPage';
import PracticePage from './pages/PracticePage';
import QuestionPage from './pages/QuestionPage';
import TestGeneration from './pages/TestGeneration';
import PracticeFlowTestPage from './pages/PracticeFlowTestPage';
import TestPage from './pages/TestPage';
import { ExamProvider } from './contexts/ExamContext';
import { StudentPrepProvider } from './contexts/StudentPrepContext';
import MainLayout from './layouts/MainLayout';

const App: React.FC = () => {
  return (
    <ConfigProvider direction="rtl">
      <StudentPrepProvider>
        <ExamProvider>
          <Routes>
            {/* All routes under MainLayout */}
            <Route element={<MainLayout />}>
              <Route path="/safety-courses" element={<SafetyCoursesPage />} />
              <Route path="/questions/:questionId" element={<QuestionPage />} />
              <Route path="/test" element={<TestPage />} />
              <Route path="/test/generation" element={<TestGeneration />} />
              <Route path="/test/practice-flow" element={<PracticeFlowTestPage />} />
              <Route path="/practice/:prepId" element={<PracticePage />} />
            </Route>

            {/* ExamDashboard as homepage */}
            <Route path="/" element={<ExamDashboard />} />
            
            {/* Catch-all route to redirect to homepage */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ExamProvider>
      </StudentPrepProvider>
    </ConfigProvider>
  );
};

export default App;