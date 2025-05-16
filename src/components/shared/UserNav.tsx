
"use client";

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, LogOut, UserCircle, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';

const UserNav = () => {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/'); 
  };

  if (loading) {
    return <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />;
  }

  if (!user) {
    return (
      <Button asChild variant="outline">
        <Link href="/login">
          <LogIn className="mr-2 h-4 w-4" /> Login
        </Link>
      </Button>
    );
  }

  const userNameInitial = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary">
            {(user as any).avatarUrl && <AvatarImage src={(user as any).avatarUrl} alt={user.name || user.email} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {userNameInitial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
             {/* Placeholder for profile page */}
            <Link href="#"> 
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          {user.role === 'trainer' && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNav;
