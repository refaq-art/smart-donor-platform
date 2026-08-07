/**
 * يضمن أن كل جولة تنتهي حتى لو انقطع اتصال أحد اللاعبين أو لم يُجب أحد:
 * يُجدوَل مؤقّت خادم لكل جولة، وعند انتهائه يُسجَّل "انتهاء الوقت" تلقائيًا لأي جلسة لم تُجب بعد.
 */
const timers = new Map<string, NodeJS.Timeout>();

function key(gameId: string, roundNumber: number) {
  return `${gameId}:${roundNumber}`;
}

export function scheduleRoundTimeout(gameId: string, roundNumber: number, delayMs: number, onTimeout: () => void) {
  clearRoundTimeout(gameId, roundNumber);
  const timer = setTimeout(() => {
    timers.delete(key(gameId, roundNumber));
    onTimeout();
  }, delayMs);
  timers.set(key(gameId, roundNumber), timer);
}

export function clearRoundTimeout(gameId: string, roundNumber: number) {
  const existing = timers.get(key(gameId, roundNumber));
  if (existing) {
    clearTimeout(existing);
    timers.delete(key(gameId, roundNumber));
  }
}
