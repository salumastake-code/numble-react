import { create } from 'zustand';

const useStore = create((set) => ({
  // Auth
  token: localStorage.getItem('numble_token'),
  setToken: (token) => { localStorage.setItem('numble_token', token); set({ token }); },
  clearToken: () => { localStorage.removeItem('numble_token'); localStorage.removeItem('numble_refresh'); set({ token: null }); },

  // User
  user: null,
  setUser: (user) => set({ user }),

  // Draw
  draw: null,
  setDraw: (draw) => set({ draw }),

  // Entries for current draw
  entries: [],
  setEntries: (entries) => set({ entries }),

  // Token balance
  tokenBalance: 0,
  ticketBalance: 0,
  setTokenBalance: (tokenBalance) => set({ tokenBalance }),
  setTicketBalance: (ticketBalance) => set({ ticketBalance }),

  // Leaderboard
  leaderboard: [],
  setLeaderboard: (leaderboard) => set({ leaderboard }),

  // UI
  toast: null,
  showToast: (msg, type = 'info') => {
    set({ toast: { msg, type } });
    setTimeout(() => set({ toast: null }), 3000);
  },

  // Balloon reveal
  reveal: null,
  setReveal: (reveal) => set({ reveal }),
  clearReveal: () => set({ reveal: null }),
}));

export default useStore;
