import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, setToken, signInWithGoogle } from '../lib/api';
import { getFingerprint } from '../lib/fingerprint';
import useStore from '../store/useStore';
import './Auth.css';

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export default function Auth() {
  // mode: null = landing | 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState(null);
  const [plan, setPlan] = useState('free');
  const [form, setForm] = useState({ email: '', nickname: '', password: '', referral: '' });
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const { showToast, setToken: storeSetToken } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      update('referral', ref);
      setMode('register'); // auto-open sign up if referral link
    }
  }, []);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleRegister() {
    if (!form.email || !form.nickname || !form.password) return showToast('All fields required', 'error');
    setLoading(true);
    try {
      const fingerprint = await getFingerprint().catch(() => null);
      const data = await api.post('/auth/register', {
        email: form.email, password: form.password,
        nickname: form.nickname, plan,
        referral_code: form.referral || undefined,
        fingerprint,
      });
      if (!data) throw new Error('No response from server');
      const token = data.accessToken || data.token;
      if (!token) throw new Error(data.message || data.error || 'No token received');
      setToken(token);
      if (data.refreshToken) localStorage.setItem('numble_refresh', data.refreshToken);
      storeSetToken(token);

      if (plan === 'paid') {
        const checkoutRes = await api.post('/stripe/create-checkout');
        if (checkoutRes?.url) { window.location.href = checkoutRes.url; return; }
      }
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

  async function handleForgotPassword() {
    if (!form.email) return showToast('Enter your email address first', 'error');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: form.email });
      setForgotSent(true);
    } catch (e) {
      showToast(e.message || 'Failed to send reset email', 'error');
    } finally { setLoading(false); }
  }

  const hero = (
    <div className="auth-hero">
      <div className="auth-logo">
        <img src="/favicon.svg" alt="" className="auth-logo-icon" />
        <span className="auth-logo-text">NUMBLE</span>
      </div>
      <h1 className="auth-headline">Pick your number.<br/>Win cash.</h1>
      <p className="auth-sub">Weekly sweepstakes. 3-digit numbers. Real prizes.<br/>Free to play. No purchase necessary.</p>
    </div>
  );

  // ── Landing: two buttons ──────────────────────────────────────────────────
  if (mode === null) {
    return (
      <div className="auth-page">
        {hero}
        <div className="auth-landing-btns">
          <button className="btn-landing-signup" onClick={() => setMode('register')}>
            Create Account
          </button>
          <button className="btn-landing-signin" onClick={() => setMode('login')}>
            Sign In
          </button>
        </div>
        <p className="auth-legal" style={{ marginTop: '1.5rem' }}>
          By continuing you agree to our <a href="/terms" target="_blank" rel="noopener">Terms</a> and <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>. Must be 18+.
        </p>
      </div>
    );
  }

  // ── Forgot password ───────────────────────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <div className="auth-page">
        {hero}
        <div className="auth-card">
          {forgotSent ? (
            <>
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📬</div>
                <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Check your inbox</h2>
                <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                  We sent a reset link to <strong>{form.email}</strong>. Check your spam folder if you don't see it.
                </p>
              </div>
              <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => { setMode('login'); setForgotSent(false); }}>
                Back to Sign In
              </button>
            </>
          ) : (
            <>
              <button className="auth-back-btn" onClick={() => setMode('login')}>← Back</button>
              <h2 className="auth-card-title">Reset your password</h2>
              <p style={{ color: '#666', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>Enter your email and we'll send you a reset link.</p>
              <div className="auth-fields">
                <div className="field-group">
                  <label>Email</label>
                  <input type="email" placeholder="your@email.com" value={form.email}
                    onChange={e => update('email', e.target.value)} autoComplete="email" autoFocus />
                </div>
              </div>
              <button className="btn-primary" onClick={handleForgotPassword} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Sign In ───────────────────────────────────────────────────────────────
  if (mode === 'login') {
    return (
      <div className="auth-page">
        {hero}
        <div className="auth-card">
          <button className="auth-back-btn" onClick={() => setMode(null)}>← Back</button>
          <h2 className="auth-card-title">Sign In</h2>
          <div className="auth-fields">
            <div className="field-group">
              <label>Email</label>
              <input type="email" placeholder="your@email.com" value={form.email}
                onChange={e => update('email', e.target.value)} autoComplete="email" autoFocus />
            </div>
            <div className="field-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Password
                <a href="#" className="forgot-link" onClick={e => { e.preventDefault(); setMode('forgot'); }}>Forgot password?</a>
              </label>
              <input type="password" placeholder="Your password" value={form.password}
                onChange={e => update('password', e.target.value)} autoComplete="current-password"
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
          </div>
          <button className="btn-primary" onClick={handleLogin} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="auth-divider"><span>or</span></div>
          <button className="btn-google" onClick={signInWithGoogle} type="button">
            {GOOGLE_ICON} Sign in with Google
          </button>
          <p className="auth-switch-link">
            Don't have an account? <a href="#" onClick={e => { e.preventDefault(); setMode('register'); }}>Create one</a>
          </p>
        </div>
      </div>
    );
  }

  // ── Sign Up ───────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      {hero}
      <div className="auth-card">
        <button className="auth-back-btn" onClick={() => setMode(null)}>← Back</button>
        <h2 className="auth-card-title">Create Account</h2>
        <div className="auth-fields">
          <div className="field-group">
            <label>Email</label>
            <input type="email" placeholder="your@email.com" value={form.email}
              onChange={e => update('email', e.target.value)} autoComplete="email" autoFocus />
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
            <div className="plan-desc">1,500 tokens/mo<br/>Win up to $50</div>
          </button>
          <button className={`plan-btn ${plan === 'paid' ? 'selected' : ''}`} onClick={() => setPlan('paid')}>
            <div className="plan-icon">⭐</div>
            <div className="plan-name gold">Subscriber</div>
            <div className="plan-desc gold-muted">3,500 tokens/mo<br/>Win up to $1,000</div>
          </button>
        </div>

        <button className="btn-primary" onClick={handleRegister} disabled={loading}>
          {loading ? 'Creating...' : 'Create Account'}
        </button>

        <div className="auth-divider"><span>or</span></div>

        <button className="btn-google" onClick={signInWithGoogle} type="button">
          {GOOGLE_ICON} Sign up with Google
        </button>

        <p className="auth-legal">
          By continuing you agree to our <a href="/terms" target="_blank" rel="noopener">Terms of Use</a> and <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>. You must be 18 or older.
        </p>

        <p className="auth-switch-link">
          Already have an account? <a href="#" onClick={e => { e.preventDefault(); setMode('login'); }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
