
import AuthGuard from '@/components/shared/AuthGuard';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'My Progress',
};

export default function ProgressLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={['member']}>
      <div className="space-y-6">
        {children}
      </div>
    </AuthGuard>
  );
}
