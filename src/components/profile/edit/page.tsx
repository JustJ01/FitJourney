
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
import { UserCog, Save, ImageUp, Trash2 } from 'lucide-react';
import Image from 'next/image';

const commonProfileSchemaBase = {
  name: z.string().min(1, "Name is required."),
};

const memberFormSchema = z.object({
  ...commonProfileSchemaBase,
});

const trainerFormSchema = z.object({
  ...commonProfileSchemaBase,
  bio: z.string().optional(),
  specializations: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberFormSchema>;
type TrainerFormData = z.infer<typeof trainerFormSchema>;

export default function EditProfilePage() {
  const { user, updateUserProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [markAvatarForRemoval, setMarkAvatarForRemoval] = useState(false);

  const isTrainer = user?.role === 'trainer';
  const currentSchema = isTrainer ? trainerFormSchema : memberFormSchema;

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
        }),
      });
      if (user.avatarUrl) {
        setAvatarPreview(user.avatarUrl);
      } else {
        setAvatarPreview(null);
      }
    }
  }, [user, form, isTrainer]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setMarkAvatarForRemoval(false); 
    }
  };

  const handleRemoveAvatar = async () => {

    setAvatarFile(null);
    setAvatarPreview(null);
    setMarkAvatarForRemoval(true);
    toast({ title: "Avatar Marked for Removal", description: "Save changes to remove your avatar." });
  };

  const onSubmit = async (data: MemberFormData | TrainerFormData) => {
    if (!user) return;
    setLocalIsSubmitting(true);

    let uploadedAvatarUrl: string | undefined = user.avatarUrl;
    let avatarShouldBeRemoved = markAvatarForRemoval;

    if (avatarFile) {
      const formData = new FormData();
      formData.append('file', avatarFile);
      try {
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Avatar upload failed');
        }
        const result = await response.json();
        uploadedAvatarUrl = result.secure_url;
        avatarShouldBeRemoved = false; 
      } catch (error) {
        console.error("Failed to upload avatar:", error);
        toast({ title: "Avatar Upload Failed", description: (error as Error).message, variant: "destructive" });
        setLocalIsSubmitting(false);
        return;
      }
    } else if (markAvatarForRemoval) {
      uploadedAvatarUrl = ""; 
    }

    try {
      let updatePayload: UserProfileUpdateData | TrainerProfileUpdateData;

      if (isTrainer) {
        const trainerData = data as TrainerFormData;
        updatePayload = {
          name: trainerData.name,
          bio: trainerData.bio,
          specializations: trainerData.specializations?.split(',').map(s => s.trim()).filter(s => s) || [],
          avatarUrl: uploadedAvatarUrl,
        };
      } else { 
        const memberData = data as MemberFormData;
        updatePayload = {
          name: memberData.name,
          avatarUrl: uploadedAvatarUrl,
        };
      }
      
      delete (updatePayload as any).avatarFile;

      await updateUserProfile(updatePayload);
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      setAvatarFile(null);
      setMarkAvatarForRemoval(false);
      router.push('/profile');
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({ title: "Update Failed", description: "Could not update your profile. Please try again.", variant: "destructive" });
    } finally {
      setLocalIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return <p>Loading profile...</p>; 
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

          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                <Image src={avatarPreview} alt="Avatar preview" width={80} height={80} className="rounded-full object-cover aspect-square" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  <ImageUp className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-grow space-y-2">
                <Input id="avatarFile" type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} className="text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                <p className="text-xs text-muted-foreground">Max 2MB. PNG, JPG, WEBP accepted.</p>
              </div>
              {(user.avatarUrl || avatarPreview) && ( 
                <Button type="button" variant="ghost" size="icon" onClick={handleRemoveAvatar} aria-label="Remove avatar" className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
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
                <Input id="specializations" {...form.register('specializations')} placeholder="e.g., Weight Loss, Strength Training, Yoga"/>
                {form.formState.errors.specializations && <p className="text-sm text-destructive mt-1">{(form.formState.errors.specializations as any)?.message}</p>}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={localIsSubmitting || authLoading} className="w-full sm:w-auto" size="lg">
            <Save className="mr-2 h-5 w-5"/>
            {(localIsSubmitting || authLoading) ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
