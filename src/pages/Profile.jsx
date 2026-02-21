import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import useStore from '../store/useStore';
import './Profile.css';

export default function Profile() {
  const { clearToken, showToast } = useStore();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile'),
  });

  const profile = data?.profile;
  const tokenBalance = data?.tokenBalance ?? 0;
  const isPaid = profile?.subscriptionStatus === 'paid';

  function signOut() {
    clearToken();
    navigate('/auth');
  }

  function copyRefCode() {
    navigator.clipboard?.writeText(profile?.referralCode || '').catch(() => {});
    showToast('Referral code copied!', 'success');
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Profile</div>
        <div className="page-accent" />
      </div>

      <div className="profile-body">
        {/* User card */}
        <div className="profile-card">
          <div className="profile-avatar">{profile?.nickname?.[0]?.toUpperCase() || '?'}</div>
          <div>
            <div className="profile-name">{profile?.nickname || '—'}</div>
            <div className="profile-email">{profile?.email || ''}</div>
          </div>
          <div className={`profile-tier ${isPaid ? 'paid' : 'free'}`}>{isPaid ? '⭐ SUBSCRIBER' : 'FREE'}</div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Tokens</div>
            <div className="stat-value">{tokenBalance}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Winnings</div>
            <div className="stat-value gold">${(profile?.totalWinnings || 0).toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Referral Bonus</div>
            <div className="stat-value gold">${(profile?.referralBonus || 0).toLocaleString()}</div>
          </div>
        </div>

        {/* Referral code */}
        <div className="refcode-card" onClick={copyRefCode}>
          <div className="refcode-label">YOUR REFERRAL CODE</div>
          <div className="refcode-value">{profile?.referralCode || '—'}</div>
          <div className="refcode-hint">Tap to copy</div>
        </div>

        {/* Subscription */}
        {!isPaid && (
          <div className="upgrade-card">
            <div className="upgrade-title">⭐ Go Subscriber</div>
            <div className="upgrade-desc">4 tokens/month · Up to $1,000 per draw</div>
            <button className="btn-upgrade" onClick={() => showToast('Stripe coming soon!', 'info')}>
              Upgrade — $12.99/month
            </button>
          </div>
        )}

        <button className="btn-signout" onClick={signOut}>Sign Out</button>
      </div>
    </div>
  );
}
