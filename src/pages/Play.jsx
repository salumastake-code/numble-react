import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import useStore from '../store/useStore';
import BalloonReveal from '../components/BalloonReveal';
import ExchangeWidget from '../components/ExchangeWidget';
import TokenIcon from '../components/TokenIcon';
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
    const weekStartStr = draw.weekStart || draw.week_start;
    const target = new Date(weekStartStr + 'T00:00:00');

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
  const navigate = useNavigate();
  const buyTokensMutation = useBuyTokens(showToast);

  // Handle return from token pack purchase
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tokens_purchased') === '1') {
      showToast('🎉 Tokens added to your account!', 'success');
      window.history.replaceState({}, '', '/play');
      qc.invalidateQueries(['current-draw']);
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['current-draw'],
    queryFn: () => api.get('/draws/current'),
    refetchInterval: 60000,
    retry: false,
  });

  const draw = data?.draw;
  const entries = data?.userEntries || [];
  const tokenBalance = data?.tokenBalance ?? 0;
  const ticketBalance = data?.ticketBalance ?? 0;
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
            else if (pos === 2) { title = `✌️ 2 IN PLACE — +1,500 Tokens`; detail = `Winning number: ${winning}. 2 digits in position!`; winType = 'token'; break; }
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
    onMutate: async (number) => {
      // Optimistically decrement ticket balance immediately
      await qc.cancelQueries(['current-draw']);
      const prev = qc.getQueryData(['current-draw']);
      qc.setQueryData(['current-draw'], (old) => {
        if (!old) return old;
        return {
          ...old,
          ticketBalance: Math.max(0, (old.ticketBalance ?? 0) - 1),
          userEntries: [
            { number, subscription_at_entry: old.user?.subscriptionStatus ?? 'free', submitted_at: new Date().toISOString() },
            ...(old.userEntries || []),
          ],
        };
      });
      return { prev };
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries(['current-draw']);
      qc.refetchQueries(['current-draw']);
      showToast(`🎉 ${variables} entered! Good luck!`, 'success');
      setInput('');
    },
    onError: (e, variables, context) => {
      // Roll back optimistic update
      if (context?.prev) qc.setQueryData(['current-draw'], context.prev);
      showToast(e.message || 'Submission failed', 'error');
    },
  });

  function pad(d) { if (input.length >= 3) return; setInput(p => p + d); }
  function del() { setInput(p => p.slice(0, -1)); }
  function clear() { setInput(''); }

  const canSubmit = input.length === 3 && ticketBalance > 0 && !submitMutation.isPending;

  return (
    <div className="play-page">
      {reveal && <BalloonReveal {...reveal} onClose={() => setReveal(null)} />}

      {/* Header */}
      <div className="play-header">
        <div className="play-logo">NUMBLE</div>
        <div className="play-meta">
          <span className="tier-badge">{user?.subscriptionStatus === 'paid' ? '⭐ SUBSCRIBER' : 'FREE'}</span>
          <span className="token-badge">
            🎟️ {ticketBalance} &nbsp;|&nbsp; <TokenIcon size={14} /> {tokenBalance.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Exchange widget — always visible */}
      <ExchangeWidget
        ticketBalance={ticketBalance}
        tokenBalance={tokenBalance}
        showToast={showToast}
      />

      {/* Spin to Win More Tokens */}
      <button className="btn-spin-to-win" onClick={() => navigate('/spin')}>Spin to Win More Tokens!</button>

      {/* Countdown */}
      <div className="countdown-card">
        <div>
          <div className="countdown-label">NEXT DRAW</div>
          <div className="countdown-time">{time || '—'}</div>
        </div>
        <div className="week-badge">WEEK<br/>{week}</div>
      </div>

      {/* Number input */}
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
        title={ticketBalance < 1 ? 'Exchange tokens for a ticket first' : ''}
      >
        {submitMutation.isPending
          ? 'SUBMITTING...'
          : ticketBalance < 1 && input.length === 3
            ? 'NEED A TICKET — EXCHANGE ABOVE'
            : 'SUBMIT ENTRY'}
      </button>

      {/* Buy More Tokens */}
      <button
        className="btn-buy-tokens-slim"
        onClick={() => buyTokensMutation.mutate()}
        disabled={buyTokensMutation.isPending}
      >
        {buyTokensMutation.isPending ? 'Loading...' : <><TokenIcon size={13} /> Buy More Tokens — 3,500 for $9.99</>}
      </button>

      {/* How it works explainer — shown before first entry */}
      {entries.length === 0 && tokenBalance > 0 && (
        <div className="play-explainer">
          <div className="play-explainer-row"><span className="play-explainer-icon">🎯</span><span>Pick any number 000–999. If it's drawn Monday, you win.</span></div>
          <div className="play-explainer-row"><span className="play-explainer-icon">💸</span><span>Pick the winning number and take home real cash — up to $1,000.</span></div>
          <div className="play-explainer-row"><span className="play-explainer-icon">🎁</span><span>Refer friends and get a 10% bonus on top of their winnings — forever.</span></div>
        </div>
      )}

      {/* Referral nudge — shown after first entry */}
      {entries.length > 0 && user?.referralCode && (
        <div className="referral-nudge" onClick={() => {
          const code = user.referralCode;
          const msg = `I've been playing Numble — pick a 3-digit number each week and win real cash. Use my code ${code} when you sign up and I get a 10% bonus on top of whatever you win (doesn't affect your prize). Play free at numble.io`;
          if (navigator.share) {
            navigator.share({ title: 'Play Numble', text: msg, url: 'https://numble.io' }).catch(() => {});
          } else {
            navigator.clipboard?.writeText(msg).catch(() => {});
          }
        }}>
          <span className="nudge-icon">🎁</span>
          <div className="nudge-text">
            <div className="nudge-title">Know someone lucky?</div>
            <div className="nudge-sub">Share your code <strong>{user.referralCode}</strong> — get a 10% bonus on top of whatever they win, <strong>forever.</strong></div>
          </div>
          <span className="nudge-arrow">›</span>
        </div>
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
