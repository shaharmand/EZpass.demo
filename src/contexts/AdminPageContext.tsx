import React, { createContext, useContext, ReactNode } from 'react';

interface PageIdentity {
  title: string;
  subtitle?: string;
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