import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import './Leaderboard.css';

export default function Leaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['draw-history'],
    queryFn: () => api.get('/draws/history?limit=52'),
    refetchInterval: 60000,
  });

  const draws = (data?.draws || []).filter(d => d.winning_number);

  // Digit frequency
  const freq = Array(10).fill(0);
  draws.forEach(d => {
    d.winning_number.split('').forEach(c => freq[parseInt(c)]++);
  });

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Draw History</div>
        <div className="page-accent" />
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : draws.length === 0 ? (
        <div className="lb-empty">
          <div className="lb-empty-icon">🎱</div>
          <div className="lb-empty-text">No draws yet</div>
          <div className="lb-empty-sub">Check back after Monday's draw</div>
        </div>
      ) : (
        <div className="lb-body">

          {/* Recent numbers — roulette-style strip */}
          <div className="lb-section-label">RECENT NUMBERS</div>
          <div className="lb-strip-wrap">
            <div className="lb-strip">
              {draws.slice(0, 20).map((d, i) => (
                <div key={d.draw_id} className={`lb-ball ${i === 0 ? 'lb-ball-latest' : ''}`}>
                  {d.winning_number}
                </div>
              ))}
            </div>
          </div>

          {/* Full history table */}
          <div className="lb-section-label" style={{marginTop: 20}}>ALL DRAWS</div>
          <div className="lb-table">
            <div className="lb-table-header">
              <span>WEEK</span>
              <span>NUMBER</span>
              <span>DATE</span>
            </div>
            {draws.map((d, i) => {
              const date = new Date(d.drawn_at);
              const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const weekNum = draws.length - i;
              return (
                <div key={d.draw_id} className={`lb-table-row ${i === 0 ? 'lb-row-latest' : ''}`}>
                  <span className="lb-week">#{weekNum}</span>
                  <span className="lb-number">{d.winning_number}</span>
                  <span className="lb-date">{dateStr}</span>
                </div>
              );
            })}
          </div>

          {/* Digit frequency */}
          <div className="lb-section-label" style={{marginTop: 20}}>DIGIT FREQUENCY</div>
          <div className="lb-freq">
            {freq.map((count, digit) => {
              const max = Math.max(...freq, 1);
              const pct = Math.round((count / max) * 100);
              return (
                <div key={digit} className="lb-freq-row">
                  <span className="lb-freq-digit">{digit}</span>
                  <div className="lb-freq-bar-wrap">
                    <div className="lb-freq-bar" style={{width: `${pct}%`}} />
                  </div>
                  <span className="lb-freq-count">{count}</span>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
