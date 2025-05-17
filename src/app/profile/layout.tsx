
import AuthGuard from '@/components/shared/AuthGuard';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'My Profile',
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard> {/* Protects all routes within /profile */}
      <div className="space-y-6">
        {children}
      </div>
    </AuthGuard>
  );
}
