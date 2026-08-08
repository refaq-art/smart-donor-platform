'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, MessageCircle, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ALLOWED_ROOM_REACTIONS } from '@/multiplayer/types';
import type { RoomChatMessage } from '@/multiplayer/types';
import type { FloatingReaction } from '@/multiplayer/useRoomSocket';

export function RoomChatPanel({
  messages,
  reactions,
  onSendChat,
  onSendReaction,
  spectatorCount,
}: {
  messages: RoomChatMessage[];
  reactions: FloatingReaction[];
  onSendChat?: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  spectatorCount?: number;
}) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed || !onSendChat) return;
    onSendChat(trimmed);
    setDraft('');
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-white/70">
          <MessageCircle size={16} /> الدردشة
        </h3>
        {typeof spectatorCount === 'number' && spectatorCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-white/40">
            <Eye size={13} /> {spectatorCount.toLocaleString('ar')} مشاهد
          </span>
        )}
      </div>

      <div ref={listRef} data-testid="room-chat-messages" className="mb-3 flex max-h-40 flex-col gap-1.5 overflow-y-auto text-sm">
        {messages.length === 0 && <p className="py-3 text-center text-xs text-white/30">لا توجد رسائل بعد</p>}
        {messages.map((m) => (
          <div key={m.id} className="flex items-start gap-1.5">
            <span>{m.avatarEmoji}</span>
            <span className="font-bold text-white/80">
              {m.displayName}
              {m.isSpectator && <span className="mr-1 text-[10px] font-normal text-white/30">(مشاهد)</span>}:
            </span>
            <span className="text-white/60 break-words">{m.text}</span>
          </div>
        ))}
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {ALLOWED_ROOM_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            data-testid="room-reaction-button"
            onClick={() => onSendReaction(emoji)}
            className="rounded-full bg-white/5 px-2.5 py-1 text-lg transition hover:scale-110 hover:bg-white/10"
            aria-label={`تفاعل ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {onSendChat && (
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            maxLength={200}
            placeholder="اكتب رسالة..."
            data-testid="room-chat-input"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none focus:border-arena-primary2"
          />
          <button
            type="button"
            onClick={submit}
            data-testid="room-chat-send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-gradient"
            aria-label="إرسال"
          >
            <Send size={15} />
          </button>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex flex-col items-center gap-1">
        <AnimatePresence>
          {reactions.slice(-4).map((r) => (
            <motion.span
              key={r.id}
              initial={{ opacity: 0, y: 10, scale: 0.6 }}
              animate={{ opacity: 1, y: -30, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6 }}
              className="text-2xl"
            >
              {r.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}
