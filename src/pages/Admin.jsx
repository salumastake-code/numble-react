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

function UsersPanel({ adminGet, onSelect }) {
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', q],
    queryFn: () => adminGet(`/admin/users?limit=100${q ? `&search=${encodeURIComponent(q)}` : ''}`),
    refetchInterval: 60000,
  });

  const users = data?.users || [];

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          className="admin-search"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && setQ(search)}
        />
        <button className="btn-admin-sm" onClick={() => setQ(search)}>Search</button>
        {q && <button className="btn-admin-sm" onClick={() => { setSearch(''); setQ(''); }}>Clear</button>}
      </div>
      {isLoading ? <div className="admin-empty">Loading...</div> : (
        <div className="admin-list">
          {users.map(u => (
            <div key={u.user_id} className="admin-list-row" style={{ cursor: 'pointer' }} onClick={() => onSelect(u.user_id)}>
              <div className="admin-list-main">
                <div className="admin-list-name">
                  {u.nickname}
                  <span className="admin-list-email">{u.email}</span>
                  <span className={`tier-chip ${u.subscription_status}`}>{u.subscription_status}</span>
                  {u.fraud_flag && <span style={{ color: 'var(--red)', fontSize: '0.7rem', marginLeft: 4 }}>⚠️ {u.fraud_flag}</span>}
                </div>
                <div className="admin-list-meta" style={{ marginTop: 4 }}>
                  <span style={{ fontSize: '0.75rem', color: '#aaa' }}>🎟️ {u.ticket_balance} tickets</span>
                  <span style={{ fontSize: '0.75rem', color: '#aaa' }}>🪙 {(u.token_balance || 0).toLocaleString()} tokens</span>
                  {u.preferred_payout_method && <span style={{ fontSize: '0.72rem', color: '#666' }}>{u.preferred_payout_method}: {u.preferred_payout_detail}</span>}
                </div>
                <div className="admin-list-date">Joined {new Date(u.created_at).toLocaleDateString()}</div>
              </div>
              <span style={{ color: '#444', fontSize: '1.2rem' }}>›</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function UserDetail({ userId, adminGet, onBack }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => adminGet(`/admin/users/${userId}`),
  });

  if (isLoading) return <div className="admin-empty">Loading...</div>;
  const { user, entries, payouts, prizes } = data || {};
  if (!user) return <div className="admin-empty">User not found</div>;

  return (
    <div>
      <button className="btn-admin-sm" onClick={onBack} style={{ marginBottom: 14 }}>← Back</button>

      {/* User card */}
      <div className="admin-user-detail-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e0e0e0' }}>{user.nickname}</div>
            <div style={{ fontSize: '0.82rem', color: '#888', marginTop: 2 }}>{user.email}</div>
            <div style={{ fontSize: '0.68rem', color: '#444', fontFamily: 'monospace', marginTop: 2 }}>{user.user_id}</div>
          </div>
          <span className={`tier-chip ${user.subscription_status}`}>{user.subscription_status}</span>
        </div>
        <div className="admin-user-stats">
          <div className="admin-user-stat"><div className="aus-val">{(user.token_balance || 0).toLocaleString()}</div><div className="aus-label">Tokens</div></div>
          <div className="admin-user-stat"><div className="aus-val">{user.ticket_balance || 0}</div><div className="aus-label">Tickets</div></div>
          <div className="admin-user-stat"><div className="aus-val">{entries?.length || 0}</div><div className="aus-label">Entries</div></div>
          <div className="admin-user-stat"><div className="aus-val" style={{ color: '#22c55e' }}>${prizes?.filter(p => p.amount_usd > 0).reduce((s, p) => s + parseFloat(p.amount_usd), 0).toFixed(2)}</div><div className="aus-label">Won</div></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10, fontSize: '0.78rem', color: '#666' }}>
          <div>Referral code: <span style={{ color: '#aaa' }}>{user.referral_code || '—'}</span></div>
          <div>Referred by: <span style={{ color: '#aaa' }}>{user.referred_by || '—'}</span></div>
          <div>Payout: <span style={{ color: '#aaa' }}>{user.preferred_payout_method ? `${user.preferred_payout_method} — ${user.preferred_payout_detail}` : '—'}</span></div>
          {user.fraud_flag && <div style={{ color: 'var(--red)' }}>⚠️ Flagged: {user.fraud_flag}</div>}
          <div>Joined: <span style={{ color: '#aaa' }}>{new Date(user.created_at).toLocaleString()}</span></div>
        </div>
      </div>

      {/* Recent entries */}
      <div className="admin-card-title" style={{ margin: '16px 0 8px' }}>Recent Entries</div>
      {!entries?.length ? <div className="admin-empty">No entries</div> : (
        <div className="admin-list">
          {entries.slice(0, 10).map(e => (
            <div key={e.entry_id} className="admin-list-row" style={{ cursor: 'default' }}>
              <div className="admin-list-main">
                <div className="admin-list-name" style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{e.number}</div>
                <div className="admin-list-meta">
                  <span style={{ fontSize: '0.72rem', color: '#666' }}>Week of {e.draws?.week_start}</span>
                  {e.draws?.winning_number && <span style={{ fontSize: '0.72rem', color: e.number === e.draws.winning_number ? '#22c55e' : '#555' }}>→ {e.draws.winning_number}</span>}
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#444' }}>{new Date(e.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Prizes */}
      <div className="admin-card-title" style={{ margin: '16px 0 8px' }}>Prizes</div>
      {!prizes?.length ? <div className="admin-empty">No prizes</div> : (
        <div className="admin-list">
          {prizes.map(p => (
            <div key={p.prize_id} className="admin-list-row" style={{ cursor: 'default' }}>
              <div className="admin-list-main">
                <div className="admin-list-name">{p.prize_type} {p.amount_usd > 0 ? `$${p.amount_usd}` : `+${p.tokens_awarded} tokens`}</div>
                <div className="admin-list-meta">
                  <span style={{ fontSize: '0.72rem', color: p.paid_out ? '#22c55e' : '#f97316' }}>{p.paid_out ? '✓ Paid' : 'Unpaid'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payouts */}
      <div className="admin-card-title" style={{ margin: '16px 0 8px' }}>Payout Requests</div>
      {!payouts?.length ? <div className="admin-empty">No payout requests</div> : (
        <div className="admin-list">
          {payouts.map(p => (
            <div key={p.payout_id} className="admin-list-row" style={{ cursor: 'default' }}>
              <div className="admin-list-main">
                <div className="admin-list-name">${parseFloat(p.amount_usd).toFixed(2)} via {p.method}</div>
                <div className="admin-list-meta">
                  <span style={{ color: STATUS_COLORS[p.status], fontSize: '0.72rem', fontWeight: 700 }}>{p.status}</span>
                  <span style={{ fontSize: '0.72rem', color: '#555' }}>{p.payout_detail}</span>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#444' }}>{new Date(p.requested_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const METHOD_LABELS = { paypal: 'PayPal', venmo: 'Venmo', cashapp: 'Cash App', stripe: 'Bank', zelle: 'Zelle' };
const STATUS_COLORS = { pending: '#f97316', processing: '#3b82f6', paid: '#22c55e', failed: '#ef4444' };

function PayoutsPanel({ adminGet, adminPost, qc }) {
  const [filter, setFilter] = useState('pending');
  const [processing, setProcessing] = useState({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-payouts', filter],
    queryFn: () => adminGet(`/admin/payouts?status=${filter}&limit=100`),
    refetchInterval: 30000,
  });

  const payouts = data?.payouts || [];

  async function markStatus(payoutId, status) {
    setProcessing(p => ({ ...p, [payoutId]: true }));
    try {
      await adminPost(`/admin/payout/${payoutId}/process`, { status });
      refetch();
    } finally {
      setProcessing(p => ({ ...p, [payoutId]: false }));
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['pending', 'processing', 'paid', 'failed', ''].map(s => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`admin-tab ${filter === s ? 'active' : ''}`}
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="admin-empty">Loading...</div>
      ) : payouts.length === 0 ? (
        <div className="admin-empty">✅ No {filter} payouts</div>
      ) : (
        <div className="admin-list">
          {payouts.map(p => (
            <div key={p.payout_id} className="admin-payout-row">
              <div className="admin-payout-top">
                <div className="admin-payout-user">
                  <strong>{p.users?.nickname || '—'}</strong>
                  <span className="admin-list-email">{p.users?.email}</span>
                  <span className={`tier-chip ${p.users?.subscription_status}`}>{p.users?.subscription_status}</span>
                </div>
                <div className="admin-payout-amount">${parseFloat(p.amount_usd).toFixed(2)}</div>
              </div>
              <div className="admin-payout-detail">
                <span className="admin-payout-method">{METHOD_LABELS[p.method] || p.method}</span>
                <span className="admin-payout-handle">{p.payout_detail}</span>
              </div>
              <div className="admin-payout-meta">
                <span style={{ color: STATUS_COLORS[p.status], fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>{p.status}</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>
                  {new Date(p.requested_at).toLocaleString()}
                </span>
              </div>
              {(p.status === 'pending' || p.status === 'processing') && (
                <div className="admin-payout-actions">
                  <button
                    className="btn-admin-success"
                    onClick={() => markStatus(p.payout_id, 'paid')}
                    disabled={processing[p.payout_id]}
                  >
                    {processing[p.payout_id] ? '...' : '✓ Mark Paid'}
                  </button>
                  <button
                    className="btn-admin-sm"
                    onClick={() => markStatus(p.payout_id, 'processing')}
                    disabled={processing[p.payout_id] || p.status === 'processing'}
                  >
                    Processing
                  </button>
                  <button
                    className="btn-admin-danger-sm"
                    onClick={() => { if(confirm('Mark as failed?')) markStatus(p.payout_id, 'failed'); }}
                    disabled={processing[p.payout_id]}
                  >
                    ✕ Fail
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Dashboard({ secret }) {
  const [tab, setTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState(null);
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
    mutationFn: async () => {
      const res = await adminPost('/admin/open-draw');
      // If conflict warning, ask to force
      if (res.error && res.openDraws) {
        if (confirm(`⚠️ ${res.error}\n\nForce open anyway?`)) {
          return adminPost('/admin/open-draw', { force: true });
        }
        throw new Error('Cancelled');
      }
      return res;
    },
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
        {['overview', 'users', 'fraud', 'payouts', 'draws'].map(t => (
          <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setSelectedUser(null); }}>
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

      {/* Users */}
      {tab === 'users' && (
        <div className="admin-section">
          {selectedUser
            ? <UserDetail userId={selectedUser} adminGet={adminGet} onBack={() => setSelectedUser(null)} />
            : <UsersPanel adminGet={adminGet} onSelect={setSelectedUser} />
          }
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
          <PayoutsPanel adminGet={adminGet} adminPost={adminPost} qc={qc} />
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
