
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const commonProfileSchemaBase = {
  name: z.string().min(1, "Name is required."),
  age: z.coerce.number().min(10, "Age must be at least 10.").max(120, "Age must be less than 120.").optional().or(z.literal('')),
  weight: z.coerce.number().min(30, "Weight must be at least 30kg.").max(300, "Weight must be less than 300kg.").optional().or(z.literal('')),
  height: z.coerce.number().min(100, "Height must be at least 100cm.").max(250, "Height must be less than 250cm.").optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
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
    defaultValues: {
      name: '',
      age: '',
      weight: '',
      height: '',
      gender: undefined,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        age: user.age || '',
        weight: user.weight || '',
        height: user.height || '',
        gender: user.gender,
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
      setAvatarFile(null);
      setMarkAvatarForRemoval(false);
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

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setMarkAvatarForRemoval(true);
  };

  const onSubmit = async (formData: MemberFormData | TrainerFormData) => {
    if (!user) return;
    setLocalIsSubmitting(true);

    let finalAvatarUrl: string | undefined = user.avatarUrl;
    let avatarActionTaken = false;

    if (avatarFile) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', avatarFile);
      try {
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: uploadFormData,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Avatar upload failed');
        }
        const result = await response.json();
        finalAvatarUrl = result.secure_url;
        avatarActionTaken = true;
      } catch (error) {
        console.error("Failed to upload avatar:", error);
        toast({ title: "Avatar Upload Failed", description: (error as Error).message, variant: "destructive" });
        setLocalIsSubmitting(false);
        return;
      }
    } else if (markAvatarForRemoval) {
      finalAvatarUrl = "";
      avatarActionTaken = true;
    }

    try {
      const updatePayload: Partial<UserProfileUpdateData | TrainerProfileUpdateData> = {
        name: formData.name,
        age: formData.age ? Number(formData.age) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        height: formData.height ? Number(formData.height) : undefined,
        gender: formData.gender,
      };

      if (avatarActionTaken) {
        updatePayload.avatarUrl = finalAvatarUrl;
      }

      if (isTrainer) {
        const trainerFormData = formData as TrainerFormData;
        (updatePayload as Partial<TrainerProfileUpdateData>).bio = trainerFormData.bio;
        (updatePayload as Partial<TrainerProfileUpdateData>).specializations = trainerFormData.specializations?.split(',').map(s => s.trim()).filter(s => s) || [];
      }
      
      const cleanedPayload = Object.fromEntries(
        Object.entries(updatePayload).filter(([_, v]) => v !== undefined && v !== '')
      );

      await updateUserProfile(cleanedPayload);
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {(avatarPreview || avatarFile) && (
                  <Button type="button" variant="ghost" size="icon" onClick={handleRemoveAvatar} aria-label="Remove avatar" className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Biometric Details</CardTitle>
                <CardDescription className="text-sm">This information helps in providing more accurate workout and calorie estimations. It is optional.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 28" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 75.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 180" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other / Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {isTrainer && (
              <>
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell us a bit about yourself and your training philosophy..." {...field} rows={4}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specializations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specializations (comma-separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Weight Loss, Strength Training, Yoga" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
      </Form>
    </Card>
  );
}
