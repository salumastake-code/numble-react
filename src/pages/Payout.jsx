import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import useStore from '../store/useStore';
import './Payout.css';

const METHODS = [
  { id: 'paypal', label: 'PayPal', placeholder: 'PayPal email or username' },
  { id: 'venmo', label: 'Venmo', placeholder: '@venmo-handle' },
  { id: 'cashapp', label: 'Cash App', placeholder: '$cashtag' },
];

export default function Payout() {
  const [method, setMethod] = useState('paypal');
  const [detail, setDetail] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [prefillLoaded, setPrefillLoaded] = useState(false);
  const { showToast } = useStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payout-balance'],
    queryFn: () => api.get('/payouts/balance'),
  });

  // Load saved payout preference
  useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile'),
    onSuccess: (data) => {
      if (!prefillLoaded && data?.profile?.preferredPayoutMethod) {
        setMethod(data.profile.preferredPayoutMethod);
        setDetail(data.profile.preferredPayoutDetail || '');
        setPrefillLoaded(true);
      }
    },
  });

  const { data: historyData } = useQuery({
    queryKey: ['payout-history'],
    queryFn: () => api.get('/payouts?limit=5'),
  });

  const balance = data?.unpaidCash ?? 0;
  const canPayout = data?.canRequestPayout ?? false;
  const minimum = data?.minimumPayout ?? 10;
  const history = historyData?.payouts || [];

  const selectedMethod = METHODS.find(m => m.id === method);

  const submitMutation = useMutation({
    mutationFn: () => api.post('/payouts', {
      method,
      payout_detail: detail.trim(),
    }),
    onSuccess: (data) => {
      qc.invalidateQueries(['payout-balance']);
      qc.invalidateQueries(['payout-history']);
      qc.invalidateQueries(['profile']);
      setConfirmed(true);
      setDetail('');
    },
    onError: (e) => showToast(e.message || 'Payout request failed', 'error'),
  });

  function handleSubmit() {
    if (!detail.trim()) return showToast(`Enter your ${selectedMethod.label} info`, 'error');
    if (!canPayout) return showToast(`Minimum payout is $${minimum}`, 'error');
    submitMutation.mutate();
  }

  const statusColors = { pending: '#f59e0b', processing: '#3b82f6', paid: '#22c55e', rejected: '#ef4444' };

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn-back" onClick={() => navigate('/profile')}>←</button>
        <div>
          <div className="page-title">Request Payout</div>
          <div className="page-accent" />
        </div>
      </div>

      {/* Balance card */}
      <div className="payout-balance-card">
        <div className="payout-bal-label">AVAILABLE BALANCE</div>
        <div className={`payout-bal-amount ${balance === 0 ? 'zero' : ''}`}>${balance.toFixed(2)}</div>
        {balance < minimum && balance > 0 && (
          <div className="payout-bal-hint">Minimum payout is ${minimum}. Keep playing to earn more!</div>
        )}
        {balance === 0 && (
          <div className="payout-bal-hint">Win a draw to earn cash prizes.</div>
        )}
      </div>

      {confirmed ? (
        <div className="payout-success">
          <div className="payout-success-icon">✓</div>
          <div className="payout-success-title">Payout Requested!</div>
          <div className="payout-success-desc">We'll process your ${balance.toFixed(2)} via {selectedMethod?.label || method} within 3–5 business days.</div>
          <button className="btn-primary" onClick={() => { setConfirmed(false); navigate('/profile'); }}>Back to Profile</button>
        </div>
      ) : (
        <div className="payout-form">
          {/* Method tabs */}
          <div className="method-label">PAYOUT METHOD</div>
          <div className="method-tabs">
            {METHODS.map(m => (
              <button
                key={m.id}
                className={`method-tab ${method === m.id ? 'active' : ''}`}
                onClick={() => setMethod(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Detail input */}
          <div className="field-group" style={{ marginBottom: 16 }}>
            <label>
              {selectedMethod?.label} Info
              {prefillLoaded && detail && <span className="saved-label"> · Saved</span>}
            </label>
            <input
              type="text"
              placeholder={selectedMethod?.placeholder}
              value={detail}
              onChange={e => setDetail(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!canPayout || submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Submitting...' : `Request $${balance.toFixed(2)} Payout`}
          </button>

          {!canPayout && balance > 0 && (
            <p className="payout-min-note">Need ${(minimum - balance).toFixed(2)} more to reach the ${minimum} minimum.</p>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="payout-history">
          <div className="payout-history-title">PAYOUT HISTORY</div>
          {history.map((p, i) => (
            <div key={i} className="payout-history-row">
              <div>
                <div className="payout-history-method">{p.method} · {p.payout_detail}</div>
                <div className="payout-history-date">{new Date(p.requested_at).toLocaleDateString()}</div>
              </div>
              <div className="payout-history-right">
                <div className="payout-history-amount">${parseFloat(p.amount_usd).toFixed(2)}</div>
                <div className="payout-history-status" style={{ color: statusColors[p.status] || '#999' }}>
                  {p.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
