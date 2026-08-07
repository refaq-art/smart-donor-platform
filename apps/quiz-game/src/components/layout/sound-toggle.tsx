'use client';

import { Music, Music2, Volume2, VolumeX } from 'lucide-react';
import { useSound } from '@/components/providers/sound-provider';

export function SoundToggle() {
  const { muted, musicEnabled, toggleMuted, toggleMusic } = useSound();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggleMuted}
        title={muted ? 'تفعيل الصوت' : 'كتم الصوت'}
        className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      <button
        onClick={toggleMusic}
        title={musicEnabled ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
        className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        {musicEnabled ? <Music size={18} /> : <Music2 size={18} />}
      </button>
    </div>
  );
}
