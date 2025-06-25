
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, User, Briefcase, Type, Award, Edit3, Cake, Weight, Ruler, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Trainer } from '@/types';

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
    return <p>Please log in to view your profile.</p>;
  }

  const userNameInitial = user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');
  const isTrainer = user.role === 'trainer';
  
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
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name || 'User Avatar'} />}
            <AvatarFallback className="text-4xl bg-primary/20">{userNameInitial}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold text-primary">{user.name || 'User Profile'}</CardTitle>
          <CardDescription className="text-lg">Your personal account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md">
              <User className="h-6 w-6 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="font-medium text-md">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md">
              <Mail className="h-6 w-6 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="font-medium text-md">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md">
              <Briefcase className="h-6 w-6 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <Badge variant={isTrainer ? "default" : "secondary"} className="text-sm capitalize">
                  {user.role}
                </Badge>
              </div>
            </div>
             <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Gender</p>
                <p className="font-medium text-md capitalize">{user.gender || 'Not set'}</p>
              </div>
            </div>
          </div>
          
          <Card className="bg-muted/20">
              <CardHeader className="p-3">
                 <CardTitle className="text-base">Biometric Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 pt-0">
                  <div className="flex items-center space-x-2">
                    <Cake className="h-5 w-5 text-primary" />
                    <div>
                        <p className="text-xs text-muted-foreground">Age</p>
                        <p className="font-medium text-sm">{user.age ? `${user.age} years` : 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Weight className="h-5 w-5 text-primary" />
                    <div>
                        <p className="text-xs text-muted-foreground">Weight</p>
                        <p className="font-medium text-sm">{user.weight ? `${user.weight} kg` : 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Ruler className="h-5 w-5 text-primary" />
                    <div>
                        <p className="text-xs text-muted-foreground">Height</p>
                        <p className="font-medium text-sm">{user.height ? `${user.height} cm` : 'Not set'}</p>
                    </div>
                  </div>
              </CardContent>
          </Card>


          {isTrainer && (user as Trainer).bio && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-md">
              <div className="flex items-center space-x-3">
                <Type className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p className="font-medium text-md italic">{(user as Trainer).bio}</p>
                </div>
              </div>
            </div>
          )}

          {isTrainer && (user as Trainer).specializations && (user as Trainer).specializations!.length > 0 && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-md">
               <div className="flex items-center space-x-3 mb-2">
                <Award className="h-6 w-6 text-primary" />
                <p className="text-sm text-muted-foreground">Specializations</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(user as Trainer).specializations!.map((spec: string, index: number) => (
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
