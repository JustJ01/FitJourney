
import Logo from './Logo';
import MainNav from './MainNav';
import UserNav from './UserNav';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth'; // Corrected path

const Header = () => {
  // Cannot use useAuth directly here as Header might be a Server Component if AppLayout is.
  // Instead, MainNav and UserNav which are client components can use useAuth.
  // For mobile nav, we can pass necessary info or make it a client component.

  // For simplicity here, assume Header can be client component or its children (MainNav, UserNav) handle auth context.
  // The following is for mobile navigation and needs client-side state if auth context is used.
  // If Header must remain a server component, mobile nav needs a different approach for dynamic links.
  // Let's assume Header is fine as client component wrapper or its children are client components.

  const MobileNav = () => {
    // This part needs to be a client component to use hooks like useAuth and useState
    // For this structure, Header itself or this MobileNav would need "use client"
    // To keep Header potentially server-side, mobile nav might be better as a separate client component.
    // However, for now, embedding it and ensuring Header is effectively client component is fine.
    const { user } = useAuth(); // Now it's okay as UserNav and MainNav are client too.
    
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
          <nav className="grid gap-6 text-lg font-medium mt-8">
            <Logo />
            {routes.map(route => (
              <Link
                key={route.href}
                href={route.href}
                className="text-muted-foreground hover:text-foreground"
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    );
  };


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
             {/* This requires Header or MobileNav to be client component. Assuming it for now. */}
            <MobileNavClientWrapper />
          </div>
        </div>
      </div>
    </header>
  );
};

// Wrapper to ensure MobileNav part is client component
const MobileNavClientWrapper = () => {
  "use client"; // This makes MobileNavClientWrapper and its children client components
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
