const API = 'https://api.numble.io';
const SUPABASE_URL = 'https://jzbjcjgcvcsitmtnfuhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6YmpjamdjdmNzaXRtdG5mdWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDAzNzMsImV4cCI6MjA4NzExNjM3M30.O_1kIEHn5MhO4ERfbYpbHFaBzPDJ0hmzJi3JPSB9kJ4';

async function signInWithGoogle() {
  const redirectTo = `${window.location.origin}/auth/callback`;
  window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
}

function getToken() { return localStorage.getItem('numble_token'); }
function setToken(t) { localStorage.setItem('numble_token', t); }
function setRefresh(t) { localStorage.setItem('numble_refresh', t); }
function getRefresh() { return localStorage.getItem('numble_refresh'); }
function clearAuth() {
  localStorage.removeItem('numble_token');
  localStorage.removeItem('numble_refresh');
  localStorage.removeItem('numble_session_expiry');
}
// Session expiry: track when the refresh token itself expires (7 days from last login/refresh)
function touchSessionExpiry() { localStorage.setItem('numble_session_expiry', Date.now() + 7 * 24 * 60 * 60 * 1000); }
function isSessionExpired() {
  const exp = localStorage.getItem('numble_session_expiry');
  if (!exp) return false; // no expiry set = legacy session, don't force logout
  return Date.now() > parseInt(exp, 10);
}

async function tryRefresh() {
  const refresh = getRefresh();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    // Only treat confirmed invalid token (401/400) as a real auth failure
    // Network errors / 5xx = keep existing token, don't log user out
    if (res.status === 401 || res.status === 400) return false;
    if (!res.ok) return true; // server error — assume token still valid
    const data = await res.json();
    if (data.accessToken) {
      setToken(data.accessToken);
      if (data.refreshToken) setRefresh(data.refreshToken);
      touchSessionExpiry(); // extend 7-day device session on every successful refresh
      return true;
    }
    return false;
  } catch {
    // Network error — don't clear auth, assume token still valid
    return true;
  }
}

// Decode JWT expiry without a library
function getTokenExp(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null; // ms
  } catch { return null; }
}

// Call on app load — silently refreshes if token is within 10 min of expiring
export async function initAuth() {
  const token = getToken();
  if (!token) return;

  // Check if the 7-day device session has expired
  if (isSessionExpired()) {
    clearAuth();
    return;
  }

  const exp = getTokenExp(token);
  if (!exp) return;
  const msLeft = exp - Date.now();
  if (msLeft < 10 * 60 * 1000) { // < 10 minutes left (includes already-expired)
    const refreshed = await tryRefresh();
    if (!refreshed && msLeft <= 0) {
      // Token is already expired AND refresh failed — clear auth now
      // so PrivateRoute doesn't let them through only to get bounced by the first API call
      clearAuth();
      return;
    }
  }
  // Schedule next refresh 5 min before expiry
  scheduleRefresh();
}

let _refreshTimer = null;
function scheduleRefresh() {
  if (_refreshTimer) clearTimeout(_refreshTimer);
  const token = getToken();
  if (!token) return;
  const exp = getTokenExp(token);
  if (!exp) return;
  const msLeft = exp - Date.now();
  const delay = Math.max(msLeft - 5 * 60 * 1000, 10 * 1000); // refresh 5 min before expiry
  _refreshTimer = setTimeout(async () => {
    const ok = await tryRefresh();
    if (ok) scheduleRefresh(); // reschedule for new token
  }, delay);
}

async function request(method, path, body, isRetry = false) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (res.status === 401 && !isRetry && path !== '/auth/login' && path !== '/auth/register' && path !== '/auth/refresh') {
    const refreshed = await tryRefresh();
    if (refreshed) return request(method, path, body, true);
    clearAuth();
    window.location.href = '/auth';
    return null;
  }

  if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
};

export { getToken, setToken, setRefresh, clearAuth, signInWithGoogle, touchSessionExpiry };
