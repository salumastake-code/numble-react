import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import './Leaderboard.css';

export default function Leaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/leaderboard'),
    refetchInterval: 60000,
  });

  const board = data?.leaderboard || [];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Leaderboard</div>
        <div className="page-accent" />
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : board.length === 0 ? (
        <div className="empty">No winners yet. Be the first!</div>
      ) : (
        <div className="lb-list">
          {board.map((row, i) => (
            <div key={i} className={`lb-row ${i < 3 ? 'top' : ''}`}>
              <div className="lb-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</div>
              <div className="lb-name">{row.nickname || row.name}</div>
              <div className="lb-prize">${(row.total_winnings || row.prize || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
