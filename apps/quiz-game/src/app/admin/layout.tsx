import type { ReactNode } from 'react';
import { AdminNav } from './admin-nav';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <AdminNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
