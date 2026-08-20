import Link from "next/link";
import { GraduationCap, Facebook, Instagram, Twitter } from "lucide-react";
import { DEFAULT_CATEGORIES } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="container-app grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2 font-black text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg">منصّة الدورات</span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            منصة عربية لاستعراض والتسجيل في دورات مجانية متنوعة، مصمَّمة لتكون بسيطة وسهلة لكل
            الأعمار والخلفيات.
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href="#"
              aria-label="تابعنا على تويتر"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-brand-50 hover:text-brand-600"
            >
              <Twitter className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#"
              aria-label="تابعنا على انستغرام"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-brand-50 hover:text-brand-600"
            >
              <Instagram className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#"
              aria-label="تابعنا على فيسبوك"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-brand-50 hover:text-brand-600"
            >
              <Facebook className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-black text-ink">روابط سريعة</h3>
          <ul className="space-y-2 text-sm text-slate-500">
            <li>
              <Link href="/" className="hover:text-brand-600">
                الرئيسية
              </Link>
            </li>
            <li>
              <Link href="/courses" className="hover:text-brand-600">
                جميع الدورات
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-brand-600">
                إنشاء حساب
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-brand-600">
                تسجيل الدخول
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-black text-ink">التصنيفات</h3>
          <ul className="space-y-2 text-sm text-slate-500">
            {DEFAULT_CATEGORIES.slice(0, 5).map((cat) => (
              <li key={cat.slug}>
                <Link href={`/courses?category=${cat.slug}`} className="hover:text-brand-600">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-black text-ink">تواصل معنا</h3>
          <ul className="space-y-2 text-sm text-slate-500">
            <li>info@courses-platform.example</li>
            <li>الأحد - الخميس، 9 صباحًا - 5 مساءً</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200 py-5">
        <p className="container-app text-center text-xs text-slate-400">
          © {new Date().getFullYear()} منصّة الدورات. جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}
