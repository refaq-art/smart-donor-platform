import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-beige-light to-white px-6 text-center geo-pattern">
      <span className="mb-4 inline-block rounded-full bg-forest-100 px-4 py-1 text-xs font-bold text-forest-600">
        منصة أثر كفالتك
      </span>
      <h1 className="max-w-2xl text-3xl font-extrabold leading-tight text-forest-900 sm:text-4xl">
        تقرير أثر تفاعلي مخصص لكل كافل
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-forest-600">
        رحلة قصيرة ومؤثرة يقودها طفل تمثيلي، تُظهر لكبار الكفلاء كيف صنع دعمهم فرقًا حقيقيًا في
        حياة الأيتام — بدل تقرير PDF تقليدي أو لوحة أرقام جامدة.
      </p>
      <div className="mt-8">
        <Link href="/admin/login">
          <Button size="lg">الدخول إلى لوحة الإدارة</Button>
        </Link>
      </div>
      <p className="mt-10 text-xs text-forest-400">
        تقارير الكفلاء متاحة فقط عبر روابطهم الخاصة المرسلة من الجمعية.
      </p>
    </div>
  );
}
