
"use client";

import { useState, useEffect } from 'react';
import type { Plan } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { getPlansByTrainerId, deletePlan as deletePlanData } from '@/lib/data';
import PlanListItem from '@/components/dashboard/PlanListItem';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, LayoutGrid, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function TrainerDashboardPage() {
  const { user } = useAuth();
  const [trainerPlans, setTrainerPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'trainer') {
      const fetchPlans = async () => {
        setLoading(true);
        try {
          const plans = await getPlansByTrainerId(user.id);
          setTrainerPlans(plans);
        } catch (error) {
          console.error("Failed to fetch trainer plans:", error);
          toast({ title: "Error", description: "Could not load your plans.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };
      fetchPlans();
    } else {
      setLoading(false); // Should be handled by AuthGuard, but good practice
    }
  }, [user]);

  const handleDeletePlan = async (planId: string) => {
    try {
      await deletePlanData(planId);
      setTrainerPlans(prevPlans => prevPlans.filter(p => p.id !== planId));
      toast({ title: "Plan Deleted", description: "The plan has been successfully deleted." });
    } catch (error) {
      console.error("Failed to delete plan:", error);
      toast({ title: "Error", description: "Could not delete the plan.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }
  
  if (!user || user.role !== 'trainer') {
     // This case should ideally be handled by AuthGuard and redirect.
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>You must be logged in as a trainer to view this page.</AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                <LayoutGrid className="h-7 w-7"/>
                Trainer Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage your fitness plans and exercises.</p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/plans/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Plan
          </Link>
        </Button>
      </header>

      {trainerPlans.length > 0 ? (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Your Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainerPlans.map((plan) => (
              <PlanListItem key={plan.id} plan={plan} onDelete={handleDeletePlan} />
            ))}
          </div>
        </section>
      ) : (
        <Alert className="bg-card border-primary/30">
          <AlertTriangle className="h-5 w-5 text-primary" />
          <AlertTitle className="font-semibold">No Plans Yet!</AlertTitle>
          <AlertDescription>
            You haven't created any fitness plans. Get started by clicking the "Create New Plan" button.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
