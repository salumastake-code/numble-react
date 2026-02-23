import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../lib/api';
import useStore from '../store/useStore';
import './Auth.css';

const SUPABASE_URL = 'https://jzbjcjgcvcsitmtnfuhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6YmpjamdjdmNzaXRtdG5mdWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDAzNzMsImV4cCI6MjA4NzExNjM3M30.O_1kIEHn5MhO4ERfbYpbHFaBzPDJ0hmzJi3JPSB9kJ4';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setToken: storeSetToken, showToast } = useStore();

  // States: 'loading' | 'pick-nickname' | 'done' | 'error'
  const [phase, setPhase] = useState('loading');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);
  const [pendingRefresh, setPendingRefresh] = useState(null);

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      // Supabase PKCE flow: tokens come back in the URL hash after code exchange
      // Hash looks like: #access_token=...&refresh_token=...&token_type=bearer
      const hash = window.location.hash;
      const query = window.location.search;

      let accessToken = null;
      let refreshToken = null;

      // Try hash first (post-PKCE exchange redirect)
      if (hash) {
        const params = new URLSearchParams(hash.replace('#', ''));
        accessToken = params.get('access_token');
        refreshToken = params.get('refresh_token');
      }

      // Try query params as fallback
      if (!accessToken && query) {
        const params = new URLSearchParams(query);
        accessToken = params.get('access_token');
        refreshToken = params.get('refresh_token');

        // If there's a code param, exchange it
        const code = params.get('code');
        if (!accessToken && code) {
          // Exchange code via Supabase
          const exchRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ auth_code: code }),
          });
          if (exchRes.ok) {
            const exchData = await exchRes.json();
            accessToken = exchData.access_token;
            refreshToken = exchData.refresh_token;
          }
        }
      }

      if (!accessToken) {
        showToast('Google sign-in failed — no token received. Please try again.', 'error');
        navigate('/auth');
        return;
      }

      // Store token immediately so user is "logged in"
      setToken(accessToken);
      if (refreshToken) localStorage.setItem('numble_refresh', refreshToken);
      storeSetToken(accessToken);

      // Call backend to check/create profile
      const cbRes = await fetch('https://api.numble.io/auth/google-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      if (!cbRes.ok) {
        // Non-fatal — still let them in, profile issues can be fixed
        console.error('[AuthCallback] google-callback error:', await cbRes.text());
        navigate('/play');
        return;
      }

      const cbData = await cbRes.json();

      if (cbData.status === 'needs_nickname') {
        // New Google user — needs to pick a username
        setPendingToken(accessToken);
        setPendingRefresh(refreshToken);
        setNickname(cbData.suggestedNickname || '');
        setPhase('pick-nickname');
      } else {
        // Existing user or auto-created — go to play
        navigate('/play');
      }

    } catch (e) {
      console.error('[AuthCallback] Error:', e);
      showToast('Sign-in failed. Please try again.', 'error');
      navigate('/auth');
    }
  }

  async function handleSaveNickname() {
    const clean = nickname.trim();
    if (!clean || clean.length < 2 || clean.length > 20) {
      showToast('Username must be 2–20 characters', 'error');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      showToast('Letters, numbers, and underscores only', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('https://api.numble.io/auth/google-set-nickname', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pendingToken}`,
        },
        body: JSON.stringify({ nickname: clean }),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || 'Failed to save username', 'error');
        return;
      }

      navigate('/play');
    } catch (e) {
      showToast('Failed to save username. Try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (phase === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: '2rem' }}>🔐</div>
        <div style={{ fontSize: '0.9rem', color: '#555' }}>Signing you in...</div>
      </div>
    );
  }

  if (phase === 'pick-nickname') {
    return (
      <div className="auth-page">
        <div className="auth-hero">
          <div className="auth-logo">
            <img src="/favicon.svg" alt="" className="auth-logo-icon" />
            <span className="auth-logo-text">NUMBLE</span>
          </div>
          <h1 className="auth-headline">One last thing.</h1>
          <p className="auth-sub">Pick a username — this is how other players will see you.</p>
        </div>

        <div className="auth-card">
          <div className="auth-fields">
            <div className="field-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="e.g. LuckyAce77"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                autoCapitalize="off"
                autoCorrect="off"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSaveNickname()}
              />
            </div>
          </div>
          <button className="btn-primary" onClick={handleSaveNickname} disabled={saving}>
            {saving ? 'Saving...' : 'Continue →'}
          </button>
          <p className="auth-legal">Your username cannot be changed later.</p>
        </div>
      </div>
    );
  }

  return null;
}
