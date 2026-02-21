import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../lib/api';
import useStore from '../store/useStore';
import './Auth.css';

export default function Auth() {
  const [mode, setMode] = useState('register'); // 'register' | 'login'
  const [plan, setPlan] = useState('free');
  const [form, setForm] = useState({ email: '', nickname: '', password: '', referral: '' });
  const [loading, setLoading] = useState(false);
  const { showToast, setToken: storeSetToken } = useStore();
  const navigate = useNavigate();

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleRegister() {
    if (!form.email || !form.nickname || !form.password) return showToast('All fields required', 'error');
    setLoading(true);
    try {
      const data = await api.post('/auth/register', {
        email: form.email, password: form.password,
        nickname: form.nickname, plan,
        referral_code: form.referral || undefined,
      });
      const token = data.accessToken || data.token;
      setToken(token);
      if (data.refreshToken) localStorage.setItem('numble_refresh', data.refreshToken);
      storeSetToken(token);
      navigate('/play');
    } catch (e) {
      showToast(e.message || 'Registration failed', 'error');
    } finally { setLoading(false); }
  }

  async function handleLogin() {
    if (!form.email || !form.password) return showToast('Email and password required', 'error');
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email: form.email, password: form.password });
      const token = data.accessToken || data.token;
      setToken(token);
      if (data.refreshToken) localStorage.setItem('numble_refresh', data.refreshToken);
      storeSetToken(token);
      navigate('/play');
    } catch (e) {
      showToast(e.message || 'Login failed', 'error');
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-logo">NUMBLE</div>
        <h1 className="auth-headline">Pick your number.<br/>Win cash.</h1>
        <p className="auth-sub">Weekly sweepstakes. 3-digit numbers. Real prizes.<br/>Free to play. No purchase necessary.</p>
      </div>

      <div className="auth-card">
        {mode === 'register' ? (
          <>
            <div className="auth-fields">
              <div className="field-group">
                <label>Email</label>
                <input type="email" placeholder="your@email.com" value={form.email}
                  onChange={e => update('email', e.target.value)} autoComplete="email" />
              </div>
              <div className="field-group">
                <label>Username</label>
                <input type="text" placeholder="e.g. LuckyAce77" value={form.nickname}
                  onChange={e => update('nickname', e.target.value)} autoCapitalize="off" autoCorrect="off" />
              </div>
              <div className="field-group">
                <label>Password</label>
                <input type="password" placeholder="Min 8 characters" value={form.password}
                  onChange={e => update('password', e.target.value)} autoComplete="new-password" />
              </div>
              <div className="field-group">
                <label>Referral Code <span className="optional">(optional)</span></label>
                <input type="text" placeholder="Enter code if you have one" value={form.referral}
                  onChange={e => update('referral', e.target.value)} autoCapitalize="off" />
              </div>
            </div>

            <div className="plan-label">Choose your plan</div>
            <div className="plan-grid">
              <button className={`plan-btn ${plan === 'free' ? 'selected' : ''}`} onClick={() => setPlan('free')}>
                <div className="plan-icon">🆓</div>
                <div className="plan-name">Free</div>
                <div className="plan-desc">1 token/month<br/>Up to $50</div>
              </button>
              <button className={`plan-btn ${plan === 'paid' ? 'selected' : ''}`} onClick={() => setPlan('paid')}>
                <div className="plan-icon">⭐</div>
                <div className="plan-name gold">Subscriber</div>
                <div className="plan-desc gold-muted">1 free + 3 bonus tokens<br/>Up to $1,000</div>
              </button>
            </div>

            <button className="btn-primary" onClick={handleRegister} disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
            <p className="auth-switch">Already have an account? <a href="#" onClick={e => { e.preventDefault(); setMode('login'); }}>Sign in</a></p>
            <p className="auth-legal">By continuing you agree to our Terms of Use and confirm you are 18 or older.</p>
          </>
        ) : (
          <>
            <div className="auth-fields">
              <div className="field-group">
                <label>Email</label>
                <input type="email" placeholder="your@email.com" value={form.email}
                  onChange={e => update('email', e.target.value)} autoComplete="email" />
              </div>
              <div className="field-group">
                <label>Password</label>
                <input type="password" placeholder="Your password" value={form.password}
                  onChange={e => update('password', e.target.value)} autoComplete="current-password" />
              </div>
            </div>
            <button className="btn-primary" onClick={handleLogin} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <p className="auth-switch">New here? <a href="#" onClick={e => { e.preventDefault(); setMode('register'); }}>Create account</a></p>
          </>
        )}
      </div>
    </div>
  );
}
