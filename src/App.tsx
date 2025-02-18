import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import LandingPage from './pages/LandingPage';
import PracticePage from './pages/PracticePage';
import QuestionPage from './pages/QuestionPage';
import QuestionGenerationTest from './components/QuestionGenerationTest';
import PracticeFlowTest from './components/PracticeFlowTest';
import { ExamProvider } from './contexts/ExamContext';
import { PrepProvider } from './contexts/Prep';
import { StudentPrepProvider } from './contexts/StudentPrepContext';
import MainLayout from './layouts/MainLayout';

const App: React.FC = () => {
  return (
    <ConfigProvider direction="rtl">
      <StudentPrepProvider>
        <PrepProvider>
          <ExamProvider>
            <Routes>
              <Route element={<MainLayout />}>
                {/* Main navigation */}
                <Route path="/" element={<Navigate to="/exams" replace />} />
                <Route path="/exams" element={<LandingPage />} />

                {/* Question Routes */}
                <Route path="/questions/:questionId" element={<QuestionPage />} />

                {/* Preparation Routes */}
                <Route path="/prep">
                  <Route path=":prepId">
                    <Route index element={<Navigate to="practice" replace />} />
                    <Route path="practice" element={<PracticePage />} />
                  </Route>
                </Route>

                {/* Development Routes */}
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <Route path="/test/generation" element={<QuestionGenerationTest />} />
                    <Route path="/test/practice" element={<PracticeFlowTest />} />
                  </>
                )}
              </Route>
            </Routes>
          </ExamProvider>
        </PrepProvider>
      </StudentPrepProvider>
    </ConfigProvider>
  );
};

export default App; 