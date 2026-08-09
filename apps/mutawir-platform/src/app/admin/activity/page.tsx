import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminActivityPage() {
  await requireUser(["ADMIN"]);
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { organization: true, actor: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-navy-900">سجل النشاط</h1>
      <div className="card divide-y divide-slate-100">
        {logs.map((log) => (
          <div key={log.id} className="py-2.5 text-sm">
            <div className="text-xs text-slate-400">{log.createdAt.toLocaleString("ar-SA")}</div>
            <div>
              <span className="font-medium text-slate-700">{log.actor?.name ?? "النظام"}</span>
              {" — "}
              {log.action}
              {log.organization && <span className="text-slate-500"> · {log.organization.name}</span>}
            </div>
          </div>
        ))}
        {logs.length === 0 && <p className="py-4 text-center text-sm text-slate-400">لا يوجد نشاط بعد.</p>}
      </div>
    </div>
  );
}
