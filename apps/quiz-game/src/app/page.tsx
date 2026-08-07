import Link from 'next/link';
import { QuickPlayButton } from './quick-play-button';
import { ActionCard } from './action-card';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col items-center gap-6 py-10 text-center">
        <span className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-bold text-arena-primary2">🎉 للعائلة والأصدقاء</span>
        <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
          حلبة <span className="text-gradient-primary">الأسئلة والمسابقات</span> العربية
        </h1>
        <p className="max-w-xl text-white/60">
          العب بمفردك، مع عائلتك على نفس الجهاز، أو أنشئ غرفة والعب مع أصدقائك أونلاين — تصنيفات متنوعة، مستويات
          صعوبة، نقاط، وإنجازات تنتظرك.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/play/setup">
            <Button size="xl">🎮 العب الآن</Button>
          </Link>
          <QuickPlayButton />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-extrabold">أنماط اللعب</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard href="/play/setup" icon="🎯" title="لعبة سريعة" description="جولة خاطفة من الأسئلة المتنوعة بدون إعدادات" />
          <ActionCard href="/room/create" icon="🌐" title="أنشئ غرفة" description="أنشئ غرفة خاصة والعب مع أصدقائك أونلاين عبر رمز الغرفة" />
          <ActionCard href="/room/join" icon="🔑" title="انضم لغرفة" description="أدخل رمز الغرفة وانضم لأصدقائك فورًا" />
          <ActionCard href="/play/setup?local=1" icon="📱" title="اللعب المحلي" description="تناوبوا على نفس الجهاز في أجواء العائلة" />
          <ActionCard href="/play/setup?mode=CHALLENGE" icon="💪" title="التحدي" description="صعوبة تتكيف تلقائيًا مع مستواك" />
          <ActionCard href="/categories" icon="🗂️" title="التصنيفات" description="تصفح كل التصنيفات المتاحة والأسئلة" requireAuth={false} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ActionCard href="/leaderboard" icon="🏆" title="لوحة المتصدرين" description="من الأقوى اليوم وهذا الأسبوع؟" requireAuth={false} />
        <ActionCard href="/profile" icon="👤" title="ملفي الشخصي" description="نتائجك، إنجازاتك، وسجل مبارياتك" />
      </section>
    </div>
  );
}
