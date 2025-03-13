import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DatabaseQuestion } from '../types/question';

interface SearchResultsContextType {
  searchResults: DatabaseQuestion[] | null;
  setSearchResults: (results: DatabaseQuestion[] | null) => void;
}

const SearchResultsContext = createContext<SearchResultsContextType | undefined>(undefined);

export const useSearchResults = () => {
  const context = useContext(SearchResultsContext);
  if (context === undefined) {
    throw new Error('useSearchResults must be used within a SearchResultsProvider');
  }
  return context;
};

interface SearchResultsProviderProps {
  children: ReactNode;
}

export const SearchResultsProvider: React.FC<SearchResultsProviderProps> = ({ children }) => {
  const [searchResults, setSearchResults] = useState<DatabaseQuestion[] | null>(null);

  return (
    <SearchResultsContext.Provider value={{ searchResults, setSearchResults }}>
      {children}
    </SearchResultsContext.Provider>
  );
}; 