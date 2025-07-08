
import AuthGuard from '@/components/shared/AuthGuard';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'My Earnings',
};

export default function EarningsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={['trainer']}>
      <div className="space-y-6">
        {children}
      </div>
    </AuthGuard>
  );
}
