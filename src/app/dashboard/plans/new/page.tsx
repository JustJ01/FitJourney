
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

  const handleSubmit = async (data: PlanFormData) => {
    if (!user || user.role !== 'trainer') {
      toast({ title: "Error", description: "You must be logged in as a trainer to create plans.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      // Ensure exercises has necessary fields, even if empty from form
      const exercisesToSave = (data.exercises || []).map(ex => ({
        name: ex.name,
        dayOfWeek: ex.dayOfWeek,
        sets: ex.sets,
        reps: ex.reps,
        instructions: ex.instructions || "", // Ensure instructions is a string
      }));

      const planDataForApi = {
        ...data,
        trainerId: user.id,
      };

      const newPlan = await createPlan(planDataForApi, exercisesToSave);
      toast({ title: "Plan Created!", description: `${newPlan.name} has been successfully created.` });
      router.push(`/dashboard/plans/${newPlan.id}/edit`); // Redirect to the new plan's edit page
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
