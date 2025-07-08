
"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: Array<'member' | 'trainer'>;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login?redirect=' + window.location.pathname);
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        // User is logged in but doesn't have the required role
        // Redirect to a "not authorized" page or home page
        toast({
            title: "Access Denied",
            description: "You do not have permission to view this page.",
            variant: "destructive",
        });
        router.replace('/'); 
      }
    }
  }, [user, loading, router, allowedRoles]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null; 
  }

  return <>{children}</>;
};

import { toast } from '@/hooks/use-toast';

export default AuthGuard;
