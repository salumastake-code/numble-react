import { api } from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import TokenIcon from './TokenIcon';
import './ExchangeWidget.css';

const TOKENS_PER_TICKET = 1000;

export default function ExchangeWidget({ ticketBalance, tokenBalance, showToast }) {
  const qc = useQueryClient();

  const exchangeMutation = useMutation({
    mutationFn: ({ direction, amount }) => api.post('/profile/exchange', { direction, amount }),

    onMutate: async ({ direction, amount }) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await qc.cancelQueries({ queryKey: ['current-draw'] });
      const prev = qc.getQueryData(['current-draw']);

      // Apply optimistic balance change immediately
      qc.setQueryData(['current-draw'], (old) => {
        if (!old) return old;
        const tokens  = old.tokenBalance  ?? 0;
        const tickets = old.ticketBalance ?? 0;
        if (direction === 'tokens_to_tickets') {
          return { ...old, tokenBalance: tokens - amount * TOKENS_PER_TICKET, ticketBalance: tickets + amount };
        } else {
          return { ...old, tokenBalance: tokens + amount * TOKENS_PER_TICKET, ticketBalance: Math.max(0, tickets - amount) };
        }
      });

      return { prev };
    },

    onSuccess: (data, { direction, amount }) => {
      // Sync with authoritative server values (backend returns snake_case)
      const serverTokens  = data?.token_balance;
      const serverTickets = data?.ticket_balance;
      if (serverTokens !== undefined || serverTickets !== undefined) {
        qc.setQueryData(['current-draw'], (old) => {
          if (!old) return old;
          return {
            ...old,
            ...(serverTokens  !== undefined ? { tokenBalance:  serverTokens  } : {}),
            ...(serverTickets !== undefined ? { ticketBalance: serverTickets } : {}),
          };
        });
      } else {
        // No balance in response — background refetch
        qc.invalidateQueries({ queryKey: ['current-draw'] });
      }
      if (direction === 'tokens_to_tickets') {
        showToast(`🎟️ ${amount} ticket${amount > 1 ? 's' : ''} redeemed!`, 'success');
      } else {
        showToast(`${amount * TOKENS_PER_TICKET} tokens redeemed!`, 'success');
      }
    },

    onError: (e, _vars, context) => {
      // Roll back optimistic update
      if (context?.prev) qc.setQueryData(['current-draw'], context.prev);
      showToast(e.message || 'Exchange failed', 'error');
    },
  });

  function exchange(direction, amount = 1) {
    if (exchangeMutation.isPending) return;
    exchangeMutation.mutate({ direction, amount });
  }

  return (
    <div className="exchange-widget">
      <div className="exchange-widget-title">Exchange</div>
      <div className="exchange-widget-balances">
        <div className="exchange-balance-item">
          <span className="exchange-balance-icon">🎟️</span>
          <span className="exchange-balance-val">{ticketBalance}</span>
          <span className="exchange-balance-label">Tickets</span>
        </div>
        <div className="exchange-arrows">⇋</div>
        <div className="exchange-balance-item">
          <span className="exchange-balance-icon"><TokenIcon size={22} /></span>
          <span className="exchange-balance-val">{tokenBalance.toLocaleString()}</span>
          <span className="exchange-balance-label">Tokens</span>
        </div>
      </div>

      <div className="exchange-rate">1 ticket = 1,000 tokens</div>

      <div className="exchange-actions">
        <button
          className="exchange-btn ticket-to-tokens"
          onClick={() => exchange('tickets_to_tokens', 1)}
          disabled={exchangeMutation.isPending || ticketBalance < 1}
          title={ticketBalance < 1 ? 'No tickets to exchange' : ''}
        >
          {exchangeMutation.isPending ? '...' : <>🎟️ 1 &nbsp;→</>}
        </button>

        <button
          className="exchange-btn tokens-to-ticket"
          onClick={() => exchange('tokens_to_tickets', 1)}
          disabled={exchangeMutation.isPending || tokenBalance < TOKENS_PER_TICKET}
          title={tokenBalance < TOKENS_PER_TICKET ? `Need ${TOKENS_PER_TICKET.toLocaleString()} tokens` : ''}
        >
          {exchangeMutation.isPending ? '...' : <>←&nbsp; <TokenIcon size={14} /> 1,000</>}
        </button>
      </div>
    </div>
  );
}
