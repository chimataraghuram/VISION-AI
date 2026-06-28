/**
 * VisionAI App Context
 * Global state management for current report and app-wide notifications.
 */
import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Latest analyzed report (for cross-page access)
  const [currentReport, setCurrentReport] = useState(null);
  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  const clearReport = useCallback(() => setCurrentReport(null), []);

  return (
    <AppContext.Provider value={{
      currentReport,
      setCurrentReport,
      clearReport,
      toast,
      showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
