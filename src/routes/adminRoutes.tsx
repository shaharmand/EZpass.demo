import { RouteObject, Outlet } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/Dashboard';
import { QuestionLibraryPage } from '../pages/admin/questions/QuestionLibraryPage';
import { QuestionEditor } from '../pages/admin/questions/QuestionEditor';
import { QuestionImport } from '../pages/admin/questions/QuestionImport';
import { QuestionGenerator } from '../pages/admin/questions/QuestionGenerator';

export const adminRoutes: RouteObject = {
  path: 'admin',
  element: <AdminLayout children={<Outlet />} />,
  children: [
    {
      index: true,
      element: <AdminDashboard />,
    },
    {
      path: 'questions',
      children: [
        {
          index: true,
          element: <QuestionLibraryPage />,
        },
        {
          path: 'new',
          element: <QuestionEditor />,
        },
        {
          path: ':id',
          element: <QuestionEditor />,
        },
        {
          path: 'import',
          element: <QuestionImport />,
        },
        {
          path: 'generate',
          element: <QuestionGenerator />,
        },
      ],
    },
  ],
}; 