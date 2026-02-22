import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import useStore from '../store/useStore';
import BalloonReveal from '../components/BalloonReveal';
import './Play.css';

function useBuyTokens(showToast) {
  return useMutation({
    mutationFn: () => api.post('/stripe/buy-tokens'),
    onSuccess: (data) => { if (data?.url) window.location.href = data.url; },
    onError: (e) => showToast(e.message || 'Failed to open checkout', 'error'),
  });
}

function useCountdown(draw) {
  const [time, setTime] = useState('');
  const [week, setWeek] = useState('');

  useEffect(() => {
    if (!draw) return;
    // Draw happens at the START of weekStart (Monday midnight ET)
    // weekStart = "2026-02-23" means the draw closes Sunday night / Monday 12am
    const weekStartStr = draw.weekStart || draw.week_start;
    const target = new Date(weekStartStr + 'T00:00:00'); // local midnight on draw day

    // week number — count from first draw week
    const firstDraw = new Date('2026-02-23T00:00:00');
    const weekNum = Math.max(1, Math.round((target - firstDraw) / (7 * 86400000)) + 1);
    setWeek('#' + weekNum);

    const tick = () => {
      const now = new Date();
      const diff = target - now;
      if (diff <= 0) { setTime('DRAWING NOW'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [draw]);

  return { time, week };
}

export default function Play() {
  const [input, setInput] = useState('');
  const { showToast, reveal, setReveal } = useStore();
  const qc = useQueryClient();
  const buyTokensMutation = useBuyTokens(showToast);

  // Handle return from token pack purchase
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tokens_purchased') === '1') {
      showToast('🎉 4 tokens added to your account!', 'success');
      window.history.replaceState({}, '', '/play');
      qc.invalidateQueries(['current-draw']);
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['current-draw'],
    queryFn: () => api.get('/draws/current'),
    refetchInterval: 60000,
  });

  const draw = data?.draw;
  const entries = data?.userEntries || [];
  const tokenBalance = data?.tokenBalance ?? 0;
  const user = data?.user;
  const { time, week } = useCountdown(draw);

  // Check for last draw result
  useEffect(() => {
    async function checkResult() {
      try {
        const hist = await api.get('/draws/history?limit=1');
        if (!hist?.draws?.length) return;
        const last = hist.draws[0];
        if (!last.winning_number) return;
        const seenKey = 'numble_seen_draw_' + last.draw_id;
        if (localStorage.getItem(seenKey)) return;
        localStorage.setItem(seenKey, '1');

        let entryList = [];
        try {
          const h = await api.get('/entries/history?limit=50');
          entryList = (h?.entries || []).filter(e => (e.draw_id || e.draws?.draw_id) === last.draw_id);
        } catch {}

        const winning = last.winning_number;
        let title, detail, winType = 'none';

        if (entryList.length > 0) {
          for (const entry of entryList) {
            const num = entry.number;
            const tier = entry.subscription_at_entry;
            const prizes = tier === 'paid' ? { exact: 1000, anagram: 100 } : { exact: 50, anagram: 5 };
            const winSorted = winning.split('').sort().join('');
            const numSorted = num.split('').sort().join('');
            const pos = num.split('').filter((c, i) => c === winning[i]).length;
            if (num === winning) { title = `🏆 EXACT MATCH — $${prizes.exact.toLocaleString()}!`; detail = `Winning number: ${winning}. You matched exactly!`; winType = 'jackpot'; break; }
            else if (numSorted === winSorted) { title = `🎯 ALL DIGITS — $${prizes.anagram}`; detail = `Winning number: ${winning}. Right digits, wrong order.`; winType = 'partial'; break; }
            else if (pos === 2) { title = `✌️ 2 IN PLACE — +1 Token`; detail = `Winning number: ${winning}. 2 digits in position!`; winType = 'token'; break; }
          }
          if (winType === 'none') { title = 'No win this week'; detail = `Winning number: ${winning}. Better luck next week!`; }
        } else {
          title = "This week's number"; detail = `The winning number was ${winning}. Enter next week for your chance!`; winType = 'none';
        }
        setTimeout(() => setReveal({ winning, title, detail, winType }), 800);
      } catch {}
    }
    checkResult();
  }, []);

  const submitMutation = useMutation({
    mutationFn: (number) => api.post('/entries', { number, idempotency_key: crypto.randomUUID() }),
    onSuccess: () => {
      qc.invalidateQueries(['current-draw']);
      showToast(`Entry ${input} submitted!`, 'success');
      setInput('');
    },
    onError: (e) => showToast(e.message || 'Submission failed', 'error'),
  });

  function pad(d) { if (input.length >= 3) return; setInput(p => p + d); }
  function del() { setInput(p => p.slice(0, -1)); }
  function clear() { setInput(''); }

  const canSubmit = input.length === 3 && tokenBalance > 0 && !submitMutation.isPending;

  return (
    <div className="play-page">
      {reveal && <BalloonReveal {...reveal} onClose={() => setReveal(null)} />}

      {/* Header */}
      <div className="play-header">
        <div className="play-logo">NUMBLE</div>
        <div className="play-meta">
          <span className="tier-badge">{user?.subscriptionStatus === 'paid' ? '⭐ SUBSCRIBER' : 'FREE'}</span>
          <span className="token-badge">
            <span className="token-dot" />
            {tokenBalance} token{tokenBalance !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Countdown */}
      <div className="countdown-card">
        <div>
          <div className="countdown-label">NEXT DRAW</div>
          <div className="countdown-time">{time || '—'}</div>
        </div>
        <div className="week-badge">WEEK<br/>{week}</div>
      </div>

      {/* Number display */}
      <div className="number-display">
        <div className="input-label">ENTER YOUR 3-DIGIT NUMBER</div>
        <div className="digit-row">
          {[0,1,2].map(i => (
            <div key={i} className={`digit-box ${input[i] ? 'filled' : ''}`}>
              {input[i] || '—'}
            </div>
          ))}
        </div>
      </div>

      {/* Keypad */}
      <div className="keypad">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} className="key-btn" onClick={() => pad(String(n))}>{n}</button>
        ))}
        <button className="key-btn key-clr" onClick={clear}>CLR</button>
        <button className="key-btn" onClick={() => pad('0')}>0</button>
        <button className="key-btn key-del" onClick={del}>⌫</button>
      </div>

      {/* Submit */}
      <button
        className="btn-submit"
        disabled={!canSubmit}
        onClick={() => submitMutation.mutate(input)}
      >
        {submitMutation.isPending ? 'SUBMITTING...' : 'SUBMIT ENTRY'}
      </button>

      {/* Buy tokens CTA — shown when out of tokens */}
      {tokenBalance === 0 && (
        <button
          className="btn-buy-tokens"
          onClick={() => buyTokensMutation.mutate()}
          disabled={buyTokensMutation.isPending}
        >
          {buyTokensMutation.isPending ? 'Loading...' : '🎟 Buy 4 Tokens — $9.99'}
        </button>
      )}

      {/* Entries list */}
      {entries.length > 0 && (
        <div className="entries-section">
          <div className="entries-title">YOUR ENTRIES THIS WEEK</div>
          <div className="entries-list">
            {entries.map((e, i) => (
              <div key={i} className="entry-row">
                <span className="entry-number">{e.number}</span>
                <span className="entry-badge">Entered</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
