import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../lib/api';
import useStore from '../store/useStore';

const SUPABASE_URL = 'https://jzbjcjgcvcsitmtnfuhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6YmpjamdjdmNzaXRtdG5mdWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDAzNzMsImV4cCI6MjA4NzExNjM3M30.O_1kIEHn5MhO4ERfbYpbHFaBzPDJ0hmzJi3JPSB9kJ4';

/**
 * Handles the OAuth callback from Supabase (Google sign-in).
 * Supabase redirects here with a code in the URL hash/query.
 * We exchange it for a session and store the token.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { setToken: storeSetToken, showToast } = useStore();

  useEffect(() => {
    async function handleCallback() {
      try {
        // Supabase puts the code in the URL hash as access_token / refresh_token
        // or as a code param depending on flow
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', ''));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken) {
          // Direct token in hash (implicit flow)
          setToken(accessToken);
          if (refreshToken) localStorage.setItem('numble_refresh', refreshToken);
          storeSetToken(accessToken);

          // Ensure user profile exists in our DB (Google users may be new)
          const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const user = await res.json();

          // Register/upsert user in our backend
          await fetch('https://api.numble.io/auth/google-callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ userId: user.id, email: user.email }),
          }).catch(() => {}); // non-fatal

          navigate('/play');
        } else {
          // No token — something went wrong
          showToast('Google sign-in failed. Please try again.', 'error');
          navigate('/auth');
        }
      } catch (e) {
        console.error('[AuthCallback] Error:', e);
        showToast('Sign-in failed. Please try again.', 'error');
        navigate('/auth');
      }
    }

    handleCallback();
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: '2rem' }}>🔐</div>
      <div style={{ fontSize: '0.9rem', color: '#555' }}>Signing you in...</div>
    </div>
  );
}
