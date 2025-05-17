
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Trainer, UserProfileUpdateData, TrainerProfileUpdateData } from '@/types';
import { UserCog, Save } from 'lucide-react';

const commonProfileSchema = {
  name: z.string().min(1, "Name is required."),
};

const memberProfileSchema = z.object({
  ...commonProfileSchema,
});

const trainerProfileSchema = z.object({
  ...commonProfileSchema,
  bio: z.string().optional(),
  specializations: z.string().optional(), // Will be comma-separated string in form
  avatarUrl: z.string().url("Must be a valid URL.").or(z.literal("")).optional(),
});

type MemberFormData = z.infer<typeof memberProfileSchema>;
type TrainerFormData = z.infer<typeof trainerProfileSchema>;


export default function EditProfilePage() {
  const { user, updateUserProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTrainer = user?.role === 'trainer';
  const currentSchema = isTrainer ? trainerProfileSchema : memberProfileSchema;

  const form = useForm<MemberFormData | TrainerFormData>({
    resolver: zodResolver(currentSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        ...(isTrainer && {
          bio: (user as Trainer).bio || '',
          specializations: (user as Trainer).specializations?.join(', ') || '',
          avatarUrl: (user as Trainer).avatarUrl || '',
        }),
      });
    }
  }, [user, form, isTrainer]);

  const onSubmit = async (data: MemberFormData | TrainerFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      let updateData: UserProfileUpdateData | TrainerProfileUpdateData;

      if (isTrainer) {
        const trainerData = data as TrainerFormData;
        updateData = {
          name: trainerData.name,
          bio: trainerData.bio,
          specializations: trainerData.specializations?.split(',').map(s => s.trim()).filter(s => s) || [],
          avatarUrl: trainerData.avatarUrl,
        };
      } else {
        const memberData = data as MemberFormData;
        updateData = {
          name: memberData.name,
        };
      }

      await updateUserProfile(updateData);
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      router.push('/profile');
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({ title: "Update Failed", description: "Could not update your profile. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return <p>Loading profile...</p>; // Or a skeleton loader
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-2">
          <UserCog className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl">Edit Your Profile</CardTitle>
        <CardDescription>Update your personal information below.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...form.register('name')} />
            {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
          </div>

          {isTrainer && (
            <>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" {...form.register('bio')} placeholder="Tell us a bit about yourself and your training philosophy..." rows={4}/>
                {form.formState.errors.bio && <p className="text-sm text-destructive mt-1">{(form.formState.errors.bio as any)?.message}</p>}
              </div>
              <div>
                <Label htmlFor="specializations">Specializations (comma-separated)</Label>
                <Textarea id="specializations" {...form.register('specializations')} placeholder="e.g., Weight Loss, Strength Training, Yoga"/>
                {form.formState.errors.specializations && <p className="text-sm text-destructive mt-1">{(form.formState.errors.specializations as any)?.message}</p>}
              </div>
              <div>
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input id="avatarUrl" {...form.register('avatarUrl')} placeholder="https://example.com/avatar.png"/>
                {form.formState.errors.avatarUrl && <p className="text-sm text-destructive mt-1">{(form.formState.errors.avatarUrl as any)?.message}</p>}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting || authLoading} className="w-full sm:w-auto" size="lg">
            <Save className="mr-2 h-5 w-5"/>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
