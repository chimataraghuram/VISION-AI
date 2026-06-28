/**
 * VisionAI App Router
 * Sets up React Router routes and global layout (Navbar + Toast).
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Interview from './pages/Interview';

// ── Toast Notification ────────────────────────────────────────────────────────
function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  const colors = {
    success: 'bg-emerald-600 text-white',
    error:   'bg-red-600 text-white',
    info:    'bg-primary-600 text-white',
    warning: 'bg-amber-500 text-white',
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium
        transition-all duration-300 max-w-sm ${colors[toast.type] || colors.info}`}
    >
      {toast.message}
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
function Layout() {
  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />
      <main>
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history"   element={<History />} />
          <Route path="/interview" element={<Interview />} />
          {/* Catch-all → Home */}
          <Route path="*"          element={<Home />} />
        </Routes>
      </main>
      <Toast />
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Layout />
      </AppProvider>
    </BrowserRouter>
  );
}
