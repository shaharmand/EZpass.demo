import { RouteObject, Outlet } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/Dashboard';
import { QuestionLibrary } from '../pages/admin/questions/QuestionLibrary';
import { QuestionEditor } from '../pages/admin/questions/QuestionEditor';
import { QuestionImport } from '../pages/admin/questions/QuestionImport';

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
          element: <QuestionLibrary />,
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
      ],
    },
  ],
}; 