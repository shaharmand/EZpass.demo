import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import LandingPage from './pages/LandingPage';
import ExamDashboard from './pages/ExamDashboard';
import SafetyCoursesPage from './pages/SafetyCoursesPage';
import PracticePage from './pages/PracticePage';
import QuestionPage from './pages/QuestionPage';
import TestGeneration from './pages/TestGeneration';
import PracticeFlowTestPage from './pages/PracticeFlowTestPage';
import { ExamProvider } from './contexts/ExamContext';
import { StudentPrepProvider } from './contexts/StudentPrepContext';
import MainLayout from './layouts/MainLayout';

const App: React.FC = () => {
  return (
    <ConfigProvider direction="rtl">
      <StudentPrepProvider>
        <ExamProvider>
          <Routes>
            <Route element={<MainLayout />}>
              {/* Main navigation */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<ExamDashboard />} />
              <Route path="/safety-courses" element={<SafetyCoursesPage />} />

              {/* Question Routes */}
              <Route path="/questions/:questionId" element={<QuestionPage />} />
              <Route path="/test/generation" element={<TestGeneration />} />
              <Route path="/test/practice-flow" element={<PracticeFlowTestPage />} />

              {/* Practice Routes */}
              <Route path="/practice/:prepId" element={<PracticePage />} />
            </Route>
          </Routes>
        </ExamProvider>
      </StudentPrepProvider>
    </ConfigProvider>
  );
};

export default App; 