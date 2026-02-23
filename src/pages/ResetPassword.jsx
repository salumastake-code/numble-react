import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../lib/api';
import useStore from '../store/useStore';
import './Auth.css';

const SUPABASE_URL = 'https://jzbjcjgcvcsitmtnfuhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6YmpjamdjdmNzaXRtdG5mdWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDAzNzMsImV4cCI6MjA4NzExNjM3M30.O_1kIEHn5MhO4ERfbYpbHFaBzPDJ0hmzJi3JPSB9kJ4';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const { showToast, setToken: storeSetToken } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const token = params.get('access_token');
    const type = params.get('type');

    if (token && type === 'recovery') {
      setAccessToken(token);
      setToken(token);
      storeSetToken(token);
    } else {
      showToast('Invalid or expired reset link', 'error');
      navigate('/auth');
    }
  }, []);

  async function handleReset() {
    if (!password || password.length < 8) return showToast('Password must be at least 8 characters', 'error');
    if (password !== confirm) return showToast('Passwords do not match', 'error');

    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update password');
      }

      setDone(true);
      setTimeout(() => navigate('/play'), 2500);
    } catch (e) {
      showToast(e.message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-logo">
          <img src="/favicon.svg" alt="" className="auth-logo-icon" />
          <span className="auth-logo-text">NUMBLE</span>
        </div>
        <h1 className="auth-headline">Reset your password</h1>
        <p className="auth-sub">Choose a new password for your account.</p>
      </div>

      <div className="auth-card">
        {done ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Password updated!</h2>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Taking you to the app…</p>
          </div>
        ) : (
          <>
            <div className="auth-fields">
              <div className="field-group">
                <label>New Password</label>
                <input type="password" placeholder="Min 8 characters" value={password}
                  onChange={e => setPassword(e.target.value)} autoComplete="new-password" autoFocus />
              </div>
              <div className="field-group">
                <label>Confirm Password</label>
                <input type="password" placeholder="Repeat your password" value={confirm}
                  onChange={e => setConfirm(e.target.value)} autoComplete="new-password"
                  onKeyDown={e => e.key === 'Enter' && handleReset()} />
              </div>
            </div>
            <button className="btn-primary" onClick={handleReset} disabled={loading || !accessToken}>
              {loading ? 'Saving...' : 'Set New Password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
