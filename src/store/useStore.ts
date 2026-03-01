import { create } from 'zustand';
import { removeCookie } from '../api/cookie';

interface User {
  user_id: number;
  login: string;
  full_name?: string;
  phone?: string;
  balance: number;
  credit: number;
  discount: number;
  bonus: number;
  gid: number;
  telegram_user_id?: number;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  telegramPhoto: string | null;
  hasNewTicketMessages: boolean;
  lastTicketCheck: number;

  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  setTelegramPhoto: (photo: string | null) => void;
  setHasNewTicketMessages: (hasNew: boolean) => void;
  setLastTicketCheck: (timestamp: number) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  telegramPhoto: localStorage.getItem('shm_telegram_photo'),
  hasNewTicketMessages: false,
  lastTicketCheck: parseInt(localStorage.getItem('shm_last_ticket_check') || '0'),

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
  }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setTelegramPhoto: (photo) => {
    if (photo) {
      localStorage.setItem('shm_telegram_photo', photo);
    } else {
      localStorage.removeItem('shm_telegram_photo');
    }
    set({ telegramPhoto: photo });
  },
  setHasNewTicketMessages: (hasNew) => set({ hasNewTicketMessages: hasNew }),
  setLastTicketCheck: (timestamp) => {
    localStorage.setItem('shm_last_ticket_check', String(timestamp));
    set({ lastTicketCheck: timestamp });
  },
  logout: () => {
    removeCookie();
    localStorage.removeItem('shm_telegram_photo');
    set({ user: null, isAuthenticated: false, telegramPhoto: null, hasNewTicketMessages: false });
  },
}));