import Link from "next/link";
import { Plus, Search, Pencil } from "lucide-react";
import { listSponsors } from "@/lib/data/admin";
import { deleteSponsor } from "@/app/actions/sponsors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteButton } from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function SponsorsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const sponsors = await listSponsors(searchParams.q);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-forest-900">الكفلاء</h1>
        <Link href="/admin/sponsors/new">
          <Button>
            <Plus className="h-4 w-4" />
            إضافة كافل
          </Button>
        </Link>
      </div>

      <form className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-300" />
        <Input name="q" defaultValue={searchParams.q} placeholder="ابحث بالاسم أو الجوال أو رقم الكافل" className="pr-9" />
      </form>

      <div className="overflow-hidden rounded-xl2 border border-forest-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-forest-50 text-forest-500">
            <tr>
              <th className="p-4 text-right font-semibold">الاسم</th>
              <th className="p-4 text-right font-semibold">رقم الكافل</th>
              <th className="p-4 text-right font-semibold">الجوال</th>
              <th className="p-4 text-right font-semibold">البريد</th>
              <th className="p-4 text-right font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {sponsors.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-forest-400">
                  لا يوجد كفلاء بعد.
                </td>
              </tr>
            ) : (
              sponsors.map((s) => (
                <tr key={s.id} className="border-t border-forest-50">
                  <td className="p-4 font-semibold text-forest-800">
                    {s.honorific} {s.full_name}
                  </td>
                  <td className="p-4 text-forest-500" dir="ltr">{s.sponsor_number ?? "—"}</td>
                  <td className="p-4 text-forest-500" dir="ltr">{s.phone ?? "—"}</td>
                  <td className="p-4 text-forest-500" dir="ltr">{s.email ?? "—"}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/sponsors/${s.id}/edit`}
                        className="rounded-lg p-2 text-forest-500 hover:bg-forest-50"
                        aria-label="تعديل"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <DeleteButton
                        action={deleteSponsor.bind(null, s.id)}
                        confirmMessage={`هل تريد حذف الكافل "${s.full_name}"؟`}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
