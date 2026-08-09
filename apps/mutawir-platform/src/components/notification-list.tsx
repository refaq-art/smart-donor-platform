import Link from "next/link";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/app/actions/notification-actions";

type NotificationRow = { id: string; title: string; body: string | null; link: string | null; isRead: boolean; createdAt: Date };

export function NotificationList({ notifications }: { notifications: NotificationRow[] }) {
  const unread = notifications.filter((n) => !n.isRead).length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">التنبيهات {unread > 0 && <span className="text-sm text-red-600">({unread} غير مقروءة)</span>}</h1>
        {unread > 0 && (
          <form action={markAllNotificationsReadAction}>
            <button type="submit" className="btn-ghost text-xs">تعليم الكل كمقروء</button>
          </form>
        )}
      </div>
      <div className="card divide-y divide-slate-100">
        {notifications.map((n) => (
          <div key={n.id} className={`flex items-start justify-between gap-3 py-3 ${!n.isRead ? "bg-navy-50/40" : ""}`}>
            <div>
              <Link href={n.link ?? "#"} className="font-medium text-slate-800 hover:underline">
                {n.title}
              </Link>
              {n.body && <p className="text-sm text-slate-500">{n.body}</p>}
              <p className="text-xs text-slate-400">{n.createdAt.toLocaleString("ar-SA")}</p>
            </div>
            {!n.isRead && (
              <form action={markNotificationReadAction.bind(null, n.id)}>
                <button type="submit" className="btn-ghost text-xs">تعليم كمقروء</button>
              </form>
            )}
          </div>
        ))}
        {notifications.length === 0 && <p className="py-4 text-center text-sm text-slate-400">لا توجد تنبيهات.</p>}
      </div>
    </div>
  );
}
