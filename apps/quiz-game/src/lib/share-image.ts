import type { PlayerResultRow } from '@/server/game/types';

const WIDTH = 1080;
const HEIGHT = 1350;

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** يرسم بطاقة نتيجة قابلة للمشاركة للاعب معيّن ويعيدها كـ Blob (PNG). */
export async function generateResultImage(player: PlayerResultRow, totalPlayers: number): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;

  await document.fonts.ready.catch(() => {});
  const fontFamily = getComputedStyle(document.body).fontFamily || 'sans-serif';

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // خلفية متدرجة (مطابقة لهوية التطبيق البصرية)
  const bgGradient = ctx.createRadialGradient(WIDTH / 2, -100, 100, WIDTH / 2, HEIGHT * 0.4, HEIGHT);
  bgGradient.addColorStop(0, '#2c2470');
  bgGradient.addColorStop(1, '#0b0a1f');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.textAlign = 'center';
  ctx.direction = 'rtl';

  // العنوان
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 48px ${fontFamily}`;
  ctx.fillText('🎮 حلبة الأسئلة', WIDTH / 2, 130);

  // دائرة الأفاتار
  const avatarY = 340;
  ctx.beginPath();
  ctx.arc(WIDTH / 2, avatarY, 130, 0, Math.PI * 2);
  ctx.fillStyle = player.avatarColor || '#7c5cff';
  ctx.fill();
  ctx.font = '130px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(player.avatarEmoji || '🙂', WIDTH / 2, avatarY + 10);
  ctx.textBaseline = 'alphabetic';

  // الاسم
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 56px ${fontFamily}`;
  ctx.fillText(player.displayName, WIDTH / 2, avatarY + 210);

  // المركز
  const medalOrRank = MEDALS[player.rank] ?? `#${player.rank}`;
  ctx.fillStyle = '#ffd700';
  ctx.font = `700 42px ${fontFamily}`;
  ctx.fillText(`المركز ${medalOrRank} من ${totalPlayers}`, WIDTH / 2, avatarY + 275);

  // بطاقة النقاط الكبيرة
  const cardY = 780;
  const cardH = 220;
  const cardX = 90;
  const cardW = WIDTH - cardX * 2;
  const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
  cardGradient.addColorStop(0, '#7c5cff');
  cardGradient.addColorStop(1, '#ff5ca8');
  ctx.fillStyle = cardGradient;
  roundRect(ctx, cardX, cardY, cardW, cardH, 32);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `900 96px ${fontFamily}`;
  ctx.fillText(player.score.toLocaleString('ar'), WIDTH / 2, cardY + 110);
  ctx.font = `700 34px ${fontFamily}`;
  ctx.fillText('نقطة', WIDTH / 2, cardY + 165);

  // إحصائيات إضافية
  const statsY = cardY + cardH + 100;
  const accuracy = player.totalAnswers > 0 ? Math.round((player.correctAnswers / player.totalAnswers) * 100) : 0;
  const stats: [string, string][] = [
    ['الدقة', `${accuracy.toLocaleString('ar')}%`],
    ['إجابات صحيحة', `${player.correctAnswers}/${player.totalAnswers}`],
    ['أفضل سلسلة', `${player.bestStreak.toLocaleString('ar')} 🔥`],
  ];
  const colW = cardW / stats.length;
  stats.forEach(([label, value], i) => {
    const cx = cardX + colW * i + colW / 2;
    ctx.fillStyle = '#ffd166';
    ctx.font = `800 44px ${fontFamily}`;
    ctx.fillText(value, cx, statsY);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `600 28px ${fontFamily}`;
    ctx.fillText(label, cx, statsY + 45);
  });

  // تذييل
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = `600 30px ${fontFamily}`;
  ctx.fillText('العب الآن على حلبة الأسئلة', WIDTH / 2, HEIGHT - 70);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

export async function shareOrDownloadResultImage(player: PlayerResultRow, totalPlayers: number) {
  const blob = await generateResultImage(player, totalPlayers);
  if (!blob) return;

  const fileName = `نتيجتي-حلبة-الأسئلة-${player.displayName}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'حلبة الأسئلة', text: `حصلت على ${player.score.toLocaleString('ar')} نقطة في حلبة الأسئلة! 🎮` });
      return;
    } catch {
      // المستخدم ألغى المشاركة أو فشلت — نكمل بالتنزيل كبديل
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
