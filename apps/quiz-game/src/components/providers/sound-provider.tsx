'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export type SoundName = 'tick' | 'correct' | 'wrong' | 'win' | 'click' | 'countdown' | 'levelup';

const SOUND_FILES: Record<SoundName, string> = {
  tick: '/sounds/tick.mp3',
  correct: '/sounds/correct.mp3',
  wrong: '/sounds/wrong.mp3',
  win: '/sounds/win.mp3',
  click: '/sounds/click.mp3',
  countdown: '/sounds/countdown.mp3',
  levelup: '/sounds/levelup.mp3',
};

const MUSIC_FILE = '/sounds/bg-music.mp3';
const STORAGE_KEY = 'quiz_sound_muted';
const MUSIC_STORAGE_KEY = 'quiz_music_enabled';

interface SoundContextValue {
  muted: boolean;
  musicEnabled: boolean;
  toggleMuted: () => void;
  toggleMusic: () => void;
  play: (name: SoundName) => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const cache = useRef<Partial<Record<SoundName, HTMLAudioElement>>>({});
  const musicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMuted(localStorage.getItem(STORAGE_KEY) === '1');
    setMusicEnabled(localStorage.getItem(MUSIC_STORAGE_KEY) === '1');
  }, []);

  useEffect(() => {
    if (!musicRef.current) {
      musicRef.current = new Audio(MUSIC_FILE);
      musicRef.current.loop = true;
      musicRef.current.volume = 0.25;
    }
    const audio = musicRef.current;
    if (musicEnabled && !muted) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [musicEnabled, muted]);

  const play = useCallback(
    (name: SoundName) => {
      if (muted) return;
      try {
        let audio = cache.current[name];
        if (!audio) {
          audio = new Audio(SOUND_FILES[name]);
          cache.current[name] = audio;
        }
        audio.currentTime = 0;
        audio.play().catch(() => {
          // ملفات الصوت قد لا تكون موجودة بعد — تجاهل الخطأ بصمت
        });
      } catch {
        // بيئة بدون دعم صوت
      }
    },
    [muted]
  );

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    setMusicEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(MUSIC_STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  return (
    <SoundContext.Provider value={{ muted, musicEnabled, toggleMuted, toggleMusic, play }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound يجب أن يُستخدم داخل SoundProvider');
  return ctx;
}
