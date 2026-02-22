import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './Admin.css';

const API = 'https://api.numble.io';

function useAdmin(secret) {
  const headers = { 'Content-Type': 'application/json', 'X-Admin-Secret': secret };

  const adminGet = (path) => fetch(`${API}${path}`, { headers }).then(r => r.json());
  const adminPost = (path, body) => fetch(`${API}${path}`, { method: 'POST', headers, body: body ? JSON.stringify(body) : undefined }).then(r => r.json());

  return { adminGet, adminPost };
}

function LoginGate({ onAuth }) {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function tryLogin() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/admin/status`, {
        headers: { 'X-Admin-Secret': secret },
      });
      if (res.ok) {
        sessionStorage.setItem('admin_secret', secret);
        onAuth(secret);
      } else {
        setError('Invalid admin secret');
      }
    } catch {
      setError('Could not reach server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="admin-brand">NUMBLE ADMIN</div>
        <input
          type="password"
          placeholder="Admin secret"
          value={secret}
          onChange={e => setSecret(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && tryLogin()}
          autoFocus
        />
        {error && <div className="admin-error">{error}</div>}
        <button onClick={tryLogin} disabled={loading || !secret}>
          {loading ? 'Checking...' : 'Enter'}
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card-admin">
      <div className="stat-val-admin" style={{ color: color || 'inherit' }}>{value}</div>
      <div className="stat-label-admin">{label}</div>
      {sub && <div className="stat-sub-admin">{sub}</div>}
    </div>
  );
}

function Dashboard({ secret }) {
  const [tab, setTab] = useState('overview');
  const qc = useQueryClient();
  const { adminGet, adminPost } = useAdmin(secret);

  const { data: status } = useQuery({
    queryKey: ['admin-status'],
    queryFn: () => adminGet('/admin/status'),
    refetchInterval: 30000,
  });

  const { data: flaggedData } = useQuery({
    queryKey: ['admin-flagged'],
    queryFn: () => adminGet('/admin/flagged-users'),
    enabled: tab === 'fraud',
  });

  const { data: payoutsData } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: () => adminGet('/payouts?limit=50'),
    enabled: tab === 'payouts',
    // Note: uses admin header so we need a dedicated admin payouts endpoint
  });

  const { data: drawsData } = useQuery({
    queryKey: ['admin-draws'],
    queryFn: () => adminGet('/draws/history?limit=10'),
    enabled: tab === 'draws',
  });

  const unflagMutation = useMutation({
    mutationFn: (userId) => adminPost(`/admin/unflag/${userId}`),
    onSuccess: () => qc.invalidateQueries(['admin-flagged']),
  });

  const openDrawMutation = useMutation({
    mutationFn: () => adminPost('/admin/open-draw'),
    onSuccess: () => qc.invalidateQueries(['admin-status']),
  });

  const executeDrawMutation = useMutation({
    mutationFn: (drawId) => adminPost('/admin/draw', { draw_id: drawId }),
    onSuccess: () => { qc.invalidateQueries(['admin-status']); qc.invalidateQueries(['admin-draws']); },
  });

  const s = status;

  return (
    <div className="admin-dash">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-brand-sm">🎩 NUMBLE ADMIN</div>
        <div className="admin-timestamp">{new Date().toLocaleString()}</div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {['overview', 'fraud', 'payouts', 'draws'].map(t => (
          <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'fraud' && (s?.users?.flagged > 0) && <span className="badge">{s.users.flagged}</span>}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="admin-section">
          <div className="admin-stats-grid">
            <StatCard label="Total Users" value={s?.users?.total ?? '—'} />
            <StatCard label="Paid" value={s?.users?.paid ?? '—'} color="var(--gold)" />
            <StatCard label="Free" value={s?.users?.free ?? '—'} />
            <StatCard label="Flagged" value={s?.users?.flagged ?? '—'} color={s?.users?.flagged > 0 ? 'var(--red)' : undefined} />
          </div>

          <div className="admin-stats-grid" style={{ marginTop: 12 }}>
            <StatCard label="Pending Payouts" value={s?.payouts?.pending ?? '—'} color="var(--red)" />
            <StatCard label="Pending Amount" value={s?.payouts?.pendingAmountUsd != null ? `$${s.payouts.pendingAmountUsd.toFixed(2)}` : '—'} color="var(--red)" />
          </div>

          {/* Current draw */}
          <div className="admin-card">
            <div className="admin-card-title">Current Draw</div>
            {s?.currentDraw ? (
              <div className="admin-draw-info">
                <div className="draw-row"><span>Week</span><strong>{s.currentDraw.week_start}</strong></div>
                <div className="draw-row"><span>Status</span><strong className={`draw-status ${s.currentDraw.status}`}>{s.currentDraw.status}</strong></div>
                <div className="draw-row"><span>Entries</span><strong>{s.currentDraw.total_entries}</strong></div>
                <div className="draw-row"><span>Draw ID</span><code>{s.currentDraw.draw_id?.slice(0, 16)}...</code></div>
              </div>
            ) : <div className="admin-empty">No active draw</div>}

            <div className="admin-actions">
              <button className="btn-admin-secondary" onClick={() => openDrawMutation.mutate()} disabled={openDrawMutation.isPending}>
                {openDrawMutation.isPending ? 'Opening...' : '+ Open New Draw'}
              </button>
              {s?.currentDraw?.status === 'open' && (
                <button className="btn-admin-danger" onClick={() => {
                  if (confirm('Execute draw now? This will pick a winner.')) {
                    executeDrawMutation.mutate(s.currentDraw.draw_id);
                  }
                }} disabled={executeDrawMutation.isPending}>
                  {executeDrawMutation.isPending ? 'Running...' : '🎰 Execute Draw Now'}
                </button>
              )}
            </div>
            {openDrawMutation.data && <div className="admin-result">{JSON.stringify(openDrawMutation.data?.draw || openDrawMutation.data, null, 2)}</div>}
            {executeDrawMutation.data && <div className="admin-result">{JSON.stringify(executeDrawMutation.data, null, 2)}</div>}
          </div>
        </div>
      )}

      {/* Fraud */}
      {tab === 'fraud' && (
        <div className="admin-section">
          <div className="admin-card-title" style={{ padding: '0 0 12px' }}>Flagged Accounts</div>
          {!flaggedData?.flaggedUsers?.length ? (
            <div className="admin-empty">✅ No flagged users</div>
          ) : (
            <div className="admin-list">
              {flaggedData.flaggedUsers.map(u => (
                <div key={u.user_id} className="admin-list-row">
                  <div className="admin-list-main">
                    <div className="admin-list-name">{u.nickname} <span className="admin-list-email">{u.email}</span></div>
                    <div className="admin-list-meta">
                      <span className={`tier-chip ${u.subscription_status}`}>{u.subscription_status}</span>
                      <span className="flag-reason">{u.fraud_flag}</span>
                    </div>
                    <div className="admin-list-date">Joined {new Date(u.created_at).toLocaleDateString()}</div>
                  </div>
                  <button className="btn-admin-sm" onClick={() => unflagMutation.mutate(u.user_id)} disabled={unflagMutation.isPending}>
                    Unflag
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payouts */}
      {tab === 'payouts' && (
        <div className="admin-section">
          <div className="admin-card-title" style={{ padding: '0 0 12px' }}>Recent Payouts</div>
          <div className="admin-empty">Use /admin/status for payout totals.<br/>Full payout management coming soon.</div>
        </div>
      )}

      {/* Draws */}
      {tab === 'draws' && (
        <div className="admin-section">
          <div className="admin-card-title" style={{ padding: '0 0 12px' }}>Draw History</div>
          {!drawsData?.draws?.length ? (
            <div className="admin-empty">No completed draws yet</div>
          ) : (
            <div className="admin-list">
              {drawsData.draws.map(d => (
                <div key={d.draw_id} className="admin-list-row">
                  <div className="admin-list-main">
                    <div className="admin-list-name">Week of {d.week_start}</div>
                    <div className="admin-list-meta">
                      <span className={`draw-status ${d.status}`}>{d.status}</span>
                      {d.winning_number && <span className="winning-num">🎯 {d.winning_number}</span>}
                      <span>{d.total_entries} entries</span>
                    </div>
                    {d.drawn_at && <div className="admin-list-date">Drawn {new Date(d.drawn_at).toLocaleString()}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [secret, setSecret] = useState(() => sessionStorage.getItem('admin_secret') || '');

  if (!secret) return <LoginGate onAuth={setSecret} />;
  return <Dashboard secret={secret} />;
}
