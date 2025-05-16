
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const MainNav = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const routes = [
    { href: '/plans', label: 'Plan Explorer', active: pathname === '/plans' || pathname.startsWith('/plans/') },
    { href: '/ai-generator', label: 'AI Plan Generator', active: pathname === '/ai-generator' },
  ];

  if (user?.role === 'trainer') {
    routes.push({ href: '/dashboard', label: 'Trainer Dashboard', active: pathname.startsWith('/dashboard') });
  }

  return (
    <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
      {routes.map((route) => (
        <Button
          key={route.href}
          variant="ghost"
          asChild
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            route.active ? "text-primary" : "text-foreground/70"
          )}
        >
          <Link href={route.href}>{route.label}</Link>
        </Button>
      ))}
    </nav>
  );
};

export default MainNav;
