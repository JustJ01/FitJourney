
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PlanForm, { type PlanFormData } from '@/components/dashboard/PlanForm';
import { useAuth } from '@/hooks/useAuth';
import { getPlanById, updatePlan } from '@/lib/data';
import type { Plan } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EditPlanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;

  const [initialPlanData, setInitialPlanData] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (planId) {
      const fetchPlan = async () => {
        setLoading(true);
        setError(null);
        try {
          const plan = await getPlanById(planId);
          if (plan) {
            if (user && plan.trainerId !== user.id) {
                 setError("You are not authorized to edit this plan.");
                 setInitialPlanData(null); 
            } else {
                 setInitialPlanData(plan);
            }
          } else {
            setError("Plan not found.");
          }
        } catch (err) {
          console.error("Failed to fetch plan:", err);
          setError("Failed to load plan data.");
        } finally {
          setLoading(false);
        }
      };
      fetchPlan();
    }
  }, [planId, user]);

  const handleSubmit = async (data: PlanFormData, newImageUrl?: string, removeImage?: boolean) => {
    if (!user || user.role !== 'trainer' || !initialPlanData) {
      toast({ title: "Error", description: "Unauthorized or plan data missing.", variant: "destructive" });
      return;
    }
    if (initialPlanData.trainerId !== user.id) {
      toast({ title: "Authorization Error", description: "You cannot edit this plan.", variant: "destructive" });
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

      
      const planDataForApi = { ...data }; 
      delete (planDataForApi as any).trainerId;

 
      
      const finalImageUrl = newImageUrl !== undefined ? newImageUrl : (removeImage ? "" : initialPlanData.imageUrl);
      
      planDataForApi.imageUrl = finalImageUrl;


      await updatePlan(planId, planDataForApi, exercisesToSave);
      toast({ title: "Plan Updated!", description: `${data.name} has been successfully updated.` });
      router.push('/dashboard');
    } catch (error) {
      console.error("Failed to update plan:", error);
      toast({ title: "Update Failed", description: "Could not update the plan. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-16 w-1/2" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-12 w-32" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!initialPlanData) {
    return <p>Plan not found or you are not authorized to edit it.</p>;
  }
  
  if (!user || user.role !== 'trainer') {
     return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>You must be logged in as a trainer to edit this plan.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PlanForm
        initialData={initialPlanData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Update Plan"
      />
    </div>
  );
}
