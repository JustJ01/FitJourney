
"use client"; // Added to ensure this component and its children are client-side

import Logo from './Logo';
import MainNav from './MainNav';
import UserNav from './UserNav';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth'; 

const Header = () => {
  // MobileNavClientWrapper is already a client component due to its own "use client"
  // and useAuth call within it. This parent component being client ensures correct context.

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Logo />
        </div>
        <MainNav />
        <div className="flex items-center gap-2">
          <UserNav />
          <div className="md:hidden">
            <MobileNavClientWrapper />
          </div>
        </div>
      </div>
    </header>
  );
};

// Wrapper to ensure MobileNav part is client component
const MobileNavClientWrapper = () => {
  // This component already correctly has "use client" via its own definition if it were in a separate file,
  // or implicitly because it uses a hook (useAuth).
  // Explicit "use client" in parent Header ensures no ambiguity.
  const { user } = useAuth();
    
  const routes = [
    { href: '/', label: 'Home'},
    { href: '/plans', label: 'Plan Explorer' },
    { href: '/ai-generator', label: 'AI Plan Generator' },
  ];
  if (user?.role === 'trainer') {
    routes.push({ href: '/dashboard', label: 'Trainer Dashboard' });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <nav className="grid gap-6 text-lg font-medium mt-8 px-4">
          <SheetTrigger asChild><Logo /></SheetTrigger>
          {routes.map(route => (
            <SheetTrigger key={route.href} asChild>
              <Link
                href={route.href}
                className="text-muted-foreground hover:text-foreground py-2"
              >
                {route.label}
              </Link>
            </SheetTrigger>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}


export default Header;
