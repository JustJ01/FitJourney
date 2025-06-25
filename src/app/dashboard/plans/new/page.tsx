
"use client";

import PlanForm, { type PlanFormData } from '@/components/dashboard/PlanForm';
import { useAuth } from '@/hooks/useAuth';
import { createPlan } from '@/lib/data';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CreatePlanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: PlanFormData, newImageUrl?: string) => {
    if (!user || user.role !== 'trainer') {
      toast({ title: "Error", description: "You must be logged in as a trainer to create plans.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const exercisesToSave = (data.exercises || []).map(ex => ({
        name: ex.name,
        dayOfWeek: ex.dayOfWeek,
        sets: ex.sets,
        reps: ex.reps,
        instructions: ex.instructions || "", 
      }));

      const planDataForApi = {
        ...data, // This includes name, description, etc. from the form
        trainerId: user.id,
        // imageUrl is now part of `data` from PlanForm, potentially updated by Cloudinary upload
        // or it's the initialData.imageUrl if not changed
      };
      
      // If a newImageUrl is provided (from Cloudinary upload), use it.
      // Otherwise, data.imageUrl (which could be from initialData or empty if user cleared) is used.
      if (newImageUrl !== undefined) {
        planDataForApi.imageUrl = newImageUrl;
      }


      const newPlan = await createPlan(planDataForApi, exercisesToSave);
      toast({ title: "Plan Created!", description: `${newPlan.name} has been successfully created.` });
      router.push('/dashboard'); 
    } catch (error) {
      console.error("Failed to create plan:", error);
      toast({ title: "Creation Failed", description: "Could not create the plan. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!user || user.role !== 'trainer') {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>You must be logged in as a trainer to create a new plan.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PlanForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitButtonText="Create Plan"/>
    </div>
  );
}
