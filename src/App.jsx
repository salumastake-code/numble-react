import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getToken, initAuth, api } from './lib/api';
import useStore from './store/useStore';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import Play from './pages/Play';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Payout from './pages/Payout';
import History from './pages/History';
import Rules from './pages/Rules';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ResetPassword from './pages/ResetPassword';
import Admin from './pages/Admin';
import Spin from './pages/Spin';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

function PrivateRoute({ children, authReady }) {
  if (!authReady) return null; // wait for token refresh before deciding
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
  // Handle ?clear=1 or ?logout=1
  if (/[?&](logout|clear)=1/.test(window.location.search)) {
    localStorage.clear();
    window.location.href = '/auth';
    return null;
  }

  const { setTokenBalance, setTicketBalance } = useStore();
  const [authReady, setAuthReady] = useState(!getToken()); // if no token, already ready

  useEffect(() => {
    // Wait for token refresh to complete before rendering protected routes
    initAuth().then(() => {
      setAuthReady(true);
      // Pre-load balance into store
      if (getToken()) {
        api.get('/profile').then(data => {
          if (data?.tokenBalance !== undefined) setTokenBalance(data.tokenBalance);
          if (data?.ticketBalance !== undefined) setTicketBalance(data.ticketBalance);
        }).catch(() => {});
      }
    });
  }, []);

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/play" element={<PrivateRoute authReady={authReady}><AppLayout><Play /></AppLayout></PrivateRoute>} />
          <Route path="/leaderboard" element={<PrivateRoute authReady={authReady}><AppLayout><Leaderboard /></AppLayout></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute authReady={authReady}><AppLayout><Profile /></AppLayout></PrivateRoute>} />
          <Route path="/payout" element={<PrivateRoute authReady={authReady}><AppLayout><Payout /></AppLayout></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute authReady={authReady}><AppLayout><History /></AppLayout></PrivateRoute>} />
          <Route path="/spin" element={<PrivateRoute authReady={authReady}><AppLayout><Spin /></AppLayout></PrivateRoute>} />
          <Route path="/rules" element={<PrivateRoute authReady={authReady}><AppLayout><Rules /></AppLayout></PrivateRoute>} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={authReady ? <Navigate to={getToken() ? '/play' : '/auth'} replace /> : null} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
