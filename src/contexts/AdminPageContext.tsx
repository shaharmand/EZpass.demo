import React, { createContext, useContext, ReactNode } from 'react';

interface PageIdentity {
  title: string;
  subtitle?: string;
  position?: string;  // For showing current position (e.g., "3 / 1347")
  navigationEnabled?: boolean;  // To control whether navigation buttons should be enabled
  libraryPath?: string[];  // Array of breadcrumb items showing the current location in the library
}

interface AdminPageContextType {
  pageIdentity: PageIdentity | null;
  setPageIdentity: (identity: PageIdentity | null) => void;
}

const AdminPageContext = createContext<AdminPageContextType | undefined>(undefined);

export const AdminPageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pageIdentity, setPageIdentity] = React.useState<PageIdentity | null>(null);

  return (
    <AdminPageContext.Provider value={{ pageIdentity, setPageIdentity }}>
      {children}
    </AdminPageContext.Provider>
  );
};

export const useAdminPage = () => {
  const context = useContext(AdminPageContext);
  if (!context) {
    throw new Error('useAdminPage must be used within an AdminPageProvider');
  }
  return context;
}; 