
"use client"; 

import Logo from './Logo';
import MainNav from './MainNav';
import UserNav from './UserNav';
import ThemeToggleButton from './ThemeToggleButton'; 
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth'; 

const Header = () => {

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Logo />
        </div>
        <MainNav />
        <div className="flex items-center gap-2">
          <ThemeToggleButton /> {/* Add ThemeToggleButton here */}
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
         <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
          <SheetDescription>Main navigation links for the site.</SheetDescription>
        </SheetHeader>
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
