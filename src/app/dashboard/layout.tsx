
import AuthGuard from '@/components/shared/AuthGuard';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Trainer Dashboard',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={['trainer']}>
      <div className="space-y-6">
        {/* Dashboard specific layout elements can go here, like a sub-nav if needed */}
        {/* For now, AuthGuard handles protection, main AppLayout handles overall structure */}
        {children}
      </div>
    </AuthGuard>
  );
}
