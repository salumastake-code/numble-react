import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import './History.css';

function resultLabel(entry) {
  const draw = entry.draws;
  if (!draw?.winning_number) return { label: 'Pending', cls: 'pending' };

  const num = entry.number;
  const win = draw.winning_number;
  const winSorted = win.split('').sort().join('');
  const numSorted = num.split('').sort().join('');
  const posMatches = num.split('').filter((c, i) => c === win[i]).length;

  if (num === win) return { label: '🏆 Exact Match!', cls: 'exact' };
  if (numSorted === winSorted) return { label: '🎯 All Digits', cls: 'anagram' };
  if (posMatches === 2) return { label: '✌️ 2 In Place', cls: 'token' };
  if (posMatches === 1) return { label: '1️⃣ 1 In Place', cls: 'token' };
  return { label: 'No match', cls: 'none' };
}

function getPrize(entry) {
  const draw = entry.draws;
  if (!draw?.winning_number) return null;

  const num = entry.number;
  const win = draw.winning_number;
  const winSorted = win.split('').sort().join('');
  const numSorted = num.split('').sort().join('');
  const isPaid = entry.subscription_at_entry === 'paid';
  const posMatches = num.split('').filter((c, i) => c === win[i]).length;

  if (num === win) return isPaid ? '$1,000' : '$50';
  if (numSorted === winSorted) return isPaid ? '$100' : '$5';
  if (posMatches === 2) return '+1,500 tokens';
  if (posMatches === 1) return '+500 tokens';
  return null;
}

function groupByDraw(entries) {
  const groups = {};
  for (const entry of entries) {
    const drawId = entry.draws?.draw_id || 'unknown';
    if (!groups[drawId]) groups[drawId] = { draw: entry.draws, entries: [] };
    groups[drawId].entries.push(entry);
  }
  return Object.values(groups).sort((a, b) => {
    if (!a.draw?.week_start) return 1;
    if (!b.draw?.week_start) return -1;
    return new Date(b.draw.week_start) - new Date(a.draw.week_start);
  });
}

export default function History() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['entry-history'],
    queryFn: () => api.get('/entries/history?limit=100'),
  });

  const entries = data?.entries || [];
  const groups = groupByDraw(entries);

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn-back" onClick={() => navigate('/profile')}>←</button>
        <div>
          <div className="page-title">Entry History</div>
          <div className="page-accent" />
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : groups.length === 0 ? (
        <div className="history-empty">
          <div className="history-empty-icon">🎯</div>
          <div className="history-empty-title">No entries yet</div>
          <div className="history-empty-sub">Your draw entries will appear here</div>
          <button className="btn-primary" style={{ margin: '16px auto 0', maxWidth: 200 }} onClick={() => navigate('/play')}>
            Play Now
          </button>
        </div>
      ) : (
        <div className="history-list">
          {groups.map((group, gi) => {
            const draw = group.draw;
            const isOpen = draw?.status === 'open';
            const weekStr = draw?.week_start
              ? new Date(draw.week_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Unknown Week';

            return (
              <div key={gi} className="history-group">
                <div className="history-draw-header">
                  <div className="history-draw-week">Week of {weekStr}</div>
                  <div className="history-draw-right">
                    {isOpen ? (
                      <span className="draw-pill open">In Progress</span>
                    ) : draw?.winning_number ? (
                      <span className="draw-pill drawn">Winning: <strong>{draw.winning_number}</strong></span>
                    ) : (
                      <span className="draw-pill closed">Closed</span>
                    )}
                  </div>
                </div>

                <div className="history-entries">
                  {group.entries.map((entry, ei) => {
                    const result = resultLabel(entry);
                    const prize = getPrize(entry);
                    return (
                      <div key={ei} className={`history-entry-row ${result.cls}`}>
                        <div className="history-entry-left">
                          <div className="history-number">{entry.number}</div>
                          <div className="history-tier">{entry.subscription_at_entry === 'paid' ? '⭐ Subscriber' : 'Free'}</div>
                        </div>
                        <div className="history-entry-right">
                          <div className={`history-result ${result.cls}`}>{result.label}</div>
                          {prize && <div className="history-prize">{prize}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
