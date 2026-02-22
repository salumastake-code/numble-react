import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import useStore from '../store/useStore';
import './Profile.css';

export default function Profile() {
  const { clearToken, showToast } = useStore();
  const navigate = useNavigate();
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [showReferrals, setShowReferrals] = useState(false);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const res = await api.get('/profile');
        if (!res?.profile?.email) {
          clearToken();
          navigate('/auth');
          return null;
        }
        return res;
      } catch (e) {
        clearToken();
        navigate('/auth');
        return null;
      }
    },
    retry: false,
  });

  const { data: balanceData } = useQuery({
    queryKey: ['payout-balance'],
    queryFn: () => api.get('/payouts/balance'),
  });

  const { data: referralData, isLoading: referralsLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => api.get('/profile/referrals'),
    enabled: showReferrals,
  });

  const profile = data?.profile;
  const tokenBalance = data?.tokenBalance ?? 0;
  const isPaid = profile?.subscriptionStatus === 'paid';
  const cashBalance = balanceData?.unpaidCash ?? 0;
  const totalEarned = balanceData?.totalEarnedCash ?? 0;

  const downgradeMutation = useMutation({
    mutationFn: () => api.post('/stripe/create-portal'),
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: (e) => showToast(e.message || 'Contact support to cancel', 'error'),
  });

  const upgradeMutation = useMutation({
    mutationFn: () => api.post('/stripe/create-checkout'),
    onSuccess: (data) => { if (data?.url) window.location.href = data.url; },
    onError: (e) => showToast(e.message || 'Failed to open checkout', 'error'),
  });

  const buyTokensMutation = useMutation({
    mutationFn: () => api.post('/stripe/buy-tokens'),
    onSuccess: (data) => { if (data?.url) window.location.href = data.url; },
    onError: (e) => showToast(e.message || 'Failed to open checkout', 'error'),
  });

  // Handle return from Stripe
  const params = new URLSearchParams(window.location.search);
  if (params.get('upgraded') === '1') {
    showToast('🎉 Welcome to Subscriber!', 'success');
    window.history.replaceState({}, '', '/profile');
  }

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

        {/* Entry history link */}
        <button className="btn-history" onClick={() => navigate('/history')}>
          📋 View Entry History
        </button>

        {/* Payout button */}
        {cashBalance > 0 && (
          <button className="btn-payout" onClick={() => navigate('/payout')}>
            💸 Request Payout — ${cashBalance.toFixed(2)}
          </button>
        )}

        {/* Referrals panel */}
        <div className="referrals-panel">
          <button className="referrals-toggle" onClick={() => setShowReferrals(s => !s)}>
            <span>👥 My Referrals</span>
            <span className="referrals-meta">
              {referralData?.summary
                ? `${referralData.summary.totalReferred} referred · $${referralData.summary.totalBonusEarned.toFixed(2)} earned`
                : "See who you've referred"}
              <span className="referrals-chevron">{showReferrals ? '▲' : '▼'}</span>
            </span>
          </button>

          {showReferrals && (
            <div className="referrals-body">
              {referralsLoading ? (
                <div className="referrals-empty">Loading...</div>
              ) : !referralData?.referrals?.length ? (
                <div className="referrals-empty">
                  No referrals yet. Share your code and earn 10% of whatever your friends win — forever.
                </div>
              ) : (
                <>
                  <div className="referrals-summary">
                    <div className="ref-stat">
                      <div className="ref-stat-val">{referralData.summary.totalReferred}</div>
                      <div className="ref-stat-label">Referred</div>
                    </div>
                    <div className="ref-stat">
                      <div className="ref-stat-val">{referralData.summary.totalPlayed}</div>
                      <div className="ref-stat-label">Have Played</div>
                    </div>
                    <div className="ref-stat">
                      <div className="ref-stat-val gold">${referralData.summary.totalBonusEarned.toFixed(2)}</div>
                      <div className="ref-stat-label">Earned</div>
                    </div>
                    <div className="ref-stat">
                      <div className="ref-stat-val green">${referralData.summary.pendingBonus.toFixed(2)}</div>
                      <div className="ref-stat-label">Pending</div>
                    </div>
                  </div>

                  <div className="referrals-list">
                    {referralData.referrals.map((r, i) => (
                      <div key={i} className="referral-row">
                        <div className="referral-left">
                          <div className="referral-nick">{r.nickname}</div>
                          <div className="referral-date">Joined {new Date(r.joinedAt).toLocaleDateString()}</div>
                        </div>
                        <div className="referral-right">
                          <span className={`referral-status ${r.hasPlayed ? 'played' : 'pending'}`}>
                            {r.hasPlayed ? `${r.entriesCount} entr${r.entriesCount === 1 ? 'y' : 'ies'}` : 'Not played yet'}
                          </span>
                          {r.bonusesEarned > 0 && (
                            <span className="referral-bonus">+${r.bonusesEarned.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Buy token pack */}
        <button
          className="btn-buy-tokens-profile"
          onClick={() => buyTokensMutation.mutate()}
          disabled={buyTokensMutation.isPending}
        >
          {buyTokensMutation.isPending ? 'Loading...' : '🎟 Buy 4 Tokens — $9.99'}
        </button>

        {/* Subscribe upsell — shown to free users */}
        {!isPaid && (
          <button
            className="btn-subscribe-upsell"
            onClick={() => upgradeMutation.mutate()}
            disabled={upgradeMutation.isPending}
          >
            <div className="upsell-top">⭐ Subscribe for $12.99/mo</div>
            <div className="upsell-sub">4 tokens/month · Win up to $1,000 · 20× the prizes</div>
          </button>
        )}

        {/* Referral card */}
        <div className="refcode-card">
          <div className="refcode-label">YOUR REFERRAL CODE</div>
          <div className="refcode-value">{profile?.referralCode || '—'}</div>
          <div className="refcode-tagline">Your friends win, you get paid too — <strong>forever.</strong></div>
          {(data?.recentReferralBonuses?.length > 0) && (
            <div className="refcode-earned">
              💰 You've earned ${(data.recentReferralBonuses.reduce((s, r) => s + parseFloat(r.amount_usd || 0), 0)).toFixed(2)} from referrals
            </div>
          )}
          <div className="refcode-actions">
            <button className="btn-refcode-copy" onClick={copyRefCode}>Copy Code</button>
            <button className="btn-refcode-share" onClick={() => {
              const code = profile?.referralCode || '';
              const msg = `I've been playing Numble — pick a 3-digit number each week and win real cash. Use my code ${code} when you sign up and I earn 10% of whatever you win, forever. Play free at numble.io`;
              if (navigator.share) {
                navigator.share({ title: 'Play Numble', text: msg, url: 'https://numble.io' }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(msg).catch(() => {});
                showToast('Message copied!', 'success');
              }
            }}>
              Share 🔗
            </button>
          </div>
        </div>

        {/* Subscription */}
        {!isPaid ? (
          <div className="upgrade-card">
            <div className="upgrade-title">⭐ Go Subscriber</div>
            <div className="upgrade-desc">4 tokens/month · Up to $1,000 per draw · 20× the prizes</div>
            <button className="btn-upgrade" onClick={() => upgradeMutation.mutate()} disabled={upgradeMutation.isPending}>
              {upgradeMutation.isPending ? 'Loading...' : 'Upgrade — $12.99/month'}
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
                    {downgradeMutation.isPending ? 'Opening...' : 'Manage Subscription'}
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
