import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import useStore from '../store/useStore';
import './Profile.css';

export default function Profile() {
  const { clearToken, showToast } = useStore();
  const navigate = useNavigate();
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile'),
  });

  const { data: balanceData } = useQuery({
    queryKey: ['payout-balance'],
    queryFn: () => api.get('/payouts/balance'),
  });

  const profile = data?.profile;
  const tokenBalance = data?.tokenBalance ?? 0;
  const isPaid = profile?.subscriptionStatus === 'paid';
  const cashBalance = balanceData?.unpaidCash ?? 0;
  const totalEarned = balanceData?.totalEarnedCash ?? 0;

  const downgradeMutation = useMutation({
    mutationFn: () => api.patch('/profile', { subscription_status: 'free' }),
    onSuccess: () => {
      qc.invalidateQueries(['profile']);
      showToast('Subscription cancelled', 'info');
      setShowDowngradeConfirm(false);
    },
    onError: (e) => showToast(e.message || 'Contact support to cancel', 'error'),
  });

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
            <div className="stat-label">Cash Won</div>
            <div className="stat-value gold">${totalEarned.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Available</div>
            <div className="stat-value gold">${cashBalance.toFixed(2)}</div>
          </div>
        </div>

        {/* Payout button */}
        {cashBalance > 0 && (
          <button className="btn-payout" onClick={() => navigate('/payout')}>
            💸 Request Payout — ${cashBalance.toFixed(2)}
          </button>
        )}

        {/* Referral code */}
        <div className="refcode-card" onClick={copyRefCode}>
          <div className="refcode-label">YOUR REFERRAL CODE</div>
          <div className="refcode-value">{profile?.referralCode || '—'}</div>
          <div className="refcode-hint">Tap to copy</div>
        </div>

        {/* Subscription */}
        {!isPaid ? (
          <div className="upgrade-card">
            <div className="upgrade-title">⭐ Go Subscriber</div>
            <div className="upgrade-desc">4 tokens/month · Up to $1,000 per draw · 20× the prizes</div>
            <button className="btn-upgrade" onClick={() => showToast('Stripe coming soon!', 'info')}>
              Upgrade — $12.99/month
            </button>
          </div>
        ) : (
          <div className="downgrade-card">
            {!showDowngradeConfirm ? (
              <button className="btn-downgrade" onClick={() => setShowDowngradeConfirm(true)}>
                Cancel Subscription
              </button>
            ) : (
              <div className="downgrade-confirm">
                <p>Are you sure? You'll lose your bonus tokens and drop to $50 max prizes.</p>
                <div className="downgrade-btns">
                  <button className="btn-cancel-no" onClick={() => setShowDowngradeConfirm(false)}>Keep It</button>
                  <button className="btn-cancel-yes" onClick={() => downgradeMutation.mutate()} disabled={downgradeMutation.isPending}>
                    {downgradeMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button className="btn-signout" onClick={signOut}>Sign Out</button>
      </div>
    </div>
  );
}
