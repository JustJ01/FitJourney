
import AuthGuard from '@/components/shared/AuthGuard';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Messages',
};

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="h-[calc(100vh-10rem)]">
        {children}
      </div>
    </AuthGuard>
  );
}
