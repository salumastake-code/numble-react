const API = 'https://api.numble.io';

function getToken() { return localStorage.getItem('numble_token'); }
function setToken(t) { localStorage.setItem('numble_token', t); }
function setRefresh(t) { localStorage.setItem('numble_refresh', t); }
function getRefresh() { return localStorage.getItem('numble_refresh'); }
function clearAuth() { localStorage.removeItem('numble_token'); localStorage.removeItem('numble_refresh'); }

async function tryRefresh() {
  const refresh = getRefresh();
  if (!refresh) return false;
  const res = await fetch(`${API}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  if (data.accessToken) { setToken(data.accessToken); if (data.refreshToken) setRefresh(data.refreshToken); return true; }
  return false;
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

export { getToken, setToken, setRefresh, clearAuth };
