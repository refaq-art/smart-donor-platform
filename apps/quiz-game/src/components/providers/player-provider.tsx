'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export interface CurrentPlayer {
  id: string;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  totalScore: number;
  gamesPlayed: number;
  gamesWon: number;
  correctAnswers: number;
  totalAnswers: number;
  bestStreak: number;
}

interface PlayerContextValue {
  player: CurrentPlayer | null;
  isGuest: boolean;
  role: 'PLAYER' | 'ADMIN' | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<CurrentPlayer | null>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [role, setRole] = useState<'PLAYER' | 'ADMIN' | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/me', { cache: 'no-store' });
      const data = await res.json();
      setPlayer(data.player);
      setIsGuest(data.isGuest ?? true);
      setRole(data.role ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setPlayer(null);
    setRole(null);
    setIsGuest(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <PlayerContext.Provider value={{ player, isGuest, role, loading, refresh, logout }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer يجب أن يُستخدم داخل PlayerProvider');
  return ctx;
}
