import React, { createContext, useContext, ReactNode } from 'react';
import { useFirestoreData } from '@/hooks/useFirestoreData';

interface FirestoreDataContextType {
  children: ReactNode;
}

const FirestoreDataContext = createContext<ReturnType<typeof useFirestoreData> | null>(null);

export function FirestoreDataProvider({ children }: FirestoreDataContextType) {
  const firestoreData = useFirestoreData();

  return (
    <FirestoreDataContext.Provider value={firestoreData}>
      {children}
    </FirestoreDataContext.Provider>
  );
}

export function useFirestoreDataContext() {
  const context = useContext(FirestoreDataContext);
  if (!context) {
    throw new Error('useFirestoreDataContext must be used within a FirestoreDataProvider');
  }
  return context;
}
