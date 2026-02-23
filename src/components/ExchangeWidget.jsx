import { useState } from 'react';
import { api } from '../lib/api';
import TokenIcon from './TokenIcon';
import './ExchangeWidget.css';

const TOKENS_PER_TICKET = 1000;

export default function ExchangeWidget({ tokenBalance, onSuccess, showToast }) {
  const tickets = Math.floor(tokenBalance / TOKENS_PER_TICKET);
  const spareTokens = tokenBalance % TOKENS_PER_TICKET;
  const [loading, setLoading] = useState(false);

  async function exchange(direction, amount = 1) {
    if (loading) return;
    setLoading(true);
    try {
      await api.post('/profile/exchange', { direction, amount });
      onSuccess();
      if (direction === 'tokens_to_tickets') {
        showToast(`🎟️ ${amount} ticket${amount > 1 ? 's' : ''} added!`, 'success');
      } else {
        showToast(`# ${(amount * TOKENS_PER_TICKET).toLocaleString()} tokens restored!`, 'success');
      }
    } catch (e) {
      showToast(e.message || 'Exchange failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="exchange-widget">
      <div className="exchange-widget-title">Exchange</div>
      <div className="exchange-widget-balances">
        <div className="exchange-balance-item">
          <span className="exchange-balance-icon">🎟️</span>
          <span className="exchange-balance-val">{tickets}</span>
          <span className="exchange-balance-label">Tickets</span>
        </div>
        <div className="exchange-arrows">⇄</div>
        <div className="exchange-balance-item">
          <span className="exchange-balance-icon"><TokenIcon size={22} /></span>
          <span className="exchange-balance-val">{tokenBalance.toLocaleString()}</span>
          <span className="exchange-balance-label">Tokens</span>
        </div>
      </div>

      <div className="exchange-rate">1 ticket = 1,000 tokens</div>

      <div className="exchange-actions">
        {/* Tokens → Ticket */}
        <button
          className="exchange-btn tokens-to-ticket"
          onClick={() => exchange('tokens_to_tickets', 1)}
          disabled={loading || tokenBalance < TOKENS_PER_TICKET}
          title={tokenBalance < TOKENS_PER_TICKET ? `Need ${TOKENS_PER_TICKET.toLocaleString()} tokens` : ''}
        >
          {loading ? '...' : <><TokenIcon size={14} /> 1,000 → 🎟️ 1</>}
        </button>

        {/* Ticket → Tokens */}
        <button
          className="exchange-btn ticket-to-tokens"
          onClick={() => exchange('tickets_to_tokens', 1)}
          disabled={loading || tickets < 1}
          title={tickets < 1 ? 'No tickets to exchange' : ''}
        >
          {loading ? '...' : <>🎟️ 1 → <TokenIcon size={14} /> 1,000</>}
        </button>
      </div>
    </div>
  );
}
