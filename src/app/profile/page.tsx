
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, User, Briefcase, Type, Award, Edit3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full mb-2" />
            <Skeleton className="h-8 w-48 mb-1" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-8 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    // This should ideally be handled by AuthGuard, but as a fallback:
    return <p>Please log in to view your profile.</p>;
  }

  const userNameInitial = user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');
  const isTrainer = user.role === 'trainer';
  const trainerUser = user as Trainer; // Type assertion for easier access to trainer fields

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="items-center text-center relative">
          <Button asChild variant="outline" size="sm" className="absolute top-4 right-4">
            <Link href="/profile/edit">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
            </Link>
          </Button>
          <Avatar className="h-24 w-24 mb-2 border-4 border-primary">
            {trainerUser.avatarUrl && <AvatarImage src={trainerUser.avatarUrl} alt={user.name || 'User Avatar'} />}
            <AvatarFallback className="text-4xl bg-primary/20">{userNameInitial}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold text-primary">{user.name || 'User Profile'}</CardTitle>
          <CardDescription className="text-lg">Your personal account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md">
            <User className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium text-lg">{user.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md">
            <Mail className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Email Address</p>
              <p className="font-medium text-lg">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md">
            <Briefcase className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant={isTrainer ? "default" : "secondary"} className="text-md capitalize">
                {user.role}
              </Badge>
            </div>
          </div>

          {isTrainer && trainerUser.bio && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-md">
              <div className="flex items-center space-x-3">
                <Type className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p className="font-medium text-md italic">{trainerUser.bio}</p>
                </div>
              </div>
            </div>
          )}

          {isTrainer && trainerUser.specializations && trainerUser.specializations.length > 0 && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-md">
               <div className="flex items-center space-x-3 mb-2">
                <Award className="h-6 w-6 text-primary" />
                <p className="text-sm text-muted-foreground">Specializations</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {trainerUser.specializations.map((spec: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-sm">{spec}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
