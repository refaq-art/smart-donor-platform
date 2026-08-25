import Link from "next/link";
import { FileText, Send, Eye, TrendingUp, Gauge, AlertCircle } from "lucide-react";
import { getDashboardStats } from "@/lib/data/admin";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-600">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="text-2xl font-extrabold text-forest-900">{value}</div>
          <div className="text-xs font-medium text-forest-400">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-forest-900">لوحة المؤشرات</h1>
        <p className="mt-1 text-sm text-forest-500">نظرة عامة على تقارير الأثر ومشاهدات الكفلاء.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={FileText} label="إجمالي التقارير" value={stats.totalReports} />
        <StatCard icon={Send} label="التقارير المرسلة" value={stats.sentReports} />
        <StatCard icon={Eye} label="تمت مشاهدتها" value={stats.viewedReports} />
        <StatCard icon={TrendingUp} label="نسبة المشاهدة" value={`${stats.viewRate}%`} />
        <StatCard icon={Gauge} label="متوسط إكمال الجولة" value={`${stats.avgJourneyCompletion}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <h2 className="font-bold text-forest-800">كفلاء لم يشاهدوا التقرير</h2>
            </div>
            {stats.notViewedSponsors.length === 0 ? (
              <p className="text-sm text-forest-400">لا يوجد — الجميع شاهدوا تقاريرهم.</p>
            ) : (
              <ul className="divide-y divide-forest-50">
                {stats.notViewedSponsors.map((s) => (
                  <li key={s.report_token} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-semibold text-forest-700">{s.sponsor_name}</span>
                    <Link
                      href={`/admin/reports`}
                      className="text-xs font-bold text-forest-500 underline underline-offset-4"
                    >
                      عرض
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Eye className="h-4 w-4 text-forest-600" />
              <h2 className="font-bold text-forest-800">أحدث المشاهدات</h2>
            </div>
            {stats.recentViews.length === 0 ? (
              <p className="text-sm text-forest-400">لا توجد مشاهدات بعد.</p>
            ) : (
              <ul className="divide-y divide-forest-50">
                {stats.recentViews.map((v, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-semibold text-forest-700">{v.sponsor_name}</span>
                    <span className="text-xs text-forest-400">{formatDate(v.last_seen_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
