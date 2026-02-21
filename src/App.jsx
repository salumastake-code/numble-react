import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getToken } from './lib/api';
import Auth from './pages/Auth';
import Play from './pages/Play';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Rules from './pages/Rules';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/auth" replace />;
}

function AppLayout({ children }) {
  return (
    <>
      {children}
      <BottomNav />
      <Toast />
    </>
  );
}

export default function App() {
  // Handle ?clear=1
  if (/[?&](logout|clear)=1/.test(window.location.search)) {
    localStorage.clear();
    window.location.href = '/';
    return null;
  }

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/play" element={<PrivateRoute><AppLayout><Play /></AppLayout></PrivateRoute>} />
          <Route path="/leaderboard" element={<PrivateRoute><AppLayout><Leaderboard /></AppLayout></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>} />
          <Route path="/rules" element={<PrivateRoute><AppLayout><Rules /></AppLayout></PrivateRoute>} />
          <Route path="*" element={<Navigate to={getToken() ? '/play' : '/auth'} replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
